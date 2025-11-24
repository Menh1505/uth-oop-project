import { connect, type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { aggregationService } from "../services/aggregationService.js";
import type {
  BodyMetricsUpdatedEvent,
  GoalUpdatedEvent,
  MealLoggedEvent,
  WorkoutLoggedEvent,
} from "../types/events.js";

const ROUTING_KEYS = {
  meals: "meal.logged",
  workouts: "workout.logged",
  goals: "user.goal.updated",
  body: "user.bodymetrics.updated",
};

export class RabbitConsumer {
  private connection?: ChannelModel;
  private channel?: Channel;

  async start() {
    const connection = await connect(config.rabbitMq.url);
    const channel = await connection.createChannel();
    this.connection = connection;
    this.channel = channel;
    await channel.assertExchange(config.rabbitMq.exchange, "topic", { durable: true });

    await Promise.all([
      this.consumeQueue(config.rabbitMq.queues.meals, ROUTING_KEYS.meals, (msg) =>
        this.handleMeal(msg)
      ),
      this.consumeQueue(config.rabbitMq.queues.workouts, ROUTING_KEYS.workouts, (msg) =>
        this.handleWorkout(msg)
      ),
      this.consumeQueue(config.rabbitMq.queues.goals, ROUTING_KEYS.goals, (msg) =>
        this.handleGoal(msg)
      ),
      this.consumeQueue(config.rabbitMq.queues.body, ROUTING_KEYS.body, (msg) =>
        this.handleBody(msg)
      ),
    ]);

    logger.info("RabbitMQ consumers running");
  }

  private async consumeQueue(queue: string, routingKey: string, handler: (message: ConsumeMessage) => Promise<void>) {
    const channel = this.channel;
    if (!channel) throw new Error("Channel not initialized");
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, config.rabbitMq.exchange, routingKey);
    await channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        await handler(msg);
        channel.ack(msg);
      } catch (error) {
        logger.error({ error }, `Error processing message for ${routingKey}`);
        channel.nack(msg, false, true);
      }
    });
  }

  private async handleMeal(message: ConsumeMessage) {
    const payload = this.safeParse<MealLoggedEvent>(message.content.toString());
    if (payload) {
      await aggregationService.handleMealLogged(payload);
    }
  }

  private async handleWorkout(message: ConsumeMessage) {
    const payload = this.safeParse<WorkoutLoggedEvent>(message.content.toString());
    if (payload) {
      await aggregationService.handleWorkoutLogged(payload);
    }
  }

  private async handleGoal(message: ConsumeMessage) {
    const payload = this.safeParse<GoalUpdatedEvent>(message.content.toString());
    if (payload) {
      await aggregationService.handleGoalUpdated(payload);
    }
  }

  private async handleBody(message: ConsumeMessage) {
    const payload = this.safeParse<BodyMetricsUpdatedEvent>(message.content.toString());
    if (payload) {
      await aggregationService.handleBodyMetricsUpdated(payload);
    }
  }

  private safeParse<T>(content: string): T | null {
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      logger.warn({ error }, "Failed to parse message payload");
      return null;
    }
  }
}

export const rabbitConsumer = new RabbitConsumer();
