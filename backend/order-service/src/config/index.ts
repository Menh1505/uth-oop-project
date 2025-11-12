import 'dotenv/config';

export const config = {
  serviceName: 'order-service',
  port: Number(process.env.PORT ?? 3004),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  db: {
    host: process.env.DB_HOST ?? 'postgres',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres_password',
    name: process.env.DB_NAME ?? 'order_db',
    url: process.env.DATABASE_URL
  },
  mq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://admin:admin@rabbitmq:5672',
    exchange: process.env.RABBITMQ_EXCHANGE ?? 'app.exchange',
    exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE ?? 'topic'
  },
  auth: {
    // Gateway nên verify JWT; ở đây chỉ cần header x-user-id.
    // Nếu cần verify JWT nội bộ, thêm PUBLIC_KEY/SECRET tại đây.
    userIdHeader: process.env.USER_ID_HEADER ?? 'x-user-id'
  }
} as const;
