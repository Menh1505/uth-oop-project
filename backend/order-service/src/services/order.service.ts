// src/services/mq.ts
import { connect, type Channel, type Connection } from 'amqplib';
import { rabbitMQConfig } from '../config/rabbitmq.js';
import logger from '../config/logger.js';

let conn: Connection | null = null;
let ch: Channel | null = null;

export async function ensureChannel(): Promise<Channel> {
  if (ch) return ch;
  conn = await connect(rabbitMQConfig.url);
  ch = await conn.createChannel();
  await ch.assertExchange(
    rabbitMQConfig.exchange,
    rabbitMQConfig.exchangeType as any,
    { durable: true }
  );
  return ch;
}

export async function publish(routingKey: string, payload: unknown): Promise<void> {
  try {
    const channel = await ensureChannel();
    const ok = channel.publish(
      rabbitMQConfig.exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { contentType: 'application/json', persistent: true }
    );
    if (!ok) logger.warn({ routingKey }, 'MQ publish backpressure');
  } catch (e) {
    logger.error({ e, routingKey }, 'MQ publish failed');
  }
}
