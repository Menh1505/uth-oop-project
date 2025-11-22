import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  UserModel,
  AddressModel,
  PreferencesModel,
  GoalModel,
  UserGoalModel,
  IUser,
  RegisterUserPayload,
  LoginUserPayload,
  UpdateUserProfilePayload,
  OnboardingPayload,
  UserResponse,
  User,
  AssignGoalPayload,
  UpdateUserGoalPayload
} from '../models/User.js';

// Helper function để convert MongoDB document thành UserResponse
const toUserResponse = (user: IUser): UserResponse => ({
  user_id: user.user_id,
  name: user.name,
  email: user.email,
  gender: user.gender,
  age: user.age,
  weight: user.weight,
  height: user.height,
  fitness_goal: user.fitness_goal,
  preferred_diet: user.preferred_diet,
  subscription_status: user.subscription_status,
  payment_method: user.payment_method,
  created_at: user.created_at.toISOString(),
  updated_at: user.updated_at.toISOString(),
  is_active: user.is_active,
  last_login: user.last_login?.toISOString() || null,
  email_verified: user.email_verified,
  profile_picture_url: user.profile_picture_url
});

export class UserService {
  // ===== User Registration & Login =====
  
  static async registerUser(payload: RegisterUserPayload): Promise<UserResponse> {
    const { email, password, name, ...otherData } = payload;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email }).lean();
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique user_id
    const user_id = uuidv4();

    // Create new user
    const newUser = new UserModel({
      user_id,
      name,
      email,
      password: hashedPassword,
      subscription_status: 'Basic',
      is_active: true,
      email_verified: false,
      ...otherData
    });

    const savedUser = await newUser.save();
    return toUserResponse(savedUser);
  }

  static async loginUser(payload: LoginUserPayload): Promise<UserResponse> {
    const { email, password } = payload;

    const user = await UserModel.findOne({ email, is_active: true });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    return toUserResponse(user);
  }

  // ===== User Profile Management =====

  static async getUserProfile(user_id: string): Promise<UserResponse> {
    const user = await UserModel.findOne({ user_id, is_active: true });
    if (!user) {
      throw new Error('User not found');
    }

    return toUserResponse(user);
  }

  static async updateUserProfile(user_id: string, payload: UpdateUserProfilePayload): Promise<UserResponse> {
    const user = await UserModel.findOneAndUpdate(
      { user_id, is_active: true },
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return toUserResponse(user);
  }

  static async createUserWithEmail(user_id: string, email: string): Promise<UserResponse> {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ $or: [{ user_id }, { email }] });
    if (existingUser) {
      if (existingUser.user_id === user_id) {
        return toUserResponse(existingUser);
      }
      throw new Error('User already exists with this email');
    }

    // Create minimal user (for auth-service created users)
    const newUser = new UserModel({
      user_id,
      name: email.split('@')[0], // Use email prefix as default name
      email,
      password: await bcrypt.hash(Math.random().toString(), 10), // Random password (will be managed by auth-service)
      subscription_status: 'Basic',
      is_active: true,
      email_verified: false
    });

    const savedUser = await newUser.save();
    return toUserResponse(savedUser);
  }

  // ===== Onboarding =====

  static async needsOnboarding(user_id: string): Promise<boolean> {
    const user = await UserModel.findOne({ user_id, is_active: true }).lean();
    if (!user) {
      return true; // If user doesn't exist, they need onboarding
    }

    // User needs onboarding if missing key profile data
    return !user.age || !user.gender || !user.height || !user.weight || !user.fitness_goal;
  }

  static async completeOnboarding(user_id: string, payload: OnboardingPayload): Promise<UserResponse> {
    const user = await UserModel.findOneAndUpdate(
      { user_id, is_active: true },
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return toUserResponse(user);
  }

  // ===== Goals Management =====

  static async getAvailableGoals() {
    const goals = await GoalModel.find({ is_active: true }).lean();
    return goals.map(goal => ({
      goal_id: goal.goal_id,
      goal_type: goal.goal_type,
      description: goal.description,
      target_calories: goal.target_calories,
      target_protein: goal.target_protein,
      target_carbs: goal.target_carbs,
      target_fat: goal.target_fat,
      target_weight: goal.target_weight,
      target_duration_weeks: goal.target_duration_weeks,
      is_active: goal.is_active,
      created_at: goal.created_at.toISOString(),
      updated_at: goal.updated_at.toISOString()
    }));
  }

  static async getUserGoals(user_id: string) {
    const userGoals = await UserGoalModel.find({ user_id })
      .populate('goal_id')
      .lean();

    return userGoals.map(userGoal => ({
      user_goal_id: userGoal.user_goal_id,
      user_id: userGoal.user_id,
      goal_id: userGoal.goal_id,
      assigned_date: userGoal.assigned_date.toISOString(),
      target_completion_date: userGoal.target_completion_date?.toISOString() || null,
      actual_completion_date: userGoal.actual_completion_date?.toISOString() || null,
      progress_percentage: userGoal.progress_percentage,
      status: userGoal.status,
      notes: userGoal.notes,
      created_at: userGoal.created_at.toISOString(),
      updated_at: userGoal.updated_at.toISOString()
    }));
  }

  static async assignGoalToUser(user_id: string, payload: AssignGoalPayload) {
    // Check if user exists
    const user = await UserModel.findOne({ user_id, is_active: true }).lean();
    if (!user) {
      throw new Error('User not found');
    }

    // Check if goal exists
    const goal = await GoalModel.findOne({ goal_id: payload.goal_id, is_active: true }).lean();
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Check if user already has this goal assigned
    const existingUserGoal = await UserGoalModel.findOne({ 
      user_id, 
      goal_id: payload.goal_id,
      status: { $in: ['Active', 'Paused'] }
    }).lean();
    
    if (existingUserGoal) {
      throw new Error('User already has this goal assigned');
    }

    // Create new user goal
    const userGoal = new UserGoalModel({
      user_goal_id: uuidv4(),
      user_id,
      goal_id: payload.goal_id,
      assigned_date: new Date(),
      target_completion_date: payload.target_completion_date ? new Date(payload.target_completion_date) : null,
      notes: payload.notes,
      progress_percentage: 0,
      status: 'Active'
    });

    const savedUserGoal = await userGoal.save();
    
    return {
      user_goal_id: savedUserGoal.user_goal_id,
      user_id: savedUserGoal.user_id,
      goal_id: savedUserGoal.goal_id,
      assigned_date: savedUserGoal.assigned_date.toISOString(),
      target_completion_date: savedUserGoal.target_completion_date?.toISOString() || null,
      actual_completion_date: savedUserGoal.actual_completion_date?.toISOString() || null,
      progress_percentage: savedUserGoal.progress_percentage,
      status: savedUserGoal.status,
      notes: savedUserGoal.notes,
      created_at: savedUserGoal.created_at.toISOString(),
      updated_at: savedUserGoal.updated_at.toISOString()
    };
  }

  static async updateUserGoal(user_goal_id: string, payload: UpdateUserGoalPayload) {
    const userGoal = await UserGoalModel.findOneAndUpdate(
      { user_goal_id },
      { 
        $set: {
          ...payload,
          target_completion_date: payload.target_completion_date ? new Date(payload.target_completion_date) : undefined,
          actual_completion_date: payload.status === 'Completed' ? new Date() : undefined
        }
      },
      { new: true, runValidators: true }
    );

    if (!userGoal) {
      throw new Error('User goal not found');
    }

    return {
      user_goal_id: userGoal.user_goal_id,
      user_id: userGoal.user_id,
      goal_id: userGoal.goal_id,
      assigned_date: userGoal.assigned_date.toISOString(),
      target_completion_date: userGoal.target_completion_date?.toISOString() || null,
      actual_completion_date: userGoal.actual_completion_date?.toISOString() || null,
      progress_percentage: userGoal.progress_percentage,
      status: userGoal.status,
      notes: userGoal.notes,
      created_at: userGoal.created_at.toISOString(),
      updated_at: userGoal.updated_at.toISOString()
    };
  }

  // ===== Admin Functions =====

  static async getAllUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      UserModel.find({ is_active: true })
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 })
        .lean(),
      UserModel.countDocuments({ is_active: true })
    ]);

    return {
      users: users.map(user => ({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        subscription_status: user.subscription_status,
        created_at: user.created_at.toISOString(),
        last_login: user.last_login?.toISOString() || null,
        email_verified: user.email_verified
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async listAllUsers(limit = 10, offset = 0) {
    const [users, total] = await Promise.all([
      UserModel.find({ is_active: true })
        .select('-password')
        .skip(offset)
        .limit(limit)
        .sort({ created_at: -1 })
        .lean(),
      UserModel.countDocuments({ is_active: true })
    ]);

    return {
      users: users.map(user => ({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        subscription_status: user.subscription_status,
        created_at: user.created_at.toISOString(),
        last_login: user.last_login?.toISOString() || null,
        email_verified: user.email_verified
      })),
      total
    };
  }

  static async getUserActiveGoals(user_id: string) {
    const activeUserGoals = await UserGoalModel.find({ 
      user_id, 
      status: { $in: ['Active', 'Paused'] }
    }).lean();

    return activeUserGoals.map(userGoal => ({
      user_goal_id: userGoal.user_goal_id,
      user_id: userGoal.user_id,
      goal_id: userGoal.goal_id,
      assigned_date: userGoal.assigned_date.toISOString(),
      target_completion_date: userGoal.target_completion_date?.toISOString() || null,
      actual_completion_date: userGoal.actual_completion_date?.toISOString() || null,
      progress_percentage: userGoal.progress_percentage,
      status: userGoal.status,
      notes: userGoal.notes,
      created_at: userGoal.created_at.toISOString(),
      updated_at: userGoal.updated_at.toISOString()
    }));
  }

  static async updateUserGoalProgress(user_id: string, user_goal_id: string, payload: UpdateUserGoalPayload) {
    const userGoal = await UserGoalModel.findOneAndUpdate(
      { user_goal_id, user_id },
      { 
        $set: {
          ...payload,
          target_completion_date: payload.target_completion_date ? new Date(payload.target_completion_date) : undefined,
          actual_completion_date: payload.status === 'Completed' ? new Date() : undefined
        }
      },
      { new: true, runValidators: true }
    );

    if (!userGoal) {
      throw new Error('User goal not found');
    }

    return {
      user_goal_id: userGoal.user_goal_id,
      user_id: userGoal.user_id,
      goal_id: userGoal.goal_id,
      assigned_date: userGoal.assigned_date.toISOString(),
      target_completion_date: userGoal.target_completion_date?.toISOString() || null,
      actual_completion_date: userGoal.actual_completion_date?.toISOString() || null,
      progress_percentage: userGoal.progress_percentage,
      status: userGoal.status,
      notes: userGoal.notes,
      created_at: userGoal.created_at.toISOString(),
      updated_at: userGoal.updated_at.toISOString()
    };
  }

  static async removeUserGoal(user_id: string, user_goal_id: string) {
    const userGoal = await UserGoalModel.findOneAndUpdate(
      { user_goal_id, user_id },
      { status: 'Cancelled' },
      { new: true }
    );

    if (!userGoal) {
      throw new Error('User goal not found');
    }

    return { message: 'User goal removed successfully' };
  }

  static async getUserDashboard(user_id: string) {
    const [user, activeGoals, totalGoals] = await Promise.all([
      UserModel.findOne({ user_id, is_active: true }).select('-password').lean(),
      UserGoalModel.countDocuments({ user_id, status: { $in: ['Active', 'Paused'] } }),
      UserGoalModel.countDocuments({ user_id })
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    const completedGoals = await UserGoalModel.countDocuments({ 
      user_id, 
      status: 'Completed' 
    });

    return {
      user: toUserResponse(user as any),
      stats: {
        activeGoals,
        completedGoals,
        totalGoals,
        completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
      },
      needsOnboarding: !user.age || !user.gender || !user.height || !user.weight || !user.fitness_goal
    };
  }

  static async deactivateUser(user_id: string) {
    const user = await UserModel.findOneAndUpdate(
      { user_id },
      { is_active: false },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return { message: 'User deactivated successfully' };
  }

  // ===== Utility Functions =====

  static async validatePassword(email: string, password: string): Promise<boolean> {
    const user = await UserModel.findOne({ email, is_active: true }).lean();
    if (!user) {
      return false;
    }

    return await bcrypt.compare(password, user.password);
  }

  static async updatePassword(user_id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await UserModel.findOneAndUpdate(
      { user_id, is_active: true },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }
  }
}



export default UserService;