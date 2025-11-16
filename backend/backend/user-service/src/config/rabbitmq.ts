export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'auth_exchange', // đồng bộ cùng auth
  exchangeType: 'direct',
  // queue cho user-service
  queue: process.env.RABBITMQ_QUEUE || 'user-service.user_events.q',
  // routing keys mà user-service cần nghe
  routingKeys: (process.env.RABBITMQ_ROUTING_KEYS || 'user.registered,user.logged_in').split(','),
} as const;

console.log('[RabbitMQ] URL =', rabbitMQConfig.url);
