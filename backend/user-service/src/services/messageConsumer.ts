import { connect, type Channel, type ConsumeMessage } from 'amqplib';
import { rabbitMQConfig } from '../config/rabbitmq';
import pool from '../config/database';  
import logger from '../config/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
const QUEUE = 'user-service.user_events.q';
const ROUTING_KEY = 'user.logged_in';

export class MessageConsumer {
  private static connection: any = null;
  private static channel: Channel | null = null;
  private static retryCount = 0;
  private static retryTimer: NodeJS.Timeout | null = null;

  static async start(): Promise<void> {
    try {
      logger.info({ url: rabbitMQConfig.url }, 'Connecting to RabbitMQ...');
      const conn: any = await connect(rabbitMQConfig.url);
      this.connection = conn;

      conn.on('error', (err: Error) => {
        logger.error({ error: err }, 'RabbitMQ connection error');
        this.scheduleRetry();
      });

      conn.on('close', () => {
        logger.warn('RabbitMQ connection closed. Attempting to reconnect...');
        this.scheduleRetry();
      });

      const ch = await conn.createChannel();
      this.channel = ch;

      // dùng exchange từ config cho đồng bộ
      await ch.assertExchange(rabbitMQConfig.exchange, rabbitMQConfig.exchangeType, { durable: true });

      // queue durable, đặt tên cố định
      await ch.assertQueue(QUEUE, { durable: true });
      await ch.bindQueue(QUEUE, rabbitMQConfig.exchange, ROUTING_KEY);

      logger.info({ queue: QUEUE, routingKey: ROUTING_KEY }, 'User service listening on queue');

      await ch.consume(
        QUEUE,
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;
          try {
            const event = JSON.parse(msg.content.toString());
            logger.debug({ event }, 'Received login event');

            // Ghi login_events (DB tự sinh id)
            try {
              await pool.query(
                `INSERT INTO login_events (user_id, email, role, occurred_at, raw)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  event.userId || null,
                  event.email,
                  event.role || null,
                  event.timestamp ? new Date(event.timestamp) : new Date(),
                  JSON.stringify(event)
                ]
              );
              // (tuỳ chọn) cập nhật last_login
              await pool.query(
                `ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ`
              );
              await pool.query(`UPDATE profiles SET last_login = NOW() WHERE id = $1`, [event.userId]);

              // (tuỳ chọn) upsert skeleton profile nếu chưa có
              await pool.query(
                `INSERT INTO profiles (id, full_name)
                 VALUES ($1, $2)
                 ON CONFLICT (id) DO NOTHING`,
                [event.userId, String(event.email || '').split('@')[0] || null]
              );

              logger.info({ email: event.email, userId: event.userId }, 'Stored login event');
            } catch (dbError) {
              logger.error({ error: dbError, userId: event.userId }, 'Error storing login event');
              // tránh loop vô tận với dữ liệu xấu
            }

            this.channel!.ack(msg);
          } catch (e) {
            logger.error({ error: e }, 'Error processing message');
            this.channel!.nack(msg, false, false); // drop
          }
        },
        { noAck: false }
      );

      this.retryCount = 0;
      if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    } catch (e) {
      logger.error({ error: e }, 'Failed to connect to RabbitMQ');
      this.scheduleRetry();
    }
  }

  private static scheduleRetry(): void {
    if (this.retryCount >= MAX_RETRIES) {
      logger.error({ message: 'Max retries reached. Giving up.' });
      return;
    }
    this.retryCount += 1;
    void this.cleanup();

    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.start();
    }, RETRY_DELAY_MS);
  }

  private static async cleanup(): Promise<void> {
    if (this.channel) { try { await this.channel.close(); } catch {} finally { this.channel = null; } }
    if (this.connection) { try { await (this.connection as any).close(); } catch {} finally { this.connection = null; } }
  }

  static async close(): Promise<void> {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    await this.cleanup();
    logger.info({ message: 'RabbitMQ connection closed' });
  }
}
