/**
 * RabbitMQ Configuration
 */
export const RABBITMQ_CONFIG = {
  URL: process.env.RABBITMQ_URL || 'amqp://test1:test1@localhost:5672',
} as const;

/**
 * Queue Names
 */
export const QUEUE_NAMES = {
  DISCOVERY: 'discovery_queue',
  EXTRACTION: 'extraction_queue',
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
} as const;

/**
 * Scrolling Configuration
 */
export const SCROLL_CONFIG = {
  WAIT_TIME: 4000,
  MAX_NO_NEW_CONTENT_ATTEMPTS: 5,
  MAX_TOTAL_SCROLLS: 100000,
} as const;

/**
 * Facebook Configuration
 */
export const FACEBOOK_CONFIG = {
  USERNAME: process.env.FACEBOOK_USERNAME || '',
  PASSWORD: process.env.FACEBOOK_PASSWORD || '',
  LOGIN_URL: 'https://www.facebook.com/login',
  SELECTORS: {
    LOGIN_BUTTON: '[aria-label="Log in to Facebook"]',
    EMAIL_INPUT: 'input[name="email"], input[id="email"]',
    PASSWORD_INPUT: 'input[name="pass"], input[id="pass"]',
    SUBMIT_BUTTON: 'button[name="login"], button[type="submit"]',
    DIALOG: 'div[role="dialog"]',
    CLOSE_BUTTONS: [
      '[aria-label*="Close"]',
      '[aria-label*="close"]',
      'div[role="button"][aria-label*="Close"]',
      'div[role="button"][aria-label*="close"]',
    ],
    MARKETPLACE_ITEMS: '[aria-label="Collection of Marketplace items"]',
    LISTING_LINKS: 'a[href*="/marketplace/item/"]',
  },
} as const;

/**
 * Default Values
 */
export const DEFAULT_VALUES = {
  LOCATION: '--',
} as const;
