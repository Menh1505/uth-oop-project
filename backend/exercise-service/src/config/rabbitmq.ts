export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'fitfood.events',
  exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || 'topic',
  workoutRoutingKey: process.env.RABBITMQ_WORKOUT_ROUTING_KEY || 'workout.logged',
} as const;
