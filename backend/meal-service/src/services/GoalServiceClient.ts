import logger from '../config/logger';

export interface GoalDailyTarget {
  goal_id?: string;
  loai_muc_tieu?: string;
  tong_calo_moi_ngay?: number;
  calo_muc_tieu?: number;
}

const baseUrl = (process.env.GOAL_SERVICE_URL || 'http://localhost:3006/goals').replace(/\/$/, '');

export class GoalServiceClient {
  static async fetchDailyTarget(authHeader?: string): Promise<GoalDailyTarget | null> {
    if (!authHeader) {
      return null;
    }

    try {
      const response = await fetch(`${baseUrl}/me`, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        logger.warn(
          { status: response.status },
          '[meal-service] Goal service responded with non-OK status'
        );
        return null;
      }

      const payload: any = await response.json();
      const rawGoals =
        (Array.isArray(payload?.data?.goals) && payload.data.goals) ||
        (Array.isArray(payload?.goals) && payload.goals) ||
        (Array.isArray(payload?.data) && payload.data) ||
        [];

      const goal = rawGoals[0];
      if (!goal) return null;

      return {
        goal_id: goal.goal_id,
        loai_muc_tieu: goal.loai_muc_tieu,
        tong_calo_moi_ngay: goal.tong_calo_moi_ngay,
        calo_muc_tieu: goal.calo_muc_tieu,
      };
    } catch (error) {
      logger.error(error, '[meal-service] Failed to call goal-service');
      return null;
    }
  }
}
