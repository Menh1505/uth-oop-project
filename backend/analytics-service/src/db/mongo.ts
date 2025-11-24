import mongoose from "mongoose";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error({ error }, "MongoDB connection failed");
    throw error;
  }
}
