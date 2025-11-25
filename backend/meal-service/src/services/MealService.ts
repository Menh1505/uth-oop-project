import logger from '../config/logger';
import {
  CreateMealEntryPayload,
  DailyCaloriesDTO,
  LoaiBuaAn,
  MealDTO,
  MealTemplateDTO,
  TrangThaiCalo,
  UpdateMealEntryPayload,
} from '../models/Meal';
import { MealRepository } from '../repositories/MealRepository';
import { GoalServiceClient } from './GoalServiceClient';
import { analyticsEventPublisher } from './AnalyticsEventPublisher';

type MealResponse = {
  meal: MealDTO;
  summary: DailyCaloriesDTO;
};

export class MealService {
  static async createMeal(
    userId: string,
    payload: CreateMealEntryPayload,
    authHeader?: string
  ): Promise<MealResponse> {
    const normalized = this.normalizeCreatePayload(payload);
    const meal = await MealRepository.createMeal(userId, normalized);
    logger.info({ userId, mealId: meal.id }, '[meal-service] Inserted meal');
    await this.publishMealLoggedEvent(userId, meal);
    const summary = await this.syncDailySummary(userId, normalized.ngay_an, authHeader);
    return { meal, summary };
  }

  static async listMeals(
    userId: string,
    date: string,
    authHeader?: string
  ): Promise<{ date: string; meals: MealDTO[]; summary: DailyCaloriesDTO }> {
    const ngay = this.normalizeDate(date);
    const meals = await MealRepository.findMealsByDate(userId, ngay);
    const summary = await this.ensureSummary(userId, ngay, authHeader);
    return { date: ngay, meals, summary };
  }

  static async updateMeal(
    userId: string,
    mealId: string,
    payload: UpdateMealEntryPayload,
    authHeader?: string
  ): Promise<MealResponse> {
    const normalized = this.normalizeUpdatePayload(payload);
    const meal = await MealRepository.updateMeal(mealId, userId, normalized);
    if (!meal) {
      throw new Error('Không tìm thấy món ăn');
    }
    logger.info({ userId, mealId }, '[meal-service] Updated meal');
    const summary = await this.syncDailySummary(userId, meal.ngay_an, authHeader);
    return { meal, summary };
  }

  static async deleteMeal(
    userId: string,
    mealId: string,
    authHeader?: string
  ): Promise<{ summary: DailyCaloriesDTO }> {
    const meal = await MealRepository.findMealById(mealId, userId);
    if (!meal) {
      throw new Error('Không tìm thấy món ăn');
    }

    await MealRepository.deleteMeal(mealId, userId);
    logger.info({ userId, mealId }, '[meal-service] Deleted meal');
    const summary = await this.syncDailySummary(userId, meal.ngay_an, authHeader);
    return { summary };
  }

  static async getSummary(
    userId: string,
    date: string,
    authHeader?: string
  ): Promise<DailyCaloriesDTO> {
    const ngay = this.normalizeDate(date);
    return this.ensureSummary(userId, ngay, authHeader);
  }

  static async listTemplates(): Promise<MealTemplateDTO[]> {
    return MealRepository.listTemplates();
  }

  static async listMenuItems() {
    const templates = await MealRepository.listTemplates();
    return templates.map((tpl) => ({
      id: tpl.id,
      name: tpl.ten_mon,
      description: tpl.description ?? null,
      calories: tpl.luong_calories,
      protein: tpl.protein ?? 0,
      carbs: tpl.carbs ?? 0,
      fat: tpl.fat ?? 0,
      price: tpl.price ?? 0,
      image_url: tpl.image_url ?? null,
      meal_type: tpl.loai_bua_an,
    }));
  }

  static async addMenuItemToCart(mealId: string, quantity = 1) {
    const template = await MealRepository.findTemplateById(mealId);
    if (!template) {
      throw new Error('Không tìm thấy món ăn');
    }
    const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    const price = template.price ?? 0;
    logger.info({ mealId, qty }, '[meal-service] Menu item added to cart');
    return {
      meal_id: template.id,
      quantity: qty,
      price,
      total: price * qty,
    };
  }

  private static normalizeCreatePayload(payload: CreateMealEntryPayload): CreateMealEntryPayload {
    if (!payload.ten_mon?.trim()) {
      throw new Error('Tên món ăn không được để trống');
    }

    if (!this.allowedMealTypes.includes(payload.loai_bua_an)) {
      throw new Error('Loại bữa ăn không hợp lệ');
    }

    if (payload.luong_calories < 0) {
      throw new Error('Lượng calories phải lớn hơn hoặc bằng 0');
    }

    if (payload.khoi_luong <= 0) {
      throw new Error('Khối lượng phải lớn hơn 0');
    }

    const ngay = this.normalizeDate(payload.ngay_an);
    const thoi_gian = this.normalizeTime(payload.thoi_gian_an);

    return {
      ten_mon: payload.ten_mon.trim(),
      loai_bua_an: payload.loai_bua_an,
      luong_calories: payload.luong_calories,
      khoi_luong: payload.khoi_luong,
      ngay_an: ngay,
      thoi_gian_an: thoi_gian,
      ghi_chu: payload.ghi_chu?.trim(),
    };
  }

