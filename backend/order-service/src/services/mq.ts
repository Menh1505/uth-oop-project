import { connect } from 'amqplib';
import type { Channel, Connection } from 'amqplib';
import { rabbitMQConfig } from '../config/rabbitmq.js';
import logger from '../config/logger.js';

let conn: Connection | null = null;
let ch: Channel | null = null;

export async function ensureChannel(): Promise<Channel> {
  if (ch) return ch;

  const connection: Connection = await connect(rabbitMQConfig.url);
  conn = connection;

  const channel: Channel = await connection.createChannel();
  ch = channel;

  await channel.assertExchange(
    rabbitMQConfig.exchange,
    rabbitMQConfig.exchangeType as any,
    { durable: true }
  );

  connection.on('close', () => { ch = null; conn = null; });
  connection.on('error', (err) => { logger.error({ err }, 'RabbitMQ connection error'); });

  return channel;
}
