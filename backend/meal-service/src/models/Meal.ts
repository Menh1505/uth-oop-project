import { Document, Schema, model } from 'mongoose';
import { randomUUID } from 'crypto';

export interface JwtClaims {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export type LoaiBuaAn = 'Bữa sáng' | 'Bữa trưa' | 'Bữa tối' | 'Ăn vặt';
export type TrangThaiCalo = 'Đạt mục tiêu' | 'Chưa đạt' | 'Vượt mức';

export interface MealDocument extends Document<string> {
  _id: string;
  user_id: string;
  ten_mon: string;
  loai_bua_an: LoaiBuaAn;
  luong_calories: number;
  khoi_luong: number;
  ngay_an: string;
  thoi_gian_an: string;
  ghi_chu?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DailyCaloriesDocument extends Document<string> {
  _id: string;
  user_id: string;
  ngay: string;
  tong_calo: number;
  calo_muc_tieu?: number | null;
  trang_thai_calo: TrangThaiCalo;
  updated_at: Date;
}

export type MealDTO = {
  id: string;
  user_id: string;
  ten_mon: string;
  loai_bua_an: LoaiBuaAn;
  luong_calories: number;
  khoi_luong: number;
  ngay_an: string;
  thoi_gian_an: string;
  ghi_chu?: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyCaloriesDTO = {
  id: string;
  user_id: string;
  ngay: string;
  tong_calo: number;
  calo_muc_tieu?: number | null;
  trang_thai_calo: TrangThaiCalo;
  updated_at: string;
};

export interface CreateMealEntryPayload {
  ten_mon: string;
  loai_bua_an: LoaiBuaAn;
  luong_calories: number;
  khoi_luong: number;
  ngay_an: string;
  thoi_gian_an: string;
  ghi_chu?: string;
}

export interface UpdateMealEntryPayload {
  ten_mon?: string;
  loai_bua_an?: LoaiBuaAn;
  luong_calories?: number;
  khoi_luong?: number;
  ngay_an?: string;
  thoi_gian_an?: string;
  ghi_chu?: string | null;
}

export interface MealTemplateDocument extends Document<string> {
  _id: string;
  ten_mon: string;
  loai_bua_an: LoaiBuaAn;
  luong_calories: number;
  khoi_luong: number;
  description?: string | null;
  image_url?: string | null;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export type MealTemplateDTO = {
  id: string;
  ten_mon: string;
  loai_bua_an: LoaiBuaAn;
  luong_calories: number;
  khoi_luong: number;
  description?: string | null;
  image_url?: string | null;
  priority: number;
};

const mealSchema = new Schema<MealDocument>(
  {
    _id: { type: String, default: () => randomUUID() },
    user_id: { type: String, required: true, index: true },
    ten_mon: { type: String, required: true },
    loai_bua_an: {
      type: String,
      enum: ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Ăn vặt'],
      required: true,
    },
    luong_calories: { type: Number, required: true, min: 0 },
    khoi_luong: { type: Number, required: true, min: 0 },
    ngay_an: { type: String, required: true, index: true },
    thoi_gian_an: { type: String, required: true },
    ghi_chu: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

mealSchema.index({ user_id: 1, ngay_an: 1, thoi_gian_an: 1 });

mealSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    (ret as any).id = ret._id;
    delete (ret as any)._id;
  },
});

const dailyCaloriesSchema = new Schema<DailyCaloriesDocument>(
  {
    _id: { type: String, default: () => randomUUID() },
    user_id: { type: String, required: true, index: true },
    ngay: { type: String, required: true },
    tong_calo: { type: Number, required: true, default: 0 },
    calo_muc_tieu: { type: Number, default: null },
    trang_thai_calo: {
      type: String,
      enum: ['Đạt mục tiêu', 'Chưa đạt', 'Vượt mức'],
      required: true,
      default: 'Chưa đạt',
    },
    updated_at: { type: Date, default: () => new Date() },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);

dailyCaloriesSchema.index({ user_id: 1, ngay: 1 }, { unique: true });

dailyCaloriesSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    (ret as any).id = ret._id;
    delete (ret as any)._id;
  },
});

export const MealModel = model<MealDocument>('Meal', mealSchema);
export const DailyCaloriesModel = model<DailyCaloriesDocument>('DailyCalories', dailyCaloriesSchema);

const mealTemplateSchema = new Schema<MealTemplateDocument>(
  {
    _id: { type: String, default: () => randomUUID() },
    ten_mon: { type: String, required: true },
    loai_bua_an: {
      type: String,
      enum: ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Ăn vặt'],
      required: true,
    },
    luong_calories: { type: Number, required: true, min: 0 },
    khoi_luong: { type: Number, required: true, min: 0 },
    description: { type: String, default: null },
    image_url: { type: String, default: null },
    priority: { type: Number, default: 100, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

mealTemplateSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    (ret as any).id = ret._id;
    delete (ret as any)._id;
  },
});

export const MealTemplateModel = model<MealTemplateDocument>('MealTemplate', mealTemplateSchema);

