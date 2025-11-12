export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  exchange: 'user_exchange',
  exchangeType: 'direct',
};

console.log('[RabbitMQ] URL =', rabbitMQConfig.url);