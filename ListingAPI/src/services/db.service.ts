import knex, { Knex } from 'knex';
import { logger } from '../utils/logger.js';
import { DATABASE_CONFIG } from '../constants/index.js';

let dbInstance: Knex | null = null;

const getConnectionConfig = (): Knex.PgConnectionConfig => {
  if (DATABASE_CONFIG.URL) {
    return { connectionString: DATABASE_CONFIG.URL };
  }

  return {
    host: DATABASE_CONFIG.HOST,
    port: DATABASE_CONFIG.PORT,
    user: DATABASE_CONFIG.USER,
    password: DATABASE_CONFIG.PASSWORD,
    database: DATABASE_CONFIG.NAME,
  };
};

const getKnexConfig = (): Knex.Config => {
  const baseConfig: Knex.Config = {
    client: 'pg',
    connection: getConnectionConfig(),
    pool: {
      min: DATABASE_CONFIG.POOL.MIN,
      max: logger.isProduction() ? DATABASE_CONFIG.POOL.MAX_PROD : DATABASE_CONFIG.POOL.MAX_DEV,
      acquireTimeoutMillis: DATABASE_CONFIG.POOL.ACQUIRE_TIMEOUT,
      createTimeoutMillis: DATABASE_CONFIG.POOL.CREATE_TIMEOUT,
      destroyTimeoutMillis: DATABASE_CONFIG.POOL.DESTROY_TIMEOUT,
      idleTimeoutMillis: DATABASE_CONFIG.POOL.IDLE_TIMEOUT,
    },
    acquireConnectionTimeout: DATABASE_CONFIG.CONNECTION_TIMEOUT,
  };

  return baseConfig;
};

export const getDb = (): Knex => {
  if (!dbInstance) {
    dbInstance = knex(getKnexConfig());
  }
  return dbInstance;
};

export const closeDb = async (): Promise<void> => {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
  }
};

export const checkDbConnection = async (): Promise<boolean> => {
  try {
    const db = getDb();
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database connection check failed', error);
    return false;
  }
};
