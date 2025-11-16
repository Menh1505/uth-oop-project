// src/services/messageService.ts
import { connect } from 'amqplib';
import type { Channel } from 'amqplib';
import { rabbitMQConfig } from '../config/rabbitmq';

export class MessageService {
  // Dùng any cho connection để né conflict kiểu (ChannelModel vs Connection)
  private static connection: any = null;
  private static channel: Channel | null = null;

  private static async ensure(): Promise<void> {
    if (this.channel) return;

    // Kết nối và ép kiểu an toàn
    const conn: any = await connect(rabbitMQConfig.url);
    this.connection = conn;

    const ch: Channel = await (conn as any).createChannel();
    this.channel = ch;

    await ch.assertExchange(
      rabbitMQConfig.exchange,
      rabbitMQConfig.exchangeType,
      { durable: true }
    );
  }

  static async publish(routingKey: string, message: unknown) {
    await this.ensure();
    this.channel!.publish(
      rabbitMQConfig.exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { contentType: 'application/json', deliveryMode: 2 }
    );
  }

  static async close() {
    if (this.channel) { try { await this.channel.close(); } catch {} finally { this.channel = null; } }
    if (this.connection) { try { await (this.connection as any).close(); } catch {} finally { this.connection = null; } }
  }
}
