import { Schema, model, type Document } from "mongoose";

export interface UserDailyHabitAttrs {
  userId: string;
  date: string;
  loggedAnyMeal?: boolean;
  loggedFullDayMeals?: boolean;
  completedAnyWorkout?: boolean;
  mealLoggingStreakDays?: number;
  workoutLoggingStreakDays?: number;
  healthScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDailyHabitDocument = Document & UserDailyHabitAttrs;

const UserDailyHabitSchema = new Schema<UserDailyHabitDocument>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    loggedAnyMeal: { type: Boolean, default: false },
    loggedFullDayMeals: { type: Boolean, default: false },
    completedAnyWorkout: { type: Boolean, default: false },
    mealLoggingStreakDays: { type: Number, default: 0 },
    workoutLoggingStreakDays: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

UserDailyHabitSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UserDailyHabitModel = model<UserDailyHabitDocument>(
  "UserDailyHabit",
  UserDailyHabitSchema,
  "user_daily_habits"
);
