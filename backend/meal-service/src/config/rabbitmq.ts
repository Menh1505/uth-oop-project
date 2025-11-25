export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'fitfood.events',
  exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || 'topic',
  mealRoutingKey: process.env.RABBITMQ_MEAL_ROUTING_KEY || 'meal.logged',
} as const;
