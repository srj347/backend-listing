import amqplib from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { BrowserManager } from './browser.js';
import type { DiscoveryJobPayload, ExtractionJobPayload } from './models/jobs.js';
import { logger } from './utils/logger.js';
import { QUEUE_NAMES, DEFAULT_VALUES } from './constants/index.js';

type AmqpConnection = Awaited<ReturnType<typeof amqplib.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

export class SeederProcessor {
  private publishConnection: AmqpConnection | null = null;
  private publishChannel: AmqpChannel | null = null;
  private browserManager: BrowserManager;

  constructor(private readonly rabbitmqUrl: string) {
    this.browserManager = new BrowserManager();
  }

  /**
   * Extract location from Facebook Marketplace URL
   */
  private extractLocationFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      if (pathParts.length >= 2 && pathParts[0] === 'marketplace') {
        const location = pathParts[1];
        return location.charAt(0).toUpperCase() + location.slice(1);
      }
      
      return DEFAULT_VALUES.LOCATION;
    } catch (error) {
      logger.warn(`Failed to extract location from URL: ${url}`, error);
      return DEFAULT_VALUES.LOCATION;
    }
  }

  private async getPublishChannel(): Promise<AmqpChannel> {
    if (!this.publishChannel) {
      const conn = await amqplib.connect(this.rabbitmqUrl);
      this.publishConnection = conn;
      
      const ch = await conn.createChannel();
      this.publishChannel = ch;
      
      await ch.assertQueue(QUEUE_NAMES.EXTRACTION, { durable: true });
    }
    return this.publishChannel;
  }

  async process(msg: amqplib.ConsumeMessage): Promise<void> {
    const payload: DiscoveryJobPayload = JSON.parse(msg.content.toString());
    const { jobId, url } = payload;

    logger.info(`Starting discovery job: ${jobId}`);
    logger.debug(`URL: ${url}`);

    const location = this.extractLocationFromUrl(url);
    logger.info(`Extracted location: ${location}`);

    const listingUrls = await this.browserManager.discoverListings(url);

    logger.info(`Discovered ${listingUrls.size} unique listings for job ${jobId}`);

    const channel = await this.getPublishChannel();

    for (const sourceUrl of listingUrls) {
      const extractionPayload: ExtractionJobPayload = {
        jobId: uuidv4(),
        sourceUrl: sourceUrl, 
        parentJobId: jobId,
        location,
        createdAt: new Date().toISOString(),
      };

      logger.debug(`Publishing extraction job: ${extractionPayload}`);
      channel.sendToQueue(
        QUEUE_NAMES.EXTRACTION,
        Buffer.from(JSON.stringify(extractionPayload)),
        { persistent: true }
      );
    }

    logger.info(`Published ${listingUrls.size} extraction jobs to queue`);
    logger.info(`Discovery job ${jobId} completed`);
  }

  async close(): Promise<void> {
    await this.browserManager.close();
    if (this.publishChannel) {
      await this.publishChannel.close();
    }
    if (this.publishConnection) {
      await this.publishConnection.close();
    }
  }
}
