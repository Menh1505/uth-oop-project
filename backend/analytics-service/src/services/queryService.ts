import {
  UserBodyMetricModel,
  UserDailyHabitModel,
  UserDailyNutritionModel,
  UserWorkoutAggregateModel,
} from "../models/index.js";
import type { HabitScoreResponse, HealthSummaryResponse } from "../types/responses.js";
import { formatInsights } from "../utils/insights.js";

export class AnalyticsQueryService {
  async getHealthSummary(userId: string, from: string, to: string): Promise<HealthSummaryResponse> {
    const nutritionRows = await UserDailyNutritionModel.find({
      userId,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean();

    const habits = await UserDailyHabitModel.find({ userId, date: { $gte: from, $lte: to } }).lean();
    const habitLookup = new Map(habits.map((h) => [h.date, h]));

    const daily = nutritionRows.map((n) => ({
      date: n.date,
      caloriesIn: round(n.totalCaloriesIn ?? 0),
      caloriesOut: round(n.totalCaloriesOut ?? 0),
      calorieBalance: round(n.calorieBalance ?? 0),
      calorieTarget: round(n.calorieTarget ?? 0),
      mealsLoggedCount: n.mealsLoggedCount ?? 0,
      workoutsLoggedCount: n.workoutsLoggedCount ?? 0,
      proteinGrams: round(n.proteinGrams ?? 0),
      carbGrams: round(n.carbGrams ?? 0),
      fatGrams: round(n.fatGrams ?? 0),
      proteinPercentage: round(n.proteinPercentage ?? 0),
      carbPercentage: round(n.carbPercentage ?? 0),
      fatPercentage: round(n.fatPercentage ?? 0),
      healthScore: habitLookup.get(n.date)?.healthScore ?? 0,
    }));

    const averages = {
      caloriesIn: average(daily.map((d) => d.caloriesIn)),
      caloriesOut: average(daily.map((d) => d.caloriesOut)),
      calorieBalance: average(daily.map((d) => d.calorieBalance)),
      healthScore: average(daily.map((d) => d.healthScore)),
    };

    const macroTotals = daily.reduce(
      (acc, d) => {
        acc.protein += d.proteinGrams;
        acc.carbs += d.carbGrams;
        acc.fat += d.fatGrams;
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0 }
    );
    const totalMacro = macroTotals.protein + macroTotals.carbs + macroTotals.fat;
    const macroBreakdown = {
      proteinPercentage: totalMacro ? round((macroTotals.protein / totalMacro) * 100) : 0,
      carbPercentage: totalMacro ? round((macroTotals.carbs / totalMacro) * 100) : 0,
      fatPercentage: totalMacro ? round((macroTotals.fat / totalMacro) * 100) : 0,
      proteinGrams: round(macroTotals.protein),
      carbGrams: round(macroTotals.carbs),
      fatGrams: round(macroTotals.fat),
    };

    const workouts = await UserWorkoutAggregateModel.find({ userId, date: { $gte: from, $lte: to } }).lean();
    const workoutByWeek = new Map<string, { sessions: number; minutes: number }>();
    workouts.forEach((w) => {
      const weekStart = getWeekStart(w.date);
      const entry = workoutByWeek.get(weekStart) || { sessions: 0, minutes: 0 };
      entry.sessions += w.sessions ?? 0;
      entry.minutes += w.totalMinutes ?? 0;
      workoutByWeek.set(weekStart, entry);
    });

    const workoutSessionsPerWeek = Array.from(workoutByWeek.entries())
      .map(([weekStart, value]) => ({ weekStart, sessions: value.sessions, minutes: round(value.minutes) }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    const weightTrend = await UserBodyMetricModel.find({ userId, date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .lean()
      .then((rows) => rows.map((row) => ({ date: row.date, weight: row.weight })));

    const insights = formatInsights(daily, macroBreakdown);

    return {
      userId,
      from,
      to,
      daily,
      averages,
      macroBreakdown,
      workoutSessionsPerWeek,
      insights,
      weightTrend,
    };
  }

  async getHabitScore(userId: string, from: string, to: string): Promise<HabitScoreResponse> {
    const rows = await UserDailyHabitModel.find({ userId, date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .lean();
    const daily = rows.map((row) => ({
      date: row.date,
      healthScore: row.healthScore ?? 0,
      mealLoggingStreakDays: row.mealLoggingStreakDays ?? 0,
      workoutLoggingStreakDays: row.workoutLoggingStreakDays ?? 0,
    }));

    let bestDay: (typeof daily)[number] | undefined;
    let worstDay: (typeof daily)[number] | undefined;
    for (const item of daily) {
      if (!bestDay || item.healthScore > bestDay.healthScore) {
        bestDay = item;
      }
      if (!worstDay || item.healthScore < worstDay.healthScore) {
        worstDay = item;
      }
    }

    const summary = {
      averageHealthScore: average(daily.map((d) => d.healthScore)),
      bestDay,
      worstDay,
      mealLoggingStreakDays: daily.at(-1)?.mealLoggingStreakDays ?? 0,
      workoutLoggingStreakDays: daily.at(-1)?.workoutLoggingStreakDays ?? 0,
    };

    return { userId, from, to, daily, summary };
  }
}

export const queryService = new AnalyticsQueryService();

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (!values.length) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return round(sum / values.length);
}

function getWeekStart(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const dayString = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${dayString}`;
}
