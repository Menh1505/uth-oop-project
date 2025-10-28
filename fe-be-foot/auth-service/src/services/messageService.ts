import * as amqp from 'amqplib';
import { rabbitMQConfig } from '../config/rabbitmq';

export class MessageService {
  private static connection: any = null;
  private static channel: amqp.Channel | null = null;

  static async connect() {
    if (!this.connection) {
      this.connection = await amqp.connect(rabbitMQConfig.url);
      const conn = this.connection!;
      this.channel = await conn.createChannel();
      await this.channel!.assertExchange(rabbitMQConfig.exchange, rabbitMQConfig.exchangeType, { durable: true });
    }
  }

  static async publish(routingKey: string, message: any) {
    if (!this.channel) {
      await this.connect();
    }
    this.channel!.publish(rabbitMQConfig.exchange, routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
  }

  static async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
