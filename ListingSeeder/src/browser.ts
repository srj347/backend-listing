import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { logger } from './utils/logger.js';
import { BROWSER_CONFIG, SCROLL_CONFIG, FACEBOOK_CONFIG } from './constants/index.js';

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
      viewport: { width: BROWSER_CONFIG.VIEWPORT.WIDTH, height: BROWSER_CONFIG.VIEWPORT.HEIGHT },
      userAgent: BROWSER_CONFIG.USER_AGENT,
      locale: BROWSER_CONFIG.LOCALE,
      timezoneId: BROWSER_CONFIG.TIMEZONE,
    });
  }

  /**
   * Login to Facebook
   */
  private async loginToFacebook(page: Page): Promise<void> {
    try {
      const email = FACEBOOK_CONFIG.USERNAME;
      const password = FACEBOOK_CONFIG.PASSWORD;

      if (!email || !password) {
        logger.warn('Facebook credentials not provided, skipping login');
        return;
      }

      logger.info('Attempting to login to Facebook...');

      const isLoggedIn = await page.evaluate(() => {
        return document.querySelector('[aria-label="Account"]') !== null ||
               document.querySelector('[aria-label="Your profile"]') !== null;
      });

      if (isLoggedIn) {
        logger.info('Already logged in to Facebook');
        return;
      }

      const loginButton = await page.$(FACEBOOK_CONFIG.SELECTORS.LOGIN_BUTTON);
      
      if (loginButton) {
        logger.info('Login button found, clicking...');
        await loginButton.click();
        await page.waitForTimeout(2000);
      }

      const emailInput = await page.$(FACEBOOK_CONFIG.SELECTORS.EMAIL_INPUT);
      if (emailInput) {
        logger.info('Entering email...');
        await emailInput.fill(email);
        await page.waitForTimeout(500);
      } else {
        logger.warn('Email input not found');
      }

      const passwordInput = await page.$(FACEBOOK_CONFIG.SELECTORS.PASSWORD_INPUT);
      if (passwordInput) {
        logger.info('Entering password...');
        await passwordInput.fill(password);
        await page.waitForTimeout(500);
      } else {
        logger.warn('Password input not found');
      }

      const submitButton = await page.$(FACEBOOK_CONFIG.SELECTORS.SUBMIT_BUTTON);
      
      if (submitButton) {
        logger.info('Clicking login submit button...');
        await submitButton.click();
        
        await page.waitForTimeout(5000);
        
        logger.info('Login successful');
      } else {
        logger.warn('Submit button not found');
      }

    } catch (error) {
      logger.error(`Login failed: ${error}`);
    }
  }

  /**
   * Close Facebook login modal if it appears
   */
  private async closeLoginModal(page: any): Promise<void> {
    try {
      const dialog = await page.$(FACEBOOK_CONFIG.SELECTORS.DIALOG);
      
      if (dialog) {
        logger.info('Login dialog detected, closing...');
        
        for (const selector of FACEBOOK_CONFIG.SELECTORS.CLOSE_BUTTONS) {
          const closeButton = await dialog.$(selector);
          if (closeButton && await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(1000);
            logger.info('Dialog closed successfully');
            return;
          }
        }
        
        // Fallback - Press Escape key
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
    } catch (error) {
      logger.warn(`Could not close login modal: ${error}`);
    }
  }

  /**
   * Discover complete listing URLs
   */
  async discoverListings(url: string): Promise<Set<string>> {
    const context = await this.createContext();
    const page = await context.newPage();
    const listingUrls = new Set<string>();

    try {
      logger.debug(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      await page.waitForTimeout(5000);
      
      await this.loginToFacebook(page);
      
      await page.waitForTimeout(2000);

      let scrollCount = 0;
      let noNewContentCount = 0;
      let previousCount = 0;

      while (noNewContentCount < SCROLL_CONFIG.MAX_NO_NEW_CONTENT_ATTEMPTS && scrollCount < SCROLL_CONFIG.MAX_TOTAL_SCROLLS) {
        const urls = await this.extractListingUrls(page, url);
        urls.forEach((listingUrl) => listingUrls.add(listingUrl));

        const currentCount = listingUrls.size;
        const newItemsFound = currentCount - previousCount;

        scrollCount++;
        logger.debug(`Scroll ${scrollCount} - Total: ${currentCount}, New: ${newItemsFound}`);

        if (newItemsFound === 0) {
          noNewContentCount++;
          logger.debug(`No new content (${noNewContentCount}/${SCROLL_CONFIG.MAX_NO_NEW_CONTENT_ATTEMPTS})`);
        } else {
          noNewContentCount = 0;
        }

        previousCount = currentCount;

        if (noNewContentCount < SCROLL_CONFIG.MAX_NO_NEW_CONTENT_ATTEMPTS) {
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          
          await page.waitForTimeout(SCROLL_CONFIG.WAIT_TIME);
        }
      }

      if (scrollCount >= SCROLL_CONFIG.MAX_TOTAL_SCROLLS) {
        logger.warn(`Reached maximum scroll limit (${SCROLL_CONFIG.MAX_TOTAL_SCROLLS})`);
      } else {
        logger.info(`Scrolling complete after ${scrollCount} scrolls`);
      }

    } catch (error) {
      logger.error('Error during discovery', error);
      throw error;
    } finally {
      await context.close();
    }

    return listingUrls;
  }

  /**
   * Extract complete listing URLs from current page state
   */
  private async extractListingUrls(page: Page, baseUrl: string): Promise<Set<string>> {
    const urls = new Set<string>();

    try {
      const hrefs: string[] = await page.evaluate((selector) => {
        const links = document.querySelectorAll(selector);
        return Array.from(links).map((link) => {
          const href = link.getAttribute('href') || '';
          return href;
        });
      }, FACEBOOK_CONFIG.SELECTORS.LISTING_LINKS);

      const baseUrlObj = new URL(baseUrl);
      const origin = baseUrlObj.origin;

      for (const href of hrefs) {
        if (!href) continue;

        let completeUrl: string;
        if (href.startsWith('http')) {
          completeUrl = href;
        } else if (href.startsWith('/')) {
          completeUrl = `${origin}${href}`;
        } else {
          continue;
        }

        if (completeUrl.includes('/marketplace/item/')) {
          urls.add(completeUrl);
        }
      }
    } catch (error) {
      logger.error('Error extracting URLs', error);
    }

    return urls;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
