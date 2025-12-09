import amqplib from 'amqplib';
import { BrowserManager } from './browser.js';
import { DatabaseService } from './database.js';
import { logger } from './utils/logger.js';
import type { ExtractionJobPayload, ScrapedListing } from './models/index.js';
import { URL_PATTERNS, DEFAULT_VALUES } from './constants/index.js';

export class ExtractorProcessor {
  private browserManager: BrowserManager;
  private database: DatabaseService;

  constructor(databaseUrl: string) {
    this.browserManager = new BrowserManager();
    this.database = new DatabaseService(databaseUrl);
  }

  async process(msg: amqplib.ConsumeMessage): Promise<void> {
    const payload: ExtractionJobPayload = JSON.parse(msg.content.toString());
    const { jobId, sourceUrl, location } = payload;

    logger.debug(`Starting extraction job: ${jobId}`);
    logger.debug(`URL: ${sourceUrl}`);
    logger.debug(`Location: ${location}`);

    const scrapedData = await this.browserManager.extractListingDetails(sourceUrl);

    const externalIdMatch = sourceUrl.match(URL_PATTERNS.EXTERNAL_ID);
    if (!externalIdMatch || !externalIdMatch[1]) {
      logger.error(`Failed to extract external ID from URL: ${sourceUrl}`);
      throw new Error('Invalid listing URL - cannot extract external ID');
    }
    const externalId = externalIdMatch[1];
    
    const listing: ScrapedListing = {
      external_id: externalId,
      title: scrapedData.title || DEFAULT_VALUES.TITLE,
      price: scrapedData.price || DEFAULT_VALUES.PRICE,
      currency: scrapedData.currency || DEFAULT_VALUES.CURRENCY,
      year: scrapedData.year || null,
      mileage: scrapedData.mileage || null,
      location,
      vehicle_type: DEFAULT_VALUES.VEHICLE_TYPE,
      source_url: sourceUrl,
      attributes: scrapedData.attributes || {},
    };

    // Upsert to database
    await this.database.upsertListing(listing);

    logger.info(`Extraction job ${jobId} completed - ${listing.title} (${location})`);
  }

  async close(): Promise<void> {
    await this.browserManager.close();
    await this.database.close();
  }
}
