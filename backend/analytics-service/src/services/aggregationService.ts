import {
  UserBodyMetricModel,
  UserDailyHabitModel,
  UserDailyNutritionModel,
  UserGoalProgressSnapshotModel,
  UserWorkoutAggregateModel,
  type UserDailyHabitDocument,
  type UserDailyNutritionDocument,
  type UserGoalProgressSnapshotDocument,
} from "../models/index.js";
import { calculateHealthScore, calculateMacroPercentages } from "../utils/healthScore.js";
import { previousDateKey, toDateKey } from "../utils/date.js";
import type {
  BodyMetricsUpdatedEvent,
  GoalUpdatedEvent,
  MealLoggedEvent,
  WorkoutLoggedEvent,
} from "../types/events.js";

export class AnalyticsAggregationService {
  async handleMealLogged(event: MealLoggedEvent) {
    const dateKey = toDateKey(event.loggedAt);
    const nutrition = await this.getOrCreateDailyNutrition(event.userId, dateKey);
    nutrition.totalCaloriesIn = (nutrition.totalCaloriesIn ?? 0) + event.totalCalories;
    nutrition.proteinGrams = (nutrition.proteinGrams ?? 0) + event.proteinGrams;
    nutrition.carbGrams = (nutrition.carbGrams ?? 0) + event.carbsGrams;
    nutrition.fatGrams = (nutrition.fatGrams ?? 0) + event.fatsGrams;
    nutrition.mealsLoggedCount = (nutrition.mealsLoggedCount ?? 0) + 1;
    nutrition.totalCaloriesOut = nutrition.totalCaloriesOut ?? 0;
    nutrition.calorieBalance = nutrition.totalCaloriesIn - nutrition.totalCaloriesOut;
    nutrition.updatedAt = new Date();
    calculateMacroPercentages(nutrition);
    await nutrition.save();

    const habit = await this.getOrCreateDailyHabit(event.userId, dateKey);
    habit.loggedAnyMeal = true;
    habit.loggedFullDayMeals = (nutrition.mealsLoggedCount ?? 0) >= 3;
    habit.mealLoggingStreakDays = await this.calculateMealStreak(event.userId, dateKey);
    habit.updatedAt = new Date();
    await habit.save();

    await this.recalculateHealthScore(event.userId, dateKey, nutrition, habit);
  }

  async handleWorkoutLogged(event: WorkoutLoggedEvent) {
    const dateKey = toDateKey(event.startedAt);
    const nutrition = await this.getOrCreateDailyNutrition(event.userId, dateKey);
    nutrition.totalCaloriesOut = (nutrition.totalCaloriesOut ?? 0) + event.caloriesBurned;
    nutrition.totalWorkoutMinutes = (nutrition.totalWorkoutMinutes ?? 0) + event.durationMinutes;
    nutrition.workoutsLoggedCount = (nutrition.workoutsLoggedCount ?? 0) + 1;
    nutrition.totalCaloriesIn = nutrition.totalCaloriesIn ?? 0;
    nutrition.calorieBalance = nutrition.totalCaloriesIn - nutrition.totalCaloriesOut;
    nutrition.updatedAt = new Date();
    calculateMacroPercentages(nutrition);
    await nutrition.save();

    const habit = await this.getOrCreateDailyHabit(event.userId, dateKey);
    habit.completedAnyWorkout = true;
    habit.workoutLoggingStreakDays = await this.calculateWorkoutStreak(event.userId, dateKey);
    habit.updatedAt = new Date();
    await habit.save();

    await UserWorkoutAggregateModel.findOneAndUpdate(
      { userId: event.userId, date: dateKey, workoutType: event.workoutType || "unknown" },
      {
        $inc: {
          sessions: 1,
          totalMinutes: event.durationMinutes,
          totalCaloriesBurned: event.caloriesBurned,
        },
      },
      { upsert: true, new: true }
    );

    await this.recalculateHealthScore(event.userId, dateKey, nutrition, habit);
  }

