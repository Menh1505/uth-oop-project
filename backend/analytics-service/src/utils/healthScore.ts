import type { UserDailyHabitDocument, UserDailyNutritionDocument } from "../models/index.js";

export function calculateMacroPercentages(nutrition: UserDailyNutritionDocument) {
  nutrition.proteinGrams = nutrition.proteinGrams ?? 0;
  nutrition.carbGrams = nutrition.carbGrams ?? 0;
  nutrition.fatGrams = nutrition.fatGrams ?? 0;
  const total = nutrition.proteinGrams + nutrition.carbGrams + nutrition.fatGrams;
  if (total <= 0) {
    nutrition.proteinPercentage = 0;
    nutrition.carbPercentage = 0;
    nutrition.fatPercentage = 0;
    return;
  }
  nutrition.proteinPercentage = round((nutrition.proteinGrams / total) * 100, 2);
  nutrition.carbPercentage = round((nutrition.carbGrams / total) * 100, 2);
  nutrition.fatPercentage = round((nutrition.fatGrams / total) * 100, 2);
}

export function calculateHealthScore(
  nutrition: UserDailyNutritionDocument,
  habit: UserDailyHabitDocument
) {
  const totalCaloriesIn = nutrition.totalCaloriesIn ?? 0;
  const target = (nutrition.calorieTarget ?? 0) > 0 ? nutrition.calorieTarget ?? 0 : 2000;
  const deviation = Math.min(Math.abs(totalCaloriesIn - target) / target, 1);
  const calorieScore = (1 - deviation) * 40;
  const mealScore = Math.min((habit.mealLoggingStreakDays ?? 0) * 5, 25);
  const workoutScore = Math.min((habit.workoutLoggingStreakDays ?? 0) * 4, 20);
  const activityScore = Math.min((nutrition.workoutsLoggedCount ?? 0) * 5, 15);
  return Math.max(0, Math.min(100, Math.round(calorieScore + mealScore + workoutScore + activityScore)));
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
