import { ExtractorConsumer } from './consumer.js';
import { logger } from './utils/logger.js';
import { RABBITMQ_CONFIG, DATABASE_CONFIG, WORKER_CONFIG } from './constants/index.js';

const main = async (): Promise<void> => {
  logger.info('Listing Extractor Service starting...');
  const consumer = new ExtractorConsumer(
    RABBITMQ_CONFIG.URL,
    DATABASE_CONFIG.URL,
    WORKER_CONFIG.CONCURRENCY
  );

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down extractor...`);
    await consumer.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await consumer.start();
    logger.info('Extractor service started. Waiting for extraction jobs...');
  } catch (error) {
    logger.error('Failed to start extractor service', error);
    process.exit(1);
  }
};

main();

