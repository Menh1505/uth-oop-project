import amqplib from 'amqplib';
import logger from '../config/logger.js';
import UserService from './UserService.js';
import { avatarService } from './avatarService.js';
import { rabbitMQConfig } from '../config/rabbitmq.js';

export class MessageConsumer {
  private static connection: any = null;
  private static channel: any = null;
  private static isConnected = false;

  static async start(): Promise<void> {
    try {
      const { url, exchange, exchangeType, queue, routingKeys } = rabbitMQConfig;
      this.connection = await amqplib.connect(url);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange(exchange, exchangeType, { durable: true });
      await this.channel.assertQueue(queue, { durable: true });

      for (const key of routingKeys) {
        const routingKey = key.trim();
        if (!routingKey) continue;
        await this.channel.bindQueue(queue, exchange, routingKey);
      }
      
      await this.channel.consume(queue, this.handleMessage.bind(this), {
        noAck: false,
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
      const { userId, email, profilePictureUrl } = data;
      
      // Always ensure profile exists (idempotent)
      const profile = await UserService.createUserWithEmail(userId, email);
      logger.info({ userId, email }, 'Ensured user profile exists');

      if (profilePictureUrl) {
        await this.syncRemoteAvatar(userId, profilePictureUrl, profile?.profile_picture_url);
      }
    } catch (error) {
      logger.error({ error, data }, 'Failed to handle user registered event');
      throw error;
    }
  }

  private static async handleUserLoggedIn(data: any): Promise<void> {
    try {
      const { userId, provider, profilePictureUrl } = data;
      
      // Could update last login or other login analytics here
      logger.info({ userId }, 'User logged in');

      if (provider === 'google' && profilePictureUrl) {
        await this.syncRemoteAvatar(userId, profilePictureUrl);
      }
      
    } catch (error) {
      logger.error({ error, data }, 'Failed to handle user logged in event');
      throw error;
    }
  }

  private static async handleUserUpdated(data: any): Promise<void> {
    try {
      const { userId, changes, profilePictureUrl } = data;
      
      // Handle user profile updates from other services
      logger.info({ userId, changes }, 'User updated from external service');

      if (profilePictureUrl) {
        await this.syncRemoteAvatar(userId, profilePictureUrl);
      }
      
    } catch (error) {
      logger.error({ error, data }, 'Failed to handle user updated event');
      throw error;
    }
  }

  private static async syncRemoteAvatar(
    userId: string,
    remoteUrl: string,
    existingUrl?: string | null
  ) {
    try {
      if (!remoteUrl) return;
      if (!existingUrl) {
        try {
          const profile = await UserService.getUserProfile(userId);
          existingUrl = profile.profile_picture_url;
        } catch {
          existingUrl = undefined;
        }
      }

      const stored = await avatarService.saveRemoteImage(userId, remoteUrl);
      await UserService.updateUserProfile(userId, {
        profile_picture_url: stored.publicUrl,
      });
      if (existingUrl) {
        await avatarService.deleteAvatarByUrl(existingUrl);
      }
    } catch (error) {
      logger.warn(
        { error, userId },
        'Failed to sync remote avatar from auth-service'
      );
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
