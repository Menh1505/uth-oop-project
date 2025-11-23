import { Schema, model, Document } from 'mongoose';
import { v4 as uuid } from 'uuid';

export type LoaiMucTieu = 'Giảm cân' | 'Tăng cân' | 'Giữ dáng' | 'Tăng cơ';
export type TrangThaiGoal = 'Đang thực hiện' | 'Đã hoàn thành' | 'Hủy bỏ';
export type GioTap = 0.5 | 1 | 1.5 | 2;

export interface IUserTargetGoal extends Document {
  goal_id: string;
  user_id: string;
  loai_muc_tieu: LoaiMucTieu;
  can_nang_hien_tai: number;
  can_nang_muc_tieu: number;
  tong_calo_moi_ngay: number;
  so_gio_tap_moi_ngay: GioTap;
  thoi_gian_dat_muc_tieu: number;
  trang_thai: TrangThaiGoal;
  tien_trinh: number;
  calo_muc_tieu: number;
  calo_da_dot: number;
  last_progress_update: Date;
  created_at: Date;
  updated_at: Date;
}

const userTargetGoalSchema = new Schema<IUserTargetGoal>({
  goal_id: { type: String, default: () => uuid(), unique: true },
  user_id: { type: String, required: true, index: true },
  loai_muc_tieu: {
    type: String,
    enum: ['Giảm cân', 'Tăng cân', 'Giữ dáng', 'Tăng cơ'],
    required: true,
  },
  can_nang_hien_tai: { type: Number, required: true },
  can_nang_muc_tieu: { type: Number, required: true },
  tong_calo_moi_ngay: { type: Number, required: true },
  so_gio_tap_moi_ngay: { type: Number, enum: [0.5, 1, 1.5, 2], required: true },
  thoi_gian_dat_muc_tieu: { type: Number, required: true },
  trang_thai: {
    type: String,
    enum: ['Đang thực hiện', 'Đã hoàn thành', 'Hủy bỏ'],
    default: 'Đang thực hiện',
  },
  tien_trinh: { type: Number, min: 0, max: 100, default: 0 },
  calo_muc_tieu: { type: Number, required: true },
  calo_da_dot: { type: Number, default: 0 },
  last_progress_update: { type: Date, default: () => new Date() },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
});

userTargetGoalSchema.pre('save', function (this: IUserTargetGoal, next) {
  this.updated_at = new Date();
  if (!this.last_progress_update) {
    this.last_progress_update = new Date();
  }
  next();
});

export const UserTargetGoalModel = model<IUserTargetGoal>(
  'UserTargetGoal',
  userTargetGoalSchema
);

export type UserTargetGoalDTO = {
  goal_id: string;
  user_id: string;
  loai_muc_tieu: LoaiMucTieu;
  can_nang_hien_tai: number;
  can_nang_muc_tieu: number;
  tong_calo_moi_ngay: number;
  so_gio_tap_moi_ngay: GioTap;
  thoi_gian_dat_muc_tieu: number;
  trang_thai: TrangThaiGoal;
  tien_trinh: number;
  created_at: string;
  updated_at: string;
};
