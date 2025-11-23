export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'auth_exchange',
  exchangeType: 'direct',
  // queue cho goal-service
  queue: process.env.RABBITMQ_QUEUE || 'goal-service.goal_events.q',
  // routing keys mà goal-service cần nghe
  routingKeys: (process.env.RABBITMQ_ROUTING_KEYS || 'goal.created,goal.updated,goal.completed').split(','),
} as const;