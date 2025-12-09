/**
 * RabbitMQ Configuration
 */
export const RABBITMQ_URL =
  process.env.RABBITMQ_URL || 'amqp://test1:test1@localhost:5672';

/**
 * Queue Names
 */
export const QUEUE_NAMES = {
  DISCOVERY: 'discovery_queue',
} as const;

/**
 * Default URLs
 */
export const DEFAULT_URLS = {
  SCRAPE: 'https://www.facebook.com/marketplace/manila/cars?minPrice=300000&maxPrice=300001&exact=true',
} as const;

/**
 * Database Configuration
 */
export const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test1:test1@localhost:5432/listingdb';

/**
 * Cron Configuration
 */
export const CRON_CONFIG = {
  CRONTAB_FILE: '/app/crontab',
  POLL_INTERVAL: 1000, // milliseconds
  CONCURRENCY: 5,
} as const;

