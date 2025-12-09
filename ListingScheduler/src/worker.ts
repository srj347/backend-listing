import { run, runMigrations, TaskList } from 'graphile-worker';
import { triggerDiscovery } from './tasks/trigger-discovery.js';
import { logger } from './utils/logger.js';
import { DATABASE_URL, CRON_CONFIG } from './constants/index.js';

const taskList: TaskList = {
  trigger_discovery: triggerDiscovery,
};

const startWorker = async (): Promise<void> => {
  logger.info('Listing Scheduler Service starting...');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  logger.info('Initializing Graphile Worker database schema...');
  await runMigrations({
    connectionString: DATABASE_URL,
  });
  logger.info('Graphile Worker schema initialized');

  const runner = await run({
    connectionString: DATABASE_URL,
    concurrency: CRON_CONFIG.CONCURRENCY,
    noHandleSignals: false,
    pollInterval: CRON_CONFIG.POLL_INTERVAL,
    crontabFile: CRON_CONFIG.CRONTAB_FILE,
    taskList,
  });

  logger.info('Scheduler worker started. Waiting for scheduled tasks...');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down scheduler...`);
    await runner.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await runner.promise;
};

startWorker().catch((err) => {
  logger.error('Scheduler failed to start', err);
  process.exit(1);
});
