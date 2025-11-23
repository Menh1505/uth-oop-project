import axios from 'axios';
import { aiConfig } from '../config/config.js';
import logger from '../config/logger.js';
import { IUser, IUserGoal } from '../types/index.js';

export class UserService {
  private static baseUrl = aiConfig.userServiceUrl;
  private static goalServiceUrl = process.env.GOAL_SERVICE_URL || 'http://goal-service:3006';

  static async getUserProfile(userId: string, token: string): Promise<IUser> {
    try {
      logger.info(`Fetching user profile for: ${userId}`);
      
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user profile');
      }

      return response.data.user;
    } catch (error: any) {
      logger.error('Failed to fetch user profile', {
        error: error.message,
        userId,
        statusCode: error.response?.status,
        responseData: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid token');
      }
      
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  static async getUserGoals(userId: string, token: string): Promise<IUserGoal[]> {
    try {
      logger.info(`Fetching user goals for: ${userId}`);
      
      // Request to goal-service instead of user-service
      const response = await axios.get(`${this.goalServiceUrl}/goals/user-goals`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user goals');
      }

      return response.data.userGoals || [];
    } catch (error: any) {
      logger.error('Failed to fetch user goals', {
        error: error.message,
        userId,
        statusCode: error.response?.status,
        responseData: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid token');
      }
      
      if (error.response?.status === 404) {
        // User might not have any goals yet, return empty array
        logger.info('No goals found for user, returning empty array', { userId });
        return [];
      }
      
      throw new Error(`Failed to fetch user goals: ${error.message}`);
    }
  }

  static async getUserData(userId: string, token: string): Promise<{ user: IUser; goals: IUserGoal[] }> {
    try {
      logger.info(`Fetching complete user data for: ${userId}`);
      
      const [userProfile, userGoals] = await Promise.all([
        this.getUserProfile(userId, token),
        this.getUserGoals(userId, token)
      ]);

      return {
        user: userProfile,
        goals: userGoals
      };
    } catch (error) {
      logger.error('Failed to fetch complete user data', { error, userId });
      throw error;
    }
  }
}