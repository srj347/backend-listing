import amqplib from 'amqplib';
import { ExtractorProcessor } from './processor.js';
import { logger } from './utils/logger.js';
import { QUEUE_NAMES } from './constants/index.js';

type AmqpConnection = Awaited<ReturnType<typeof amqplib.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

export class ExtractorConsumer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private processor: ExtractorProcessor;

  constructor(
    private readonly rabbitmqUrl: string,
    private readonly databaseUrl: string,
    private readonly concurrency: number
  ) {
    this.processor = new ExtractorProcessor(databaseUrl);
  }

  async start(): Promise<void> {
    const conn = await amqplib.connect(this.rabbitmqUrl);
    this.connection = conn;
    
    const ch = await conn.createChannel();
    this.channel = ch;

    await ch.assertQueue(QUEUE_NAMES.EXTRACTION, {
      durable: true,
    });

    await ch.prefetch(this.concurrency);

    await ch.consume(QUEUE_NAMES.EXTRACTION, (msg) => this.handleMessage(msg));

    logger.info(`Consumer started for queue: ${QUEUE_NAMES.EXTRACTION} (prefetch: ${this.concurrency})`);

    conn.on('error', (err: Error) => {
      logger.error('RabbitMQ connection error', err);
    });

    conn.on('close', () => {
      logger.info('RabbitMQ connection closed');
    });
  }

  private async handleMessage(msg: amqplib.ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) return;

    const startTime = Date.now();

    try {
      logger.info('Processing extraction job...');

      await this.processor.process(msg);

      this.channel.ack(msg);
      logger.info(`Job completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      logger.error('Error processing job', error);
      // Reject without requeue (send to DLQ)
      this.channel.nack(msg, false, false);
    }
  }

  async close(): Promise<void> {
    await this.processor.close();
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
