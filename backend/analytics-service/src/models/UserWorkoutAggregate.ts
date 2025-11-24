import { Schema, model, type Document } from "mongoose";

export interface UserWorkoutAggregateAttrs {
  userId: string;
  date: string;
  workoutType: string;
  sessions?: number;
  totalMinutes?: number;
  totalCaloriesBurned?: number;
}

export type UserWorkoutAggregateDocument = Document & UserWorkoutAggregateAttrs;

const UserWorkoutAggregateSchema = new Schema<UserWorkoutAggregateDocument>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    workoutType: { type: String, required: true },
    sessions: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
    totalCaloriesBurned: { type: Number, default: 0 },
  },
  { versionKey: false }
);

UserWorkoutAggregateSchema.index(
  { userId: 1, date: 1, workoutType: 1 },
  { unique: true }
);

export const UserWorkoutAggregateModel = model<UserWorkoutAggregateDocument>(
  "UserWorkoutAggregate",
  UserWorkoutAggregateSchema,
  "user_workout_aggregates"
);
