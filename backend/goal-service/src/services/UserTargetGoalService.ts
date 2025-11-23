import {
  IUserTargetGoal,
  UserTargetGoalDTO,
  UserTargetGoalModel,
  GioTap,
  LoaiMucTieu,
  TrangThaiGoal,
} from '../models/UserTargetGoal';

const CALO_PER_KG = 7700;
const CALO_PER_HOUR = 400;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type CreateUserGoalPayload = {
  loai_muc_tieu: LoaiMucTieu;
  can_nang_hien_tai: number;
  can_nang_muc_tieu: number;
  so_gio_tap_moi_ngay: GioTap;
  thoi_gian_dat_muc_tieu: number;
};

export type UpdateUserGoalPayload = Partial<{
  loai_muc_tieu: LoaiMucTieu;
  can_nang_hien_tai: number;
  can_nang_muc_tieu: number;
  so_gio_tap_moi_ngay: GioTap;
  thoi_gian_dat_muc_tieu: number;
  trang_thai: TrangThaiGoal;
}>;

export class UserTargetGoalService {
  private ensureDailyProgress(doc: IUserTargetGoal) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const last = doc.last_progress_update
      ? new Date(doc.last_progress_update)
      : doc.created_at;
    const daysGap = Math.floor((startOfToday.getTime() - last.getTime()) / MS_PER_DAY);
    if (daysGap > 0) {
      doc.calo_da_dot += doc.tong_calo_moi_ngay * daysGap;
      doc.last_progress_update = startOfToday;
      this.recalculateProgress(doc);
    }
  }

  private recalculateProgress(doc: IUserTargetGoal) {
    if (doc.calo_muc_tieu <= 0) {
      doc.tien_trinh = 0;
      return;
    }
    doc.tien_trinh = Math.min(100, (doc.calo_da_dot / doc.calo_muc_tieu) * 100);
    if (doc.tien_trinh >= 100) {
      doc.trang_thai = 'Đã hoàn thành';
    }
  }

  private toDTO(doc: IUserTargetGoal): UserTargetGoalDTO {
    return {
      goal_id: doc.goal_id,
      user_id: doc.user_id,
      loai_muc_tieu: doc.loai_muc_tieu,
      can_nang_hien_tai: doc.can_nang_hien_tai,
      can_nang_muc_tieu: doc.can_nang_muc_tieu,
      tong_calo_moi_ngay: doc.tong_calo_moi_ngay,
      so_gio_tap_moi_ngay: doc.so_gio_tap_moi_ngay,
      thoi_gian_dat_muc_tieu: doc.thoi_gian_dat_muc_tieu,
      trang_thai: doc.trang_thai,
      tien_trinh: doc.tien_trinh,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
    };
  }

  private computeTargets(current: number, target: number, hours: number) {
    const deltaKg = current - target;
    const totalCaloTarget = Math.abs(deltaKg) * CALO_PER_KG;
    const dailyCalo = hours * CALO_PER_HOUR;
    return { totalCaloTarget, dailyCalo };
  }

  async createGoal(userId: string, payload: CreateUserGoalPayload) {
    const { totalCaloTarget, dailyCalo } = this.computeTargets(
      payload.can_nang_hien_tai,
      payload.can_nang_muc_tieu,
      payload.so_gio_tap_moi_ngay
    );

    const doc = await UserTargetGoalModel.create({
      user_id: userId,
      ...payload,
      tong_calo_moi_ngay: dailyCalo,
      trang_thai: 'Đang thực hiện',
      tien_trinh: 0,
      calo_muc_tieu: totalCaloTarget || dailyCalo * payload.thoi_gian_dat_muc_tieu * 7,
      calo_da_dot: 0,
      last_progress_update: new Date(),
    });

    console.info('[UserTargetGoal] Inserted goal', doc.goal_id);
    return this.toDTO(doc);
  }

  async listGoals(userId: string) {
    const docs = await UserTargetGoalModel.find({ user_id: userId }).sort({ created_at: -1 });
    const results: UserTargetGoalDTO[] = [];
    for (const doc of docs) {
      this.ensureDailyProgress(doc);
      await doc.save();
      results.push(this.toDTO(doc));
    }
    return results;
  }

  async getGoal(userId: string, goalId: string) {
    const doc = await UserTargetGoalModel.findOne({ user_id: userId, goal_id: goalId });
    if (!doc) return null;
    this.ensureDailyProgress(doc);
    await doc.save();
    return this.toDTO(doc);
  }

  async updateGoal(userId: string, goalId: string, payload: UpdateUserGoalPayload) {
    const doc = await UserTargetGoalModel.findOne({ user_id: userId, goal_id: goalId });
    if (!doc) return null;

    const fields: (keyof UpdateUserGoalPayload)[] = [
      'loai_muc_tieu',
      'can_nang_hien_tai',
      'can_nang_muc_tieu',
      'so_gio_tap_moi_ngay',
      'thoi_gian_dat_muc_tieu',
      'trang_thai',
    ];
    for (const key of fields) {
      if (payload[key] !== undefined) {
        (doc as any)[key] = payload[key];
      }
    }

    if (
      payload.can_nang_hien_tai !== undefined ||
      payload.can_nang_muc_tieu !== undefined ||
      payload.so_gio_tap_moi_ngay !== undefined
    ) {
      const { totalCaloTarget, dailyCalo } = this.computeTargets(
        doc.can_nang_hien_tai,
        doc.can_nang_muc_tieu,
        doc.so_gio_tap_moi_ngay
      );
      doc.calo_muc_tieu = totalCaloTarget || doc.calo_muc_tieu;
      doc.tong_calo_moi_ngay = dailyCalo;
    }

    this.ensureDailyProgress(doc);
    await doc.save();
    return this.toDTO(doc);
  }

  async deleteGoal(userId: string, goalId: string) {
    const deleted = await UserTargetGoalModel.deleteOne({ user_id: userId, goal_id: goalId });
    return deleted.deletedCount > 0;
  }
}
