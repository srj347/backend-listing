import { Task } from 'graphile-worker';
import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import type { SchedulerPayload, DiscoveryJobPayload } from '../models/jobs.js';
import { RABBITMQ_URL, QUEUE_NAMES, DEFAULT_URLS } from '../constants/index.js';

let channel: amqp.Channel | null = null;

const getChannel = async (): Promise<amqp.Channel> => {
  if (!channel) {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAMES.DISCOVERY, { durable: true });
  }
  return channel;
};

/**
 * Task: trigger_discovery
 * Publishes a discovery job to RabbitMQ for the Seeder worker to process
 */
export const triggerDiscovery: Task = async (payload) => {
  const payloadData = payload as SchedulerPayload;
  
  const url = process.env.SCRAPE_URL || payloadData.url || DEFAULT_URLS.SCRAPE;
  const jobId = uuidv4();

  logger.info(`Triggering discovery job for URL: ${url}`);

  const jobPayload: DiscoveryJobPayload = {
    jobId,
    url,
    triggeredBy: 'scheduler',
    createdAt: new Date().toISOString(),
  };

  try {
    const ch = await getChannel();
    ch.sendToQueue(
      QUEUE_NAMES.DISCOVERY,
      Buffer.from(JSON.stringify(jobPayload)),
      { persistent: true }
    );

    logger.info(`Discovery job ${jobId} queued successfully`);
  } catch (error) {
    logger.error(`Failed to queue discovery job`, error);
    throw error;
  }
};
