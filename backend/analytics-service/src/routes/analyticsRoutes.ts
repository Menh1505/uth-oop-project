import { Router } from "express";
import { queryService } from "../services/queryService.js";
import { logger } from "../utils/logger.js";
import { ensureDemoData } from "../services/demoDataService.js";

const router = Router();

const healthPaths = [
  "/analytics/users/:userId/health-summary",
  "/api/analytics/users/:userId/health-summary",
];
const habitPaths = [
  "/analytics/users/:userId/habit-score",
  "/api/analytics/users/:userId/habit-score",
];

router.get(healthPaths, async (req, res) => {
  try {
    const { userId } = req.params;
    const { range, from, to } = req.query as Record<string, string | undefined>;
    const { start, end } = resolveRange(range, from, to);
    await ensureDemoData(userId, start, end);
    const data = await queryService.getHealthSummary(userId, start, end);
    res.json(data);
  } catch (error) {
    logger.error({ error }, "Health summary error");
    res.status(500).json({ error: "Failed to fetch health summary" });
  }
});

router.get(habitPaths, async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query as Record<string, string | undefined>;
    const start = from && isValidDate(from) ? from : getDateKeyDaysAgo(30);
    const end = to && isValidDate(to) ? to : getTodayKey();
    await ensureDemoData(userId, start, end);
    const data = await queryService.getHabitScore(userId, start, end);
    res.json(data);
  } catch (error) {
    logger.error({ error }, "Habit score error");
    res.status(500).json({ error: "Failed to fetch habit score" });
  }
});

function resolveRange(range?: string, from?: string, to?: string) {
  if (from && to && isValidDate(from) && isValidDate(to)) {
    return from <= to ? { start: from, end: to } : { start: to, end: from };
  }

  const today = getTodayKey();
  let days = 7;
  if (range === "30d") days = 30;
  if (range === "90d") days = 90;
  const start = getDateKeyDaysAgo(days - 1);
  return { start, end: today };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDateKeyDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default router;