  private static normalizeUpdatePayload(payload: UpdateMealEntryPayload): UpdateMealEntryPayload {
    const updates: UpdateMealEntryPayload = {};

    if (payload.ten_mon !== undefined) {
      if (!payload.ten_mon.trim()) {
        throw new Error('Tên món ăn không được để trống');
      }
      updates.ten_mon = payload.ten_mon.trim();
    }

    if (payload.loai_bua_an !== undefined) {
      if (!this.allowedMealTypes.includes(payload.loai_bua_an)) {
        throw new Error('Loại bữa ăn không hợp lệ');
      }
      updates.loai_bua_an = payload.loai_bua_an;
    }

    if (payload.luong_calories !== undefined) {
      if (payload.luong_calories < 0) {
        throw new Error('Lượng calories phải lớn hơn hoặc bằng 0');
      }
      updates.luong_calories = payload.luong_calories;
    }

    if (payload.khoi_luong !== undefined) {
      if (payload.khoi_luong <= 0) {
        throw new Error('Khối lượng phải lớn hơn 0');
      }
      updates.khoi_luong = payload.khoi_luong;
    }

    if (payload.ngay_an !== undefined) {
      updates.ngay_an = this.normalizeDate(payload.ngay_an);
    }

    if (payload.thoi_gian_an !== undefined) {
      updates.thoi_gian_an = this.normalizeTime(payload.thoi_gian_an);
    }

    if (payload.ghi_chu !== undefined) {
      updates.ghi_chu = payload.ghi_chu?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('Không có dữ liệu để cập nhật');
    }

    return updates;
  }

  private static async ensureSummary(
    userId: string,
    ngay: string,
    authHeader?: string
  ): Promise<DailyCaloriesDTO> {
    const existing = await MealRepository.getDailySummary(userId, ngay);
    if (existing) return existing;
    return this.syncDailySummary(userId, ngay, authHeader);
  }

  private static async syncDailySummary(
    userId: string,
    ngay: string,
    authHeader?: string
  ): Promise<DailyCaloriesDTO> {
    const totalCalories = await MealRepository.totalCaloriesForDate(userId, ngay);
    const goal = await GoalServiceClient.fetchDailyTarget(authHeader);
    const target = goal?.tong_calo_moi_ngay ?? goal?.calo_muc_tieu ?? null;
    const status = this.determineStatus(totalCalories, target);
    const summary = await MealRepository.upsertDailySummary(userId, ngay, totalCalories, status, target);
    logger.info(
      { userId, ngay, tong_calo: totalCalories, trang_thai_calo: summary.trang_thai_calo, target },
      '[meal-service] Synced daily summary'
    );
    return summary;
  }

  private static determineStatus(total: number, target?: number | null): TrangThaiCalo {
    if (!target || target <= 0) {
      return total > 0 ? 'Chưa đạt' : 'Chưa đạt';
    }

    return total <= target ? 'Đạt mục tiêu' : 'Vượt mức';
  }

  private static normalizeDate(date?: string): string {
    if (!date) {
      const now = new Date();
      return now.toISOString().slice(0, 10);
    }

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) {
      throw new Error('Ngày ăn phải có dạng YYYY-MM-DD');
    }
    return date;
  }

  private static normalizeTime(time?: string): string {
    if (!time) {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    const regex = /^([0-1]\d|2[0-3]):[0-5]\d$/;
    if (!regex.test(time)) {
      throw new Error('Thời gian ăn phải có dạng HH:mm');
    }
    return time;
  }

  private static allowedMealTypes: LoaiBuaAn[] = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Ăn vặt'];

  private static buildLoggedAt(date: string, time?: string | null) {
    const safeTime = time?.trim() || '00:00';
    const normalized = safeTime.length === 5 ? `${safeTime}:00` : safeTime;
    const isoCandidate = `${date}T${normalized.endsWith('Z') ? normalized : `${normalized}Z`}`;
    const parsed = new Date(isoCandidate);
    if (Number.isNaN(parsed.getTime())) {
      return new Date(`${date}T00:00:00.000Z`).toISOString();
    }
    return parsed.toISOString();
  }

  private static async publishMealLoggedEvent(userId: string, meal: MealDTO) {
    const event = {
      userId,
      mealId: meal.id,
      loggedAt: this.buildLoggedAt(meal.ngay_an, meal.thoi_gian_an),
      totalCalories: meal.luong_calories,
      proteinGrams: 0,
      carbsGrams: 0,
      fatsGrams: 0,
    };
    try {
      await analyticsEventPublisher.publishMealLogged(event);
    } catch (error) {
      logger.warn({ error, mealId: meal.id, userId }, '[meal-service] Failed to publish meal.logged event');
    }
  }
}