  async handleGoalUpdated(event: GoalUpdatedEvent) {
    const startDate = event.startDate ? toDateKey(event.startDate) : undefined;
    const endDate = event.endDate ? toDateKey(event.endDate) : undefined;
    const planned = this.calculatePlannedDurationDays(startDate, endDate);
    const daysLeft = this.calculateDaysLeft(endDate);

    await UserGoalProgressSnapshotModel.findOneAndUpdate(
      { goalId: event.goalId },
      {
        userId: event.userId,
        goalType: event.goalType,
        targetWeight: event.targetWeight,
        targetDailyCalories: event.targetDailyCalories,
        startDate,
        endDate,
        status: event.status,
        plannedDurationDays: planned,
        daysLeft,
        updatedAt: new Date(),
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    await this.updateCalorieTargetsForGoal(event, startDate, endDate);
  }

  async handleBodyMetricsUpdated(event: BodyMetricsUpdatedEvent) {
    const dateKey = toDateKey(event.recordedAt);
    await UserBodyMetricModel.findOneAndUpdate(
      { userId: event.userId, date: dateKey },
      {
        weight: event.weight,
        height: event.height,
        recordedAt: new Date(event.recordedAt),
      },
      { upsert: true }
    );

    const goal = await UserGoalProgressSnapshotModel.findOne({
      userId: event.userId,
      status: "active",
    }).sort({ updatedAt: -1 });

    if (goal) {
      if (!goal.startingWeight) {
        goal.startingWeight = event.weight;
      }
      goal.currentWeight = event.weight;
      goal.daysLeft = this.calculateDaysLeft(goal.endDate);
      goal.percentageOfGoalCompleted = this.calculateGoalCompletion(goal);
      goal.updatedAt = new Date();
      await goal.save();
    }
  }

  private async getOrCreateDailyNutrition(userId: string, date: string) {
    const nutrition = await UserDailyNutritionModel.findOne({ userId, date });
    if (nutrition) return nutrition;

    return await UserDailyNutritionModel.create({
      userId,
      date,
      calorieTarget: await this.getActiveCalorieTarget(userId),
    });
  }

  private async getOrCreateDailyHabit(userId: string, date: string) {
    const habit = await UserDailyHabitModel.findOne({ userId, date });
    if (habit) return habit;
    return await UserDailyHabitModel.create({ userId, date });
  }

  private async recalculateHealthScore(
    userId: string,
    date: string,
    nutrition?: UserDailyNutritionDocument,
    habit?: UserDailyHabitDocument
  ) {
    const dailyNutrition = nutrition || (await UserDailyNutritionModel.findOne({ userId, date }));
    const dailyHabit = habit || (await UserDailyHabitModel.findOne({ userId, date }));
    if (!dailyNutrition || !dailyHabit) return;

    dailyHabit.healthScore = calculateHealthScore(dailyNutrition, dailyHabit);
    dailyHabit.updatedAt = new Date();
    await dailyHabit.save();
  }

  private async calculateMealStreak(userId: string, date: string) {
    const prev = await UserDailyHabitModel.findOne({ userId, date: previousDateKey(date) });
    const prevStreak = prev?.loggedAnyMeal ? prev.mealLoggingStreakDays ?? 0 : 0;
    return prevStreak + 1;
  }

  private async calculateWorkoutStreak(userId: string, date: string) {
    const prev = await UserDailyHabitModel.findOne({ userId, date: previousDateKey(date) });
    const prevStreak = prev?.completedAnyWorkout ? prev.workoutLoggingStreakDays ?? 0 : 0;
    return prevStreak + 1;
  }

  private calculatePlannedDurationDays(start?: string, end?: string) {
    if (!start || !end) return 0;
    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T00:00:00.000Z`);
    return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000));
  }

  private calculateDaysLeft(end?: string | null) {
    if (!end) return 0;
    const endDate = new Date(`${end}T00:00:00.000Z`);
    const today = new Date();
    const diff = Math.round((endDate.getTime() - today.getTime()) / 86_400_000);
    return Math.max(0, diff);
  }

  private calculateGoalCompletion(goal: UserGoalProgressSnapshotDocument) {
    if (
      goal.startingWeight === undefined ||
      goal.startingWeight === null ||
      goal.currentWeight === undefined ||
      goal.currentWeight === null ||
      goal.targetWeight === undefined ||
      goal.targetWeight === null
    ) {
      return goal.percentageOfGoalCompleted || 0;
    }
    const total = Math.abs(goal.startingWeight - goal.targetWeight);
    if (total <= 0) return 100;
    const progress = Math.abs(goal.startingWeight - goal.currentWeight);
    return Math.min(100, Math.max(0, (progress / total) * 100));
  }

  private async getActiveCalorieTarget(userId: string) {
    const snapshot = await UserGoalProgressSnapshotModel.findOne({
      userId,
      status: "active",
    }).sort({ updatedAt: -1 });
    return snapshot?.targetDailyCalories || 0;
  }

  private async updateCalorieTargetsForGoal(
    event: GoalUpdatedEvent,
    startDate?: string,
    endDate?: string
  ) {
    if (!event.targetDailyCalories) return;
    const filter: Record<string, any> = { userId: event.userId };
    if (startDate) filter.date = { $gte: startDate };
    if (endDate) {
      filter.date = { ...(filter.date || {}), $lte: endDate };
    }
    if (!startDate && !endDate) {
      const today = toDateKey(new Date());
      const thirtyDaysAgo = previousDateKey(today, 30);
      filter.date = { $gte: thirtyDaysAgo };
    }

    await UserDailyNutritionModel.updateMany(filter, {
      $set: { calorieTarget: event.targetDailyCalories },
    });
  }
}

export const aggregationService = new AnalyticsAggregationService();
