// src/services/MessageService.ts (auth-service)
import { connect, type Channel } from 'amqplib';
import { rabbitMQConfig } from '../config/rabbitmq';

export class MessageService {
  private static connection: any = null;
  private static channel: Channel | null = null;

  private static async ensure(): Promise<void> {
    if (this.channel) return;
    const conn: any = await connect(rabbitMQConfig.url);
    this.connection = conn;
    const ch = await conn.createChannel();
    this.channel = ch;
    await ch.assertExchange(rabbitMQConfig.exchange, rabbitMQConfig.exchangeType, { durable: true });
  }

  static async publish(routingKey: string, message: unknown) {
    await this.ensure();
    this.channel!.publish(
      rabbitMQConfig.exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        contentType: 'application/json',
        deliveryMode: 2 // persistent
      }
    );
  }

  static async close() {
    if (this.channel) { await this.channel.close(); this.channel = null; }
    if (this.connection) { await (this.connection as any).close(); this.connection = null; }
  }
}
