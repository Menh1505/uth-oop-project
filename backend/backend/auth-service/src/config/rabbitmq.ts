export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'auth_exchange',
  exchangeType: 'direct',
} as const;

console.log('[RabbitMQ] URL =', rabbitMQConfig.url);
  