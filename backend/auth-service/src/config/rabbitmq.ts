export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  exchange: 'auth_exchange',
  exchangeType: 'direct',
};
