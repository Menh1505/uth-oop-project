import dotenv from "dotenv";

dotenv.config();

const number = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: number(process.env.PORT, 8080),
  mongoUri:
    process.env.MONGO_URI ||
    "mongodb://analytics:analytics@mongodb:27017/analytics_service?authSource=analytics_service",
  rabbitMq: {
    url: process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672",
    exchange: process.env.RABBITMQ_EXCHANGE || "fitfood.events",
    queues: {
      meals: process.env.RABBITMQ_MEAL_QUEUE || "analytics.meal.logged.q",
      workouts: process.env.RABBITMQ_WORKOUT_QUEUE || "analytics.workout.logged.q",
      goals: process.env.RABBITMQ_GOAL_QUEUE || "analytics.goal.updated.q",
      body: process.env.RABBITMQ_BODY_QUEUE || "analytics.bodymetrics.updated.q",
    },
  },
  demoData: {
    enabled: (process.env.ENABLE_DEMO_DATA || "true").toLowerCase() === "true",
    maxDays: number(process.env.DEMO_DATA_MAX_DAYS, 30),
    startWeight: number(process.env.DEMO_DATA_START_WEIGHT, 70),
  },
};
