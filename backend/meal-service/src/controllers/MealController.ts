import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { MealService } from '../services/MealService';
import logger from '../config/logger';

export class MealController {
  static async getMenu(_req: Request, res: Response) {
    try {
      const menu = await MealService.listMenuItems();
      res.json({ success: true, data: menu });
    } catch (error: any) {
      logger.error({ err: error }, '[meal-service] Fetch public menu failed');
      res.status(500).json({
        success: false,
        message: error?.message || 'Không thể tải menu',
      });
    }
  }

  static async status(_req: AuthRequest, res: Response) {
    res.json({
      service: 'meal-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'MongoDB',
      endpoints: [
        'POST   /meals',
        'GET    /meals/me?date=YYYY-MM-DD',
        'GET    /meals/templates',
        'PUT    /meals/:mealId',
        'DELETE /meals/:mealId',
        'GET    /meals/summary?date=YYYY-MM-DD',
      ],
    });
  }

  static async createMeal(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });

      const authHeader = req.headers.authorization;
      logger.info(
        { userId, path: req.originalUrl, body: req.body },
        '[meal-service] Incoming create meal request'
      );
      const result = await MealService.createMeal(userId, req.body, authHeader);
      res.status(201).json({
        success: true,
        message: 'Đã thêm món ăn',
        data: result,
      });
    } catch (error: any) {
      logger.error(
        { err: error, path: req.originalUrl, body: req.body },
        '[meal-service] Create meal failed'
      );
      res.status(400).json({
        success: false,
        message: error?.message || 'Không thể thêm món ăn',
      });
    }
  }

  static async getMyMeals(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });

      const authHeader = req.headers.authorization;
      const date = (req.query.date as string) || '';
      logger.info({ userId, path: req.originalUrl, date }, '[meal-service] Fetch meals request');
      const result = await MealService.listMeals(userId, date, authHeader);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error({ err: error, path: req.originalUrl }, '[meal-service] Fetch meals failed');
      res.status(400).json({
        success: false,
        message: error?.message || 'Không thể lấy danh sách món ăn',
      });
    }
  }

  static async updateMeal(req: AuthRequest, res: Response) {
    const mealId = req.params.mealId;
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });

      const authHeader = req.headers.authorization;
      logger.info({ userId, mealId, path: req.originalUrl }, '[meal-service] Update meal request');
      const result = await MealService.updateMeal(userId, mealId, req.body, authHeader);
      res.json({
        success: true,
        message: 'Đã cập nhật món ăn',
        data: result,
      });
    } catch (error: any) {
      logger.error(
        { err: error, path: req.originalUrl, mealId, body: req.body },
        '[meal-service] Update meal failed'
      );
      res.status(400).json({
        success: false,
        message: error?.message || 'Không thể cập nhật món ăn',
      });
    }
  }

  static async deleteMeal(req: AuthRequest, res: Response) {
    const mealId = req.params.mealId;
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });

      const authHeader = req.headers.authorization;
      logger.info({ userId, mealId }, '[meal-service] Delete meal request');
      const result = await MealService.deleteMeal(userId, mealId, authHeader);
      res.json({
        success: true,
        message: 'Đã xoá món ăn',
        data: result,
      });
    } catch (error: any) {
      logger.error({ err: error, path: req.originalUrl, mealId }, '[meal-service] Delete meal failed');
      res.status(400).json({
        success: false,
        message: error?.message || 'Không thể xoá món ăn',
      });
    }
  }

  static async getDailySummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });

      const authHeader = req.headers.authorization;
      const date = (req.query.date as string) || '';
      logger.info({ userId, date }, '[meal-service] Summary request');
      const summary = await MealService.getSummary(userId, date, authHeader);
      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error({ err: error, date: req.query.date }, '[meal-service] Summary failed');
      res.status(400).json({
        success: false,
        message: error?.message || 'Không thể lấy tổng calories',
      });
    }
  }

  static async getTemplates(_req: Request, res: Response) {
    try {
      const templates = await MealService.listTemplates();
      res.json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      logger.error({ err: error }, '[meal-service] Fetch templates failed');
      res.status(500).json({
        success: false,
        message: error?.message || 'Không thể tải danh sách món ăn mẫu',
      });
    }
  }

  static async addToCart(req: Request, res: Response) {
    try {
      const mealId = req.params.mealId;
      const quantity = Number((req.body as any)?.quantity ?? 1);
      const result = await MealService.addMenuItemToCart(mealId, quantity);
      res.json({
        success: true,
        message: 'Đã ghi nhận vào giỏ hàng',
        data: result,
      });
    } catch (error: any) {
      logger.error({ err: error, mealId: req.params.mealId }, '[meal-service] Add to cart failed');
      res.status(400).json({
        success: false,
        message: error?.message || 'Không thể thêm vào giỏ',
      });
    }
  }
}
