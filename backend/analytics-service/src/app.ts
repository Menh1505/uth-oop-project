import express from "express";
import analyticsRoutes from "./routes/analyticsRoutes.js";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.get("/health", (_req, res) => res.json({ status: "ok", service: "analytics" }));
  app.use(analyticsRoutes);
  return app;
}
