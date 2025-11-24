import { Schema, model, type Document } from "mongoose";

export interface UserDailyNutritionAttrs {
  userId: string;
  date: string; // YYYY-MM-DD
  totalCaloriesIn?: number;
  totalCaloriesOut?: number;
  calorieTarget?: number;
  calorieBalance?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  proteinPercentage?: number;
  carbPercentage?: number;
  fatPercentage?: number;
  mealsLoggedCount?: number;
  workoutsLoggedCount?: number;
  totalWorkoutMinutes?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDailyNutritionDocument = Document & UserDailyNutritionAttrs;

const UserDailyNutritionSchema = new Schema<UserDailyNutritionDocument>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    totalCaloriesIn: { type: Number, default: 0 },
    totalCaloriesOut: { type: Number, default: 0 },
    calorieTarget: { type: Number, default: 0 },
    calorieBalance: { type: Number, default: 0 },
    proteinGrams: { type: Number, default: 0 },
    carbGrams: { type: Number, default: 0 },
    fatGrams: { type: Number, default: 0 },
    proteinPercentage: { type: Number, default: 0 },
    carbPercentage: { type: Number, default: 0 },
    fatPercentage: { type: Number, default: 0 },
    mealsLoggedCount: { type: Number, default: 0 },
    workoutsLoggedCount: { type: Number, default: 0 },
    totalWorkoutMinutes: { type: Number, default: 0 },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

UserDailyNutritionSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UserDailyNutritionModel = model<UserDailyNutritionDocument>(
  "UserDailyNutrition",
  UserDailyNutritionSchema,
  "user_daily_nutrition"
);
