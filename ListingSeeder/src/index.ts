import { SeederConsumer } from './consumer.js';
import { logger } from './utils/logger.js';
import { RABBITMQ_CONFIG } from './constants/index.js';

const main = async (): Promise<void> => {
  logger.info('Listing Seeder Service starting...');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  const consumer = new SeederConsumer(RABBITMQ_CONFIG.URL);

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down seeder...`);
    await consumer.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await consumer.start();
    logger.info('Seeder service started. Waiting for discovery jobs...');
  } catch (error) {
    logger.error('Failed to start seeder service', error);
    process.exit(1);
  }
};

main();
