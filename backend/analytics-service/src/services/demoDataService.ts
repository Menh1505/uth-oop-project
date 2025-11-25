import { config } from "../config/env.js";
import {
  UserBodyMetricModel,
  UserDailyHabitModel,
  UserDailyNutritionModel,
  UserWorkoutAggregateModel,
} from "../models/index.js";
import { logger } from "../utils/logger.js";

function toDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function clampDays(start: string, end: string) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  const maxDays = Math.max(1, config.demoData.maxDays);
  const days = Math.min(
    Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1,
    maxDays
  );
  const limitedEnd = new Date(startDate);
  limitedEnd.setUTCDate(startDate.getUTCDate() + days - 1);
  return { startDate, endDate: limitedEnd };
}

export async function ensureDemoData(userId: string, start: string, end: string) {
  if (!config.demoData.enabled) return;

  const existing = await UserDailyNutritionModel.exists({
    userId,
    date: { $gte: start, $lte: end },
  });
  if (existing) return;

  const { startDate, endDate } = clampDays(start, end);
  const days: string[] = [];
  for (
    let cursor = new Date(startDate);
    cursor.getTime() <= endDate.getTime();
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    days.push(formatDate(cursor));
  }

  const baseWeight = config.demoData.startWeight;
  const nutritionDocs = [];
  const habitDocs = [];
  const workoutDocs = [];
  const bodyDocs = [];

  let weight = baseWeight;
  let mealStreak = 3;
  let workoutStreak = 2;

  for (const day of days) {
    // Nutrition
    const caloriesIn = randomBetween(1800, 2400);
    const caloriesOut = randomBetween(300, 650);
    const calorieTarget = 2100;
    const protein = randomBetween(110, 160);
    const carbs = randomBetween(180, 240);
    const fat = randomBetween(50, 70);
    const macroTotal = protein + carbs + fat;

    nutritionDocs.push({
      userId,
      date: day,
      totalCaloriesIn: caloriesIn,
      totalCaloriesOut: caloriesOut,
      calorieTarget,
      calorieBalance: caloriesIn - calorieTarget,
      proteinGrams: protein,
      carbGrams: carbs,
      fatGrams: fat,
      proteinPercentage: Math.round((protein / macroTotal) * 100),
      carbPercentage: Math.round((carbs / macroTotal) * 100),
      fatPercentage: Math.round((fat / macroTotal) * 100),
      mealsLoggedCount: randomBetween(2, 4),
      workoutsLoggedCount: randomBetween(0, 1),
      totalWorkoutMinutes: randomBetween(20, 60),
    });

    // Habits
    mealStreak = Math.min(mealStreak + 1, 14);
    workoutStreak = Math.min(workoutStreak + (Math.random() > 0.3 ? 1 : 0), 10);
    habitDocs.push({
      userId,
      date: day,
      loggedAnyMeal: true,
      loggedFullDayMeals: true,
      completedAnyWorkout: Math.random() > 0.4,
      mealLoggingStreakDays: mealStreak,
      workoutLoggingStreakDays: workoutStreak,
      healthScore: randomBetween(60, 95),
    });

    // Workout
    workoutDocs.push({
      userId,
      date: day,
      workoutType: "cardio",
      sessions: 1,
      totalMinutes: randomBetween(20, 45),
      totalCaloriesBurned: caloriesOut,
    });

    // Body metrics (simple downward trend)
    weight = Math.max(weight - randomBetween(0, 0.15), weight - 0.2);
    bodyDocs.push({
      userId,
      date: day,
      weight: Math.round(weight * 10) / 10,
      recordedAt: new Date(`${day}T08:00:00.000Z`),
    });
  }

  try {
    await Promise.all([
      UserDailyNutritionModel.insertMany(nutritionDocs, { ordered: false }),
      UserDailyHabitModel.insertMany(habitDocs, { ordered: false }),
      UserWorkoutAggregateModel.insertMany(workoutDocs, { ordered: false }),
      UserBodyMetricModel.insertMany(bodyDocs, { ordered: false }),
    ]);
    logger.info(
      { userId, days: days.length },
      "Seeded demo analytics data (ENABLE_DEMO_DATA=true)"
    );
  } catch (error) {
    logger.warn({ error }, "Failed to seed demo data (might already exist)");
  }
}

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
