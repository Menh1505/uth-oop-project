import logger from './logger';
import { DailyCaloriesModel, MealModel, MealTemplateModel } from '../models/Meal';

const SAMPLE_MEALS = [
  { ten_mon: 'Cơm gà', loai_bua_an: 'Bữa trưa', luong_calories: 600, khoi_luong: 350 },
  { ten_mon: 'Phở bò', loai_bua_an: 'Bữa sáng', luong_calories: 450, khoi_luong: 320 },
  { ten_mon: 'Bánh mì thịt', loai_bua_an: 'Ăn vặt', luong_calories: 400, khoi_luong: 180 },
  { ten_mon: 'Trứng luộc', loai_bua_an: 'Ăn vặt', luong_calories: 70, khoi_luong: 55 },
  { ten_mon: 'Sữa chua', loai_bua_an: 'Ăn vặt', luong_calories: 120, khoi_luong: 100 },
  { ten_mon: 'Chuối', loai_bua_an: 'Ăn vặt', luong_calories: 90, khoi_luong: 118 },
  { ten_mon: 'Salad ức gà', loai_bua_an: 'Bữa tối', luong_calories: 250, khoi_luong: 280 },
  { ten_mon: 'Trà sữa', loai_bua_an: 'Ăn vặt', luong_calories: 350, khoi_luong: 500 },
  { ten_mon: 'Bún chả', loai_bua_an: 'Bữa trưa', luong_calories: 500, khoi_luong: 400 },
  { ten_mon: 'Cháo yến mạch', loai_bua_an: 'Bữa sáng', luong_calories: 200, khoi_luong: 250 },
] as const;

const TEMPLATE_MENU = [
  {
    ten_mon: 'Grilled Chicken Bowl',
    loai_bua_an: 'Bữa trưa',
    luong_calories: 520,
    khoi_luong: 450,
    description: 'Ức gà nướng với gạo lứt, bông cải và sốt chanh.',
    price: 55000,
    protein: 45,
    carbs: 50,
    fat: 15,
    image_url:
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
  },
  {
    ten_mon: 'Salmon Quinoa Salad',
    loai_bua_an: 'Bữa tối',
    luong_calories: 610,
    khoi_luong: 420,
    description: 'Cá hồi áp chảo với quinoa và salad rau củ.',
    price: 75000,
    protein: 40,
    carbs: 55,
    fat: 20,
    image_url:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  },
  {
    ten_mon: 'Tofu Veggie Stir-fry',
    loai_bua_an: 'Bữa trưa',
    luong_calories: 480,
    khoi_luong: 380,
    description: 'Đậu hũ xào rau củ sốt tương gừng.',
    price: 52000,
    protein: 25,
    carbs: 60,
    fat: 12,
    image_url:
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80&sat=-100',
  },
  {
    ten_mon: 'Beef Brown Rice Box',
    loai_bua_an: 'Bữa tối',
    luong_calories: 700,
    khoi_luong: 500,
    description: 'Thịt bò áp chảo ăn cùng cơm gạo lứt và rau hấp.',
    price: 82000,
    protein: 50,
    carbs: 65,
    fat: 25,
    image_url:
      'https://images.unsplash.com/photo-1484980972926-edee96e0960d?auto=format&fit=crop&w=800&q=80',
  },
  {
    ten_mon: 'Greek Yogurt Parfait',
    loai_bua_an: 'Ăn vặt',
    luong_calories: 260,
    khoi_luong: 250,
    description: 'Sữa chua Hy Lạp với granola và trái cây theo mùa.',
    price: 39000,
    protein: 20,
    carbs: 35,
    fat: 8,
    image_url:
      'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=800&q=80',
  },
] as const;

export async function seedSampleMeals(): Promise<void> {
  const count = await MealModel.countDocuments();
  if (count === 0) {
    const defaultUser = process.env.SEED_USER_ID || '00000000-0000-0000-0000-000000000001';
    const today = new Date();

    const documents = SAMPLE_MEALS.map((meal, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - Math.floor(index / 3));
      const ngay = day.toISOString().slice(0, 10);
      const thoiGian = `${String(8 + (index % 4) * 2).padStart(2, '0')}:00`;

      return {
        user_id: defaultUser,
        ten_mon: meal.ten_mon,
        loai_bua_an: meal.loai_bua_an,
        luong_calories: meal.luong_calories,
        khoi_luong: meal.khoi_luong,
        ngay_an: ngay,
        thoi_gian_an: thoiGian,
        ghi_chu: 'Dữ liệu mẫu',
      };
    });

    await MealModel.insertMany(documents);

    const grouped = documents.reduce<Record<string, number>>((acc, meal) => {
      acc[meal.ngay_an] = (acc[meal.ngay_an] || 0) + meal.luong_calories;
      return acc;
    }, {});

    await Promise.all(
      Object.entries(grouped).map(([ngay, tong]) =>
        DailyCaloriesModel.findOneAndUpdate(
          { user_id: defaultUser, ngay },
          {
            user_id: defaultUser,
            ngay,
            tong_calo: tong,
            trang_thai_calo: 'Chưa đạt',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    logger.info('[meal-service] Seeded sample meals and daily summaries');
  }

  const templateCount = await MealTemplateModel.countDocuments();
  if (templateCount === 0) {
    await MealTemplateModel.insertMany(
      TEMPLATE_MENU.map((item, index) => ({
        ...item,
        priority: index + 1,
      }))
    );
    logger.info('[meal-service] Seeded meal templates');
  }
}
