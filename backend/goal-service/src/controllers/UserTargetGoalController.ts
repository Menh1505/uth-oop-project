import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { UserTargetGoalService } from '../services/UserTargetGoalService';
import { GoalApiResponse } from '../models/Goal';

const service = new UserTargetGoalService();

export class UserTargetGoalController {
  createGoal = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Bạn chưa đăng nhập' });

      const goal = await service.createGoal(userId, req.body);
      const response: GoalApiResponse<typeof goal> = {
        success: true,
        data: goal,
        message: 'Tạo mục tiêu thành công',
        timestamp: new Date(),
      };
      res.status(201).json(response);
    } catch (error: any) {
      const response: GoalApiResponse<null> = {
        success: false,
        error: error?.message || 'Không thể tạo mục tiêu',
        timestamp: new Date(),
      };
      res.status(400).json(response);
    }
  };

  listMyGoals = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
      const goals = await service.listGoals(userId);
      const response: GoalApiResponse<{ goals: typeof goals }> = {
        success: true,
        data: { goals },
        timestamp: new Date(),
      };
      res.json(response);
    } catch (error: any) {
      const response: GoalApiResponse<null> = {
        success: false,
        error: error?.message || 'Không thể tải mục tiêu',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  };

  updateGoal = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
      const goalId = req.params.goalId;
      const goal = await service.updateGoal(userId, goalId, req.body);
      if (!goal) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy mục tiêu',
          timestamp: new Date(),
        });
      }
      res.json({
        success: true,
        data: goal,
        message: 'Cập nhật mục tiêu thành công',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error?.message || 'Không thể cập nhật mục tiêu',
        timestamp: new Date(),
      });
    }
  };

  deleteGoal = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
      const goalId = req.params.goalId;
      const deleted = await service.deleteGoal(userId, goalId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy mục tiêu',
          timestamp: new Date(),
        });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error?.message || 'Không thể xóa mục tiêu',
        timestamp: new Date(),
      });
    }
  };
}
