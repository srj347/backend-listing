import amqplib from 'amqplib';
import { SeederProcessor } from './processor.js';
import { logger } from './utils/logger.js';
import { QUEUE_NAMES } from './constants/index.js';

type AmqpConnection = Awaited<ReturnType<typeof amqplib.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

export class SeederConsumer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private processor: SeederProcessor;

  constructor(private readonly rabbitmqUrl: string) {
    this.processor = new SeederProcessor(rabbitmqUrl);
  }

  async start(): Promise<void> {
    const conn = await amqplib.connect(this.rabbitmqUrl);
    this.connection = conn;
    
    const ch = await conn.createChannel();
    this.channel = ch;

    await ch.assertQueue(QUEUE_NAMES.DISCOVERY, {
      durable: true,
    });

    await ch.consume(QUEUE_NAMES.DISCOVERY, (msg) => this.handleMessage(msg));

    logger.info(`Consumer started for queue: ${QUEUE_NAMES.DISCOVERY}`);

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
      logger.info('Processing discovery job...');

      await this.processor.process(msg);

      this.channel.ack(msg);
      const duration = Date.now() - startTime;
      logger.info(`Job completed in ${duration}ms`);
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
