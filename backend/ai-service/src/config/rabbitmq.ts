export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'ai_exchange',
  exchangeType: 'direct' as const,
  queue: process.env.RABBITMQ_QUEUE || 'ai-service.requests.q',
  routingKeys: (process.env.RABBITMQ_ROUTING_KEYS || 'ai.coach_request').split(','),
  deadLetterExchange: 'ai_dead_letter_exchange',
  deadLetterQueue: 'ai-service.dead_letter.q'
} as const;

console.log('[RabbitMQ] AI Service URL =', rabbitMQConfig.url);