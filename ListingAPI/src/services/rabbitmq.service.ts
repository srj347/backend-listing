import amqplib from 'amqplib';
import { logger } from '../utils/logger.js';
import { RABBITMQ_CONFIG, QUEUE_NAMES } from '../constants/index.js';

type AmqpConnection = Awaited<ReturnType<typeof amqplib.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

let connection: AmqpConnection | null = null;
let channel: AmqpChannel | null = null;

export const connectRabbitMQ = async (): Promise<AmqpChannel> => {
  if (channel) return channel;

  const conn = await amqplib.connect(RABBITMQ_CONFIG.URL);
  connection = conn;
  
  const ch = await conn.createChannel();
  channel = ch;

  await ch.assertQueue(QUEUE_NAMES.DISCOVERY, { durable: true });

  conn.on('error', (err: Error) => {
    logger.error('RabbitMQ connection error', err);
    connection = null;
    channel = null;
  });

  conn.on('close', () => {
    logger.info('RabbitMQ connection closed');
    connection = null;
    channel = null;
  });

  return ch;
};

export const getChannel = async (): Promise<AmqpChannel> => {
  if (!channel) {
    return connectRabbitMQ();
  }
  return channel;
};

export const publishToQueue = async (
  queueName: string,
  message: object
): Promise<boolean> => {
  const ch = await getChannel();
  return ch.sendToQueue(
    queueName,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
};

export const closeRabbitMQ = async (): Promise<void> => {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
};

export const checkRabbitMQConnection = async (): Promise<boolean> => {
  try {
    await getChannel();
    return true;
  } catch (error) {
    logger.error('RabbitMQ connection check failed', error);
    return false;
  }
};
