export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  exchange: 'admin_exchange',
  exchangeType: 'direct',
};
