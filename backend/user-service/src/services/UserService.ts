import { UserRepository } from '../repositories/UserRepository';
import { GoalRepository } from '../repositories/GoalRepository';
import { 
  RegisterUserPayload, 
  LoginUserPayload, 
  UserResponse, 
  UpdateUserProfilePayload,
  OnboardingPayload,
  AssignGoalPayload,
  UpdateUserGoalPayload
} from '../models/User';

export class UserService {
  // Register new user
  static async registerUser(userData: RegisterUserPayload): Promise<UserResponse> {
    // Check if email already exists
    const emailExists = await UserRepository.emailExists(userData.email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    // Validate required fields
    if (!userData.name || userData.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error('Valid email is required');
    }

    if (!userData.password || userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Validate optional numeric fields
    if (userData.age !== undefined && (userData.age <= 0 || userData.age >= 150)) {
      throw new Error('Age must be between 1 and 149');
    }

    if (userData.weight !== undefined && userData.weight <= 0) {
      throw new Error('Weight must be greater than 0');
    }

    if (userData.height !== undefined && userData.height <= 0) {
      throw new Error('Height must be greater than 0');
    }

    return await UserRepository.create(userData);
  }

  // User login
  static async loginUser(loginData: LoginUserPayload): Promise<UserResponse> {
    const user = await UserRepository.validatePassword(loginData.email, loginData.password);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await UserRepository.updateLastLogin(user.user_id);

    // Return user without password
    const { password, ...userResponse } = user;
    return userResponse as UserResponse;
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<UserResponse> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  static async createUserWithEmail(userId: string, email: string): Promise<UserResponse> {
    const name = email.split('@')[0] || 'User';
    return await UserRepository.createOrUpdate(userId, email, name);
  }

  // Update user profile
  static async updateUserProfile(userId: string, updateData: UpdateUserProfilePayload): Promise<UserResponse> {
    // Validate input data
    if (updateData.age !== undefined && (updateData.age <= 0 || updateData.age >= 150)) {
      throw new Error('Age must be between 1 and 149');
    }

    if (updateData.weight !== undefined && updateData.weight <= 0) {
      throw new Error('Weight must be greater than 0');
    }

    if (updateData.height !== undefined && updateData.height <= 0) {
      throw new Error('Height must be greater than 0');
    }

    if (updateData.name !== undefined && updateData.name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }

    return await UserRepository.updateProfile(userId, updateData);
  }

  // Complete onboarding (update profile with health info)
  static async completeOnboarding(userId: string, onboardingData: OnboardingPayload): Promise<UserResponse> {
    return await this.updateUserProfile(userId, onboardingData);
  }

  // Check if user needs onboarding
  static async needsOnboarding(userId: string): Promise<boolean> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      return true;
    }

    // User needs onboarding nếu CHƯA có thông tin sức khỏe cơ bản
    // Trước đây còn check cả fitness_goal nên dù đã có name/gender/age/weight/height
    // vẫn bị coi là chưa onboarding. Ở đây chỉ yêu cầu 4 field chính:
    // - gender
    // - age
    // - weight
    // - height
    // fitness_goal trở thành optional, có thể set sau.
    return (
      !user.gender ||
      user.age == null ||
      user.weight == null ||
      user.height == null
    );
  }

  // Get available goals
  static async getAvailableGoals() {
    return await GoalRepository.getAllGoals();
  }

  // Get user's goals
  static async getUserGoals(userId: string) {
    return await GoalRepository.getUserGoals(userId);
  }

  // Get user's active goals
  static async getUserActiveGoals(userId: string) {
    return await GoalRepository.getActiveUserGoals(userId);
  }

  // Assign goal to user
  static async assignGoalToUser(userId: string, assignData: AssignGoalPayload) {
    // Check if goal exists
    const goal = await GoalRepository.getGoalById(assignData.goal_id);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Check if user already has an active goal of the same type
    const hasActiveGoal = await GoalRepository.hasActiveGoalOfType(userId, goal.goal_type);
    if (hasActiveGoal) {
      throw new Error(`You already have an active ${goal.goal_type} goal`);
    }

    // Validate target completion date if provided
    if (assignData.target_completion_date) {
      const targetDate = new Date(assignData.target_completion_date);
      const now = new Date();
      if (targetDate <= now) {
        throw new Error('Target completion date must be in the future');
      }
    }

    return await GoalRepository.assignGoalToUser(userId, assignData);
  }

  // Update user goal progress
  static async updateUserGoalProgress(userId: string, userGoalId: string, updateData: UpdateUserGoalPayload) {
    // Check if the goal belongs to the user
    const userGoal = await GoalRepository.getUserGoalById(userGoalId);
    if (!userGoal || userGoal.user_id !== userId) {
      throw new Error('Goal not found or does not belong to user');
    }

    // Validate progress percentage
    if (updateData.progress_percentage !== undefined) {
      if (updateData.progress_percentage < 0 || updateData.progress_percentage > 100) {
        throw new Error('Progress percentage must be between 0 and 100');
      }
    }

    // Validate target completion date if provided
    if (updateData.target_completion_date) {
      const targetDate = new Date(updateData.target_completion_date);
      const now = new Date();
      if (targetDate <= now) {
        throw new Error('Target completion date must be in the future');
      }
    }

    return await GoalRepository.updateUserGoal(userGoalId, updateData);
  }

  // Remove user goal
  static async removeUserGoal(userId: string, userGoalId: string) {
    // Check if the goal belongs to the user
    const userGoal = await GoalRepository.getUserGoalById(userGoalId);
    if (!userGoal || userGoal.user_id !== userId) {
      throw new Error('Goal not found or does not belong to user');
    }

    return await GoalRepository.removeUserGoal(userGoalId);
  }

  // Get user dashboard data
  static async getUserDashboard(userId: string) {
    const user = await this.getUserProfile(userId);
    const activeGoals = await this.getUserActiveGoals(userId);
    const needsOnboarding = await this.needsOnboarding(userId);

    return {
      user,
      activeGoals,
      needsOnboarding,
      totalActiveGoals: activeGoals.length
    };
  }

  // Admin: List all users
  static async listAllUsers(limit = 50, offset = 0) {
    return await UserRepository.listUsers(limit, offset);
  }

  // Update subscription status
  static async updateSubscription(userId: string, status: 'Basic' | 'Premium') {
    return await UserRepository.updateSubscription(userId, status);
  }

  // Deactivate user account
  static async deactivateUser(userId: string) {
    return await UserRepository.deactivate(userId);
  }

  // Verify email
  static async verifyEmail(userId: string) {
    return await UserRepository.verifyEmail(userId);
  }

  // Helper method to validate email format
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}