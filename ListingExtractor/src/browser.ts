import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { logger } from './utils/logger.js';
import type { PartialScrapedData } from './models/index.js';
import {
  BROWSER_CONFIG,
  FACEBOOK_SELECTORS,
  VALIDATION,
  DEFAULT_VALUES,
} from './constants/index.js';

export class BrowserManager {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: BROWSER_CONFIG.HEADLESS,
        args: BROWSER_CONFIG.ARGS,
      });
    }
    return this.browser;
  }

  private async createContext(): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    return browser.newContext({
      viewport: {
        width: BROWSER_CONFIG.VIEWPORT.WIDTH,
        height: BROWSER_CONFIG.VIEWPORT.HEIGHT,
      },
      userAgent: BROWSER_CONFIG.USER_AGENT,
      locale: BROWSER_CONFIG.LOCALE,
      timezoneId: BROWSER_CONFIG.TIMEZONE,
    });
  }

  async extractListingDetails(url: string): Promise<PartialScrapedData> {
    const context = await this.createContext();
    const page = await context.newPage();
    const data: PartialScrapedData = { attributes: {} };

    try {
      logger.debug(`Navigating to: ${url}`);
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: BROWSER_CONFIG.TIMEOUT,
      });

      await page.waitForTimeout(BROWSER_CONFIG.WAIT_TIME);

      // Extract title
      data.title = await this.extractTitle(page);

      // Extract price
      const priceData = await this.extractPrice(page);
      data.price = priceData.price;
      data.currency = priceData.currency;

      // Extract year from title
      data.year = this.extractYearFromTitle(data.title);

      // Extract mileage
      data.mileage = await this.extractMileage(page);

      // Extract additional attributes
      data.attributes = await this.extractAttributes(page);

    } catch (error) {
      logger.error('Error extracting details', error);
      throw error;
    } finally {
      await context.close();
    }

    return data;
  }

  private async extractTitle(page: Page): Promise<string> {
    try {
      const title = await page.evaluate((selector: string) => {
        const h1 = document.querySelector('h1');
        if (h1) {
          const span = h1.querySelector(selector);
          return span?.textContent?.trim() || h1.textContent?.trim() || '';
        }
        return '';
      }, 'span[dir="auto"]');

      if (title && title.length > 3) {
        return title;
      }
    } catch (error) {
      logger.warn('Error extracting title', error);
    }
    return DEFAULT_VALUES.TITLE;
  }

  private async extractPrice(page: Page): Promise<{ price: number; currency: string }> {
    try {
      const priceText = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (h1) {
          let current: Element | null = h1.parentElement;
          while (current && current !== document.body) {
            const spans = current.querySelectorAll('span[dir="auto"]');
            for (const span of spans) {
              const text = span.textContent?.trim() || '';
              if (/^(PHP|₱)[\d,]+$/.test(text)) {
                return text;
              }
            }
            current = current.nextElementSibling || current.parentElement?.nextElementSibling || null;
            if (!current || current.querySelectorAll('*').length > 100) break;
          }
        }
        return '';
      });

      if (priceText) {
        const numericValue = priceText.replace(/[^\d]/g, '');
        const price = parseFloat(numericValue) || 0;
        if (price >= VALIDATION.PRICE.MIN && price <= VALIDATION.PRICE.MAX) {
          const currency = priceText.includes('$') ? 'USD' : DEFAULT_VALUES.CURRENCY;
          return { price, currency };
        }
        
        logger.warn(`Extracted price ${price} out of range`);
      }
    } catch (error) {
      logger.warn('Error extracting price', error);
    }
    return { price: DEFAULT_VALUES.PRICE, currency: DEFAULT_VALUES.CURRENCY };
  }

  private extractYearFromTitle(title: string): number | null {
    const match = title.match(/\b(19|20)\d{2}\b/);
    return match ? parseInt(match[0], 10) : null;
  }

  private async extractMileage(page: Page): Promise<number | null> {
    try {
      const mileageInfo = await page.evaluate(() => {
        const pageText = document.body.innerText;
        const kMatch = pageText.match(/(\d+)k\s*(?:km|odo|miles|mi|kilometers)?/i);
        if (kMatch) {
          return { value: kMatch[1], multiplier: 1000 };
        }
        
        // "140,000 km", "50000 miles"
        const standardMatch = pageText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:km|kilometers|miles|mi)/i);
        if (standardMatch) {
          return { value: standardMatch[1], multiplier: 1 };
        }
        
        return null;
      });

      if (mileageInfo) {
        const numericValue = parseInt(mileageInfo.value.replace(/,/g, ''), 10);
        const mileage = numericValue * mileageInfo.multiplier;
        
        if (mileage >= VALIDATION.MILEAGE.MIN && mileage <= VALIDATION.MILEAGE.MAX) {
          return mileage;
        }
      }
    } catch (error) {
      logger.warn('Error extracting mileage', error);
    }
    return null;
  }

  private async extractAttributes(page: Page): Promise<Record<string, unknown>> {
    const attributes: Record<string, unknown> = {};

    try {
      const description = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2'));
        for (const h2 of headings) {
          if (h2.textContent?.includes("Seller's description")) {
            let current: Element | null = h2.parentElement;
            while (current) {
              const span = current.querySelector('span[dir="auto"]');
              if (span) {
                const text = span.textContent?.trim() || '';
                if (text.length > 50 && !text.includes('See less') && !text.includes('See translation')) {
                  return text.substring(0, 1000);
                }
              }
              current = current.nextElementSibling;
              if (!current) break;
            }
            break;
          }
        }
        return '';
      });

      if (description) {
        attributes.description = description;
      }

      const imageUrls: string[] = await page.evaluate(() => {
        const images = document.querySelectorAll('img[src*="scontent"]');
        const urls: string[] = [];
        
        for (const img of images) {
          const src = img.getAttribute('src');
          if (src && !src.includes('/rsrc.php/') && urls.length < 10) {
            if (!urls.includes(src)) {
              urls.push(src);
            }
          }
        }
        
        return urls;
      });

      if (imageUrls.length > 0) {
        attributes.image_urls = imageUrls;
      }

      if (description) {
        const descLower = description.toLowerCase();
        if (descLower.includes('automatic') || descLower.includes('auto transmission')) {
          attributes.transmission = 'automatic';
        } else if (descLower.includes('manual')) {
          attributes.transmission = 'manual';
        }
        
        if (descLower.includes('diesel')) {
          attributes.fuel_type = 'diesel';
        } else if (descLower.includes('petrol') || descLower.includes('gasoline')) {
          attributes.fuel_type = 'petrol';
        } else if (descLower.includes('electric') || descLower.includes('ev')) {
          attributes.fuel_type = 'electric';
        } else if (descLower.includes('hybrid')) {
          attributes.fuel_type = 'hybrid';
        }
      }

    } catch (error) {
      logger.warn('Error extracting attributes', error);
    }

    return attributes;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
