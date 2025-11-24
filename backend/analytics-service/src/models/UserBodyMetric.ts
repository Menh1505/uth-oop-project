import { Schema, model, type Document } from "mongoose";

export interface UserBodyMetricAttrs {
  userId: string;
  date: string;
  weight: number;
  height?: number;
  recordedAt: Date;
}

export type UserBodyMetricDocument = Document & UserBodyMetricAttrs;

const UserBodyMetricSchema = new Schema<UserBodyMetricDocument>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    weight: { type: Number, required: true },
    height: { type: Number },
    recordedAt: { type: Date, required: true },
  },
  { versionKey: false }
);

UserBodyMetricSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UserBodyMetricModel = model<UserBodyMetricDocument>(
  "UserBodyMetric",
  UserBodyMetricSchema,
  "user_body_metrics"
);
