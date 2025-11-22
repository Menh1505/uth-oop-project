import amqplib from 'amqplib';
import logger from '../config/logger';
import UserService from './UserService';

export class MessageConsumer {
  private static connection: any = null;
  private static channel: any = null;
  private static isConnected = false;

  static async start(): Promise<void> {
    try {
      const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
      
      // Connect to RabbitMQ
      this.connection = await amqplib.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Ensure exchange and queues exist
      await this.channel.assertExchange('user_events', 'topic', { durable: true });
      await this.channel.assertQueue('user_service_queue', { durable: true });
      
      // Bind queue to exchange
      await this.channel.bindQueue('user_service_queue', 'user_events', 'user.*');
      
      // Set up message consumer
      await this.channel.consume('user_service_queue', this.handleMessage.bind(this), {
        noAck: false
      });
      
      this.isConnected = true;
      logger.info('✅ MessageConsumer connected to RabbitMQ');
      
      // Handle connection events
      this.connection.on('error', (error: any) => {
        logger.error({ error }, '❌ RabbitMQ connection error');
        this.isConnected = false;
      });
      
      this.connection.on('close', () => {
        logger.warn('⚠️ RabbitMQ connection closed');
        this.isConnected = false;
      });
      
    } catch (error) {
      logger.error({ error }, '❌ Failed to start MessageConsumer');
      throw error;
    }
  }

  private static async handleMessage(message: any): Promise<void> {
    if (!message) return;

    try {
      const content = JSON.parse(message.content.toString());
      const routingKey = message.fields.routingKey;
      
      logger.info({ routingKey, content }, 'Received message');
      
      switch (routingKey) {
        case 'user.registered':
          await this.handleUserRegistered(content);
          break;
        case 'user.logged_in':
          await this.handleUserLoggedIn(content);
          break;
        case 'user.updated':
          await this.handleUserUpdated(content);
          break;
        default:
          logger.warn({ routingKey }, 'Unknown routing key');
      }
      
      // Acknowledge message
      this.channel?.ack(message);
      
    } catch (error) {
      logger.error({ error }, 'Error processing message');
      // Reject message and don't requeue
      this.channel?.nack(message, false, false);
    }
  }

  private static async handleUserRegistered(data: any): Promise<void> {
    try {
      const { userId, email } = data;
      
      // Create user profile if doesn't exist
      try {
        await UserService.getUserProfile(userId);
        logger.info({ userId }, 'User profile already exists');
      } catch (error) {
        // User doesn't exist, create them
        await UserService.createUserWithEmail(userId, email);
        logger.info({ userId, email }, 'Created user profile from auth service');
      }
    } catch (error) {
      logger.error({ error, data }, 'Failed to handle user registered event');
      throw error;
    }
  }

  private static async handleUserLoggedIn(data: any): Promise<void> {
    try {
      const { userId } = data;
      
      // Could update last login or other login analytics here
      logger.info({ userId }, 'User logged in');
      
    } catch (error) {
      logger.error({ error, data }, 'Failed to handle user logged in event');
      throw error;
    }
  }

  private static async handleUserUpdated(data: any): Promise<void> {
    try {
      const { userId, changes } = data;
      
      // Handle user profile updates from other services
      logger.info({ userId, changes }, 'User updated from external service');
      
    } catch (error) {
      logger.error({ error, data }, 'Failed to handle user updated event');
      throw error;
    }
  }

  static async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      this.isConnected = false;
      logger.info('🔒 MessageConsumer disconnected from RabbitMQ');
      
    } catch (error) {
      logger.error({ error }, 'Error closing MessageConsumer');
    }
  }

  static get connected(): boolean {
    return this.isConnected;
  }
}