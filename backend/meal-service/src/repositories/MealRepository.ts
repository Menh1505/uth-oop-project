import {
  CreateMealEntryPayload,
  DailyCaloriesDTO,
  DailyCaloriesModel,
  MealDTO,
  MealModel,
  MealTemplateDTO,
  MealTemplateModel,
  TrangThaiCalo,
  UpdateMealEntryPayload,
} from '../models/Meal';

export class MealRepository {
  private static mapMeal(doc: any): MealDTO {
    return doc.toJSON() as MealDTO;
  }

  private static mapTemplate(doc: any): MealTemplateDTO {
    return doc.toJSON() as MealTemplateDTO;
  }

  private static mapSummary(doc: any): DailyCaloriesDTO {
    const json = doc.toJSON ? doc.toJSON() : doc;
    return {
      ...json,
      id: json.id || json._id,
    };
  }

  static async createMeal(userId: string, payload: CreateMealEntryPayload): Promise<MealDTO> {
    const doc = await MealModel.create({ user_id: userId, ...payload });
    return this.mapMeal(doc);
  }

  static async findMealsByDate(userId: string, ngay: string): Promise<MealDTO[]> {
    const docs = await MealModel.find({ user_id: userId, ngay_an: ngay })
      .sort({ thoi_gian_an: 1, created_at: 1 })
      .exec();
    return docs.map((doc) => this.mapMeal(doc));
  }

  static async findMealById(mealId: string, userId: string): Promise<MealDTO | null> {
    const doc = await MealModel.findOne({ _id: mealId, user_id: userId }).exec();
    return doc ? this.mapMeal(doc) : null;
  }

  static async updateMeal(
    mealId: string,
    userId: string,
    payload: UpdateMealEntryPayload
  ): Promise<MealDTO | null> {
    const doc = await MealModel.findOneAndUpdate({ _id: mealId, user_id: userId }, payload, {
      new: true,
    }).exec();
    return doc ? this.mapMeal(doc) : null;
  }

  static async deleteMeal(mealId: string, userId: string): Promise<void> {
    await MealModel.deleteOne({ _id: mealId, user_id: userId }).exec();
  }

  static async totalCaloriesForDate(userId: string, ngay: string): Promise<number> {
    const stats = await MealModel.aggregate<{ _id: null; total: number }>([
      { $match: { user_id: userId, ngay_an: ngay } },
      { $group: { _id: null, total: { $sum: '$luong_calories' } } },
    ]);
    return stats[0]?.total || 0;
  }

  static async upsertDailySummary(
    userId: string,
    ngay: string,
    tongCalo: number,
    trangThai: TrangThaiCalo,
    caloMucTieu?: number | null
  ): Promise<DailyCaloriesDTO> {
    const doc = await DailyCaloriesModel.findOneAndUpdate(
      { user_id: userId, ngay },
      {
        user_id: userId,
        ngay,
        tong_calo: tongCalo,
        calo_muc_tieu: caloMucTieu ?? null,
        trang_thai_calo: trangThai,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
    return this.mapSummary(doc);
  }

  static async getDailySummary(userId: string, ngay: string): Promise<DailyCaloriesDTO | null> {
    const doc = await DailyCaloriesModel.findOne({ user_id: userId, ngay }).exec();
    return doc ? this.mapSummary(doc) : null;
  }

  static async listTemplates(): Promise<MealTemplateDTO[]> {
    const docs = await MealTemplateModel.find()
      .sort({ priority: 1, ten_mon: 1 })
      .exec();
    return docs.map((doc) => this.mapTemplate(doc));
  }

  static async findTemplateById(id: string): Promise<MealTemplateDTO | null> {
    const doc = await MealTemplateModel.findById(id).exec();
    return doc ? this.mapTemplate(doc) : null;
  }
}
