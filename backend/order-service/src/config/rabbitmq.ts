export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL!,
  exchange: process.env.RABBITMQ_EXCHANGE ?? 'app.exchange',
  exchangeType: (process.env.RABBITMQ_EXCHANGE_TYPE as any) ?? 'topic'
};
