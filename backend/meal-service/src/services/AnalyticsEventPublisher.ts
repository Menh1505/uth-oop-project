import { connect, type Channel, type ChannelModel } from 'amqplib';
import logger from '../config/logger';
import { rabbitMQConfig } from '../config/rabbitmq';

export type MealLoggedEvent = {
  userId: string;
  mealId: string;
  loggedAt: string;
  totalCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
};

class AnalyticsEventPublisher {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private establishing?: Promise<void>;

  private async ensureChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }
    if (this.establishing) {
      await this.establishing;
      if (this.channel) {
        return this.channel;
      }
    }
    this.establishing = this.connect();
    await this.establishing;
    this.establishing = undefined;
    if (!this.channel) {
      throw new Error('Unable to create RabbitMQ channel');
    }
    return this.channel;
  }

  private async connect() {
    try {
      const connection = await connect(rabbitMQConfig.url);
      connection.on('close', () => {
        this.channel = null;
        this.connection = null;
      });
      connection.on('error', (error) => {
        logger.warn({ error }, '[meal-service] RabbitMQ connection error');
        this.channel = null;
        this.connection = null;
      });

      const channel = await connection.createChannel();
      await channel.assertExchange(rabbitMQConfig.exchange, rabbitMQConfig.exchangeType, { durable: true });
      this.connection = connection;
      this.channel = channel;
      logger.info('[meal-service] Connected to RabbitMQ for analytics events');
    } catch (error) {
      logger.error({ error }, '[meal-service] Failed to connect RabbitMQ for analytics events');
      throw error;
    }
  }

  async publishMealLogged(event: MealLoggedEvent) {
    const channel = await this.ensureChannel();
    const payload = Buffer.from(JSON.stringify(event));
    const published = channel.publish(rabbitMQConfig.exchange, rabbitMQConfig.mealRoutingKey, payload, {
      contentType: 'application/json',
      persistent: true,
    });
    if (!published) {
      logger.warn({ event }, '[meal-service] meal.logged publish returned false');
    } else {
      logger.debug({ routingKey: rabbitMQConfig.mealRoutingKey, mealId: event.mealId }, '[meal-service] Published meal.logged');
    }
  }
}

export const analyticsEventPublisher = new AnalyticsEventPublisher();
