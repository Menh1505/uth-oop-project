import { connect, Channel, Connection, ConsumeMessage } from 'amqplib';
import crypto from 'node:crypto';
import { rabbitMQConfig } from '../config/rabbitmq';
import logger from '../config/logger';
import { LoginEventRepository } from '../repositories/LoginEventRepository';
import { UserRepository } from '../repositories/UserRepository';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export class MessageConsumer {
  private static connection: Connection | null = null;
  private static channel: Channel | null = null;
  private static retryCount = 0;
  private static retryTimer: NodeJS.Timeout | null = null;

  static async start(): Promise<void> {
    try {
      logger.info({ url: rabbitMQConfig.url }, 'User-service: connecting RabbitMQ...');
      const conn = await connect(rabbitMQConfig.url);
      this.connection = conn as any;

      conn.on('error', (err) => {
        logger.error({ err }, 'RabbitMQ connection error');
        this.scheduleRetry();
      });
      conn.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.scheduleRetry();
      });

      const ch = await conn.createChannel();
      this.channel = ch;

      await ch.assertExchange(rabbitMQConfig.exchange, rabbitMQConfig.exchangeType, { durable: true });
      await ch.assertQueue(rabbitMQConfig.queue, { durable: true });

      for (const key of rabbitMQConfig.routingKeys) {
        await ch.bindQueue(rabbitMQConfig.queue, rabbitMQConfig.exchange, key);
      }

      logger.info({ queue: rabbitMQConfig.queue, keys: rabbitMQConfig.routingKeys }, 'User-service consuming');

      await ch.consume(rabbitMQConfig.queue, (msg: ConsumeMessage | null) => this.handleMessage(msg), { noAck: false });

      this.retryCount = 0;
      if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    } catch (e) {
      logger.error({ e }, 'User-service failed to connect RabbitMQ');
      this.scheduleRetry();
    }
  }

  private static async handleMessage(msg: ConsumeMessage | null) {
    if (!msg || !this.channel) return;
    try {
      const routingKey = msg.fields.routingKey;
      const raw = msg.content.toString();
      const event = JSON.parse(raw);
      const messageId = msg.properties.messageId 
        || crypto.createHash('sha256').update(raw).digest('hex');

      // idempotency
      const processed = await LoginEventRepository.isProcessed(messageId);
      if (processed) {
        this.channel.ack(msg);
        return;
      }

      switch (routingKey) {
        case 'user.registered': {
          const userId: string = event.userId;
          const email: string = event.email;
          const guessName = email?.split('@')[0] || null;
          // Create/update user in user_db
          try {
            await UserRepository.createOrUpdate(userId, email, guessName);
            logger.info({ userId, email }, 'User synced to user_db');
          } catch (error) {
            logger.warn({ userId, email, error }, 'Could not sync user to user_db');
          }
          await LoginEventRepository.markProcessed(messageId, routingKey);
          break;
        }
        case 'user.logged_in': {
          await LoginEventRepository.recordLogin(event);
          if (event.userId) {
            try {
              await UserRepository.updateLastLogin(event.userId);
            } catch (error) {
              logger.warn({ userId: event.userId, error }, 'Could not update last login');
            }
          }
          await LoginEventRepository.markProcessed(messageId, routingKey);
          break;
        }
        default:
          // các key khác: bỏ qua nhưng vẫn mark processed để tránh lặp
          await LoginEventRepository.markProcessed(messageId, routingKey);
      }

      this.channel.ack(msg);
    } catch (err) {
      logger.error({ err }, 'User-service handleMessage error');
      // drop để tránh loop vô hạn với dữ liệu xấu
      this.channel!.nack(msg!, false, false);
    }
  }

  private static scheduleRetry() {
    if (this.retryCount >= MAX_RETRIES) {
      logger.error('Max RabbitMQ retries reached');
      return;
    }
    this.retryCount++;
    void this.cleanup();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.start();
    }, RETRY_DELAY_MS);
  }

  private static async cleanup() {
    if (this.channel) { try { await (this.channel as any).close(); } catch {} finally { this.channel = null; } }
    if (this.connection) { try { await (this.connection as any).close(); } catch {} finally { this.connection = null; } }
  }

  static async close() {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    await this.cleanup();
  }
}
