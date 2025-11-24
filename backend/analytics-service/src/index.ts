import { createApp } from "./app.js";
import { connectMongo } from "./db/mongo.js";
import { rabbitConsumer } from "./consumers/rabbitConsumer.js";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  await connectMongo();
  await rabbitConsumer.start();

  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`Analytics service listening on port ${config.port}`);
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to bootstrap analytics service");
  process.exit(1);
});
