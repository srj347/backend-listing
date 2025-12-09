/**
 * Server Configuration
 */
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '8080', 10),
  BODY_LIMIT: '10mb',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  CORS_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as string[],
  CORS_HEADERS: ['Content-Type', 'Authorization'] as string[],
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_PATH: '/api/v1',
  HEALTH_PATH: '/health',
} as const;

/**
 * Database Configuration
 */
export const DATABASE_CONFIG = {
  URL: process.env.DATABASE_URL,
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432', 10),
  USER: process.env.DB_USER || 'test1',
  PASSWORD: process.env.DB_PASSWORD || 'test1',
  NAME: process.env.DB_NAME || 'listingdb',
  POOL: {
    MIN: 2,
    MAX_DEV: 10,
    MAX_PROD: 30,
    ACQUIRE_TIMEOUT: 30000,
    CREATE_TIMEOUT: 30000,
    DESTROY_TIMEOUT: 5000,
    IDLE_TIMEOUT: 30000,
  },
  CONNECTION_TIMEOUT: 60000,
} as const;

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
} as const;

/**
 * Database Table Names
 */
export const TABLE_NAMES = {
  LISTINGS: 'listings',
  JOBS: 'jobs',
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Sort Options
 */
export const SORT_COLUMNS = {
  LISTINGS: ['createdAt', 'updatedAt', 'price', 'year', 'mileage'] as const,
} as const;

/**
 * Status Values
 */
export const STATUS = {
  JOB: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
  LISTING: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SOLD: 'sold',
  },
} as const;

