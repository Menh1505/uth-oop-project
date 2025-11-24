import { Schema, model, type Document } from "mongoose";

export interface UserGoalProgressSnapshotAttrs {
  userId: string;
  goalId: string;
  goalType?: string;
  targetWeight?: number;
  targetDailyCalories?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  startingWeight?: number;
  currentWeight?: number;
  plannedDurationDays?: number;
  daysLeft?: number;
  percentageOfGoalCompleted?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserGoalProgressSnapshotDocument = Document & UserGoalProgressSnapshotAttrs;

const UserGoalProgressSnapshotSchema = new Schema<UserGoalProgressSnapshotDocument>(
  {
    userId: { type: String, required: true },
    goalId: { type: String, required: true },
    goalType: { type: String, default: "unknown" },
    targetWeight: { type: Number },
    targetDailyCalories: { type: Number },
    startDate: { type: String },
    endDate: { type: String },
    status: { type: String, default: "active" },
    startingWeight: { type: Number },
    currentWeight: { type: Number },
    plannedDurationDays: { type: Number, default: 0 },
    daysLeft: { type: Number, default: 0 },
    percentageOfGoalCompleted: { type: Number, default: 0 },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

UserGoalProgressSnapshotSchema.index({ goalId: 1 }, { unique: true });

export const UserGoalProgressSnapshotModel = model<UserGoalProgressSnapshotDocument>(
  "UserGoalProgressSnapshot",
  UserGoalProgressSnapshotSchema,
  "user_goal_progress"
);
