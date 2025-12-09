/**
 * RabbitMQ Configuration
 */
export const RABBITMQ_CONFIG = {
  URL: process.env.RABBITMQ_URL || 'amqp://test1:test1@localhost:5672',
} as const;

/**
 * Database Configuration
 */
export const DATABASE_CONFIG = {
  URL: process.env.DATABASE_URL || 'postgresql://test1:test1@localhost:5432/listingdb',
  POOL: {
    MIN: 2,
    MAX: 10,
  },
} as const;

/**
 * Queue Names
 */
export const QUEUE_NAMES = {
  EXTRACTION: 'extraction_queue',
} as const;

/**
 * Table Names
 */
export const TABLE_NAMES = {
  LISTINGS: 'listings',
} as const;

/**
 * Worker Configuration
 */
export const WORKER_CONFIG = {
  CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '1', 10),
} as const;

/**
 * Browser Configuration
 */
export const BROWSER_CONFIG = {
  HEADLESS: true,
  ARGS: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920,1080',
  ] as string[],
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  VIEWPORT: {
    WIDTH: 1920,
    HEIGHT: 1080,
  },
  LOCALE: 'en-US',
  TIMEZONE: 'Asia/Manila',
  TIMEOUT: 60000,
  WAIT_TIME: 2000,
} as const;

/**
 * Facebook Selectors
 */
export const FACEBOOK_SELECTORS = {
  TITLE: 'h1 span[dir="auto"]',
  PRICE: 'div.x1xmf6yo span[dir="auto"]',
  DESCRIPTION: 'div.x1gslohp span[dir="auto"]',
  DETAIL_ROWS: 'div.x1cy8zhl span[dir="auto"]',
} as const;

/**
 * Validation Ranges
 */
export const VALIDATION = {
  PRICE: {
    MIN: 1000,
    MAX: 100000000,
  },
  MILEAGE: {
    MIN: 0,
    MAX: 1000000,
  },
} as const;

/**
 * Default Values
 */
export const DEFAULT_VALUES = {
  TITLE: '--',
  PRICE: 0,
  CURRENCY: 'PHP',
  VEHICLE_TYPE: 'car',
  SOURCE_TYPE: 'facebook',
} as const;

/**
 * URL Patterns
 */
export const URL_PATTERNS = {
  EXTERNAL_ID: /\/item\/(\d+)/,
} as const;

