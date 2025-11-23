import amqplib from 'amqplib';
import logger from '../config/logger.js';
import { rabbitMQConfig } from '../config/rabbitmq.js';

export class MessageService {
  private static connection: any = null;
  private static channel: any = null;
  private static isConnected = false;

  static async connect(): Promise<void> {
    try {
      logger.info('Connecting to RabbitMQ...');
      
      this.connection = await amqplib.connect(rabbitMQConfig.url);
      this.channel = await this.connection.createChannel();
      
      // Create exchange for AI service
      await this.channel.assertExchange(
        rabbitMQConfig.exchange, 
        rabbitMQConfig.exchangeType, 
        { durable: true }
      );
      
      // Create dead letter exchange and queue
      await this.channel.assertExchange(
        rabbitMQConfig.deadLetterExchange,
        'direct',
        { durable: true }
      );
      
      await this.channel.assertQueue(rabbitMQConfig.deadLetterQueue, {
        durable: true
      });
      
      await this.channel.bindQueue(
        rabbitMQConfig.deadLetterQueue,
        rabbitMQConfig.deadLetterExchange,
        'dead'
      );
      
      // Create main queue with dead letter routing
      await this.channel.assertQueue(rabbitMQConfig.queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': rabbitMQConfig.deadLetterExchange,
          'x-dead-letter-routing-key': 'dead'
        }
      });
      
      // Bind queue to exchange
      for (const routingKey of rabbitMQConfig.routingKeys) {
        await this.channel.bindQueue(
          rabbitMQConfig.queue,
          rabbitMQConfig.exchange,
          routingKey
        );
      }
      
      this.isConnected = true;
      logger.info('✅ AI Service connected to RabbitMQ');
      
      // Handle connection events
      this.connection.on('error', (error: any) => {
        logger.error('❌ RabbitMQ connection error', { error });
        this.isConnected = false;
      });
      
      this.connection.on('close', () => {
        logger.warn('⚠️ RabbitMQ connection closed');
        this.isConnected = false;
      });
      
    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ', { error });
      throw error;
    }
  }

  static async publish(routingKey: string, message: any): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const published = this.channel.publish(
        rabbitMQConfig.exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: `ai-${Date.now()}-${Math.random()}`
        }
      );
      
      if (published) {
        logger.info('Message published to RabbitMQ', { routingKey });
      } else {
        throw new Error('Failed to publish message');
      }
    } catch (error) {
      logger.error('Failed to publish message', { error, routingKey });
      throw error;
    }
  }

  static async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      logger.info('🔒 AI Service disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', { error });
    }
  }
}