import { v4 as uuidv4 } from 'uuid';
import { 
  GoalModel, 
  UserGoalModel, 
  IGoal, 
  IUserGoal,
  Goal,
  GoalType,
  CreateGoalRequest,
  UpdateGoalRequest,
  AssignGoalRequest,
  UpdateUserGoalRequest,
  GoalFilters,
  GoalPagination,
  UserGoal,
  UserGoalWithGoal,
  GoalSearchResult,
  GoalStatistics,
  GoalProgress,
  GoalRecommendation,
  GoalAdjustmentSuggestion,
  GoalTemplate,
  SmartGoalSuggestion
} from '../models/Goal';

export class GoalService {
  // =================== Goal Management ===================

  async createGoal(goalData: CreateGoalRequest): Promise<Goal> {
    const goal = new GoalModel({
      goal_id: uuidv4(),
      ...goalData,
      is_active: true
    });

    const savedGoal = await goal.save();
    return this.toGoalInterface(savedGoal);
  }

  async getAllGoals(filters?: GoalFilters, pagination?: GoalPagination): Promise<Goal[]> {
    const query: any = {};
    
    if (filters?.goal_type) {
      query.goal_type = filters.goal_type;
    }
    
    if (filters?.is_active !== undefined) {
      query.is_active = filters.is_active;
    }
    
    if (filters?.created_after || filters?.created_before) {
      query.created_at = {};
      if (filters.created_after) {
        query.created_at.$gte = filters.created_after;
      }
      if (filters.created_before) {
        query.created_at.$lte = filters.created_before;
      }
    }

    let goalQuery = GoalModel.find(query);

    // Apply pagination and sorting
    if (pagination) {
      const skip = (pagination.page - 1) * pagination.limit;
      const sortField = pagination.sort_by || 'created_at';
      const sortOrder = pagination.sort_order === 'ASC' ? 1 : -1;
      
      goalQuery = goalQuery
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pagination.limit);
    }

    const goals = await goalQuery.exec();
    return goals.map(goal => this.toGoalInterface(goal));
  }

  async getGoalById(goalId: string): Promise<Goal | null> {
    const goal = await GoalModel.findOne({ goal_id: goalId });
    return goal ? this.toGoalInterface(goal) : null;
  }

  async updateGoal(goalId: string, updateData: UpdateGoalRequest): Promise<Goal | null> {
    const goal = await GoalModel.findOneAndUpdate(
      { goal_id: goalId },
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
    return goal ? this.toGoalInterface(goal) : null;
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    const result = await GoalModel.deleteOne({ goal_id: goalId });
    return result.deletedCount > 0;
  }

  async getPopularGoals(limit: number = 10): Promise<Goal[]> {
    // For now, return most recent active goals
    // In the future, this could be based on assignment frequency
    const goals = await GoalModel
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .limit(limit);
    
    return goals.map(goal => this.toGoalInterface(goal));
  }

  // =================== User Goal Management ===================

  async assignGoalToUser(userId: string, assignData: AssignGoalRequest): Promise<UserGoal> {
    // Check if goal exists
    const goalExists = await GoalModel.findOne({ goal_id: assignData.goal_id });
    if (!goalExists) {
      throw new Error('Goal not found');
    }

    const userGoal = new UserGoalModel({
      user_goal_id: uuidv4(),
      user_id: userId,
      goal_id: assignData.goal_id,
      target_completion_date: assignData.target_completion_date ? new Date(assignData.target_completion_date) : undefined,
      notes: assignData.notes,
      progress_percentage: 0,
      status: 'Active'
    });

    const savedUserGoal = await userGoal.save();
    return this.toUserGoalInterface(savedUserGoal);
  }

  async getUserGoals(
    userId: string, 
    filters?: GoalFilters, 
    pagination?: GoalPagination
  ): Promise<GoalSearchResult> {
    const query: any = { user_id: userId };
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.progress_min !== undefined || filters?.progress_max !== undefined) {
      query.progress_percentage = {};
      if (filters.progress_min !== undefined) {
        query.progress_percentage.$gte = filters.progress_min;
      }
      if (filters.progress_max !== undefined) {
        query.progress_percentage.$lte = filters.progress_max;
      }
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;
    const sortField = pagination?.sort_by || 'created_at';
    const sortOrder = pagination?.sort_order === 'ASC' ? 1 : -1;

    const total = await UserGoalModel.countDocuments(query);
    const userGoals = await UserGoalModel
      .find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Populate with goal data
    const userGoalsWithGoals: UserGoalWithGoal[] = [];
    for (const userGoal of userGoals) {
      const goal = await GoalModel.findOne({ goal_id: userGoal.goal_id });
      if (goal) {
        userGoalsWithGoals.push({
          ...this.toUserGoalInterface(userGoal),
          goal: this.toGoalInterface(goal)
        });
      }
    }

    return {
      goals: userGoalsWithGoals,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      },
      total_count: total,
      current_page: page,
      total_pages: Math.ceil(total / limit),
      has_next: page < Math.ceil(total / limit),
      has_previous: page > 1
    };
  }

  async getUserGoalById(userGoalId: string): Promise<UserGoalWithGoal | null> {
    const userGoal = await UserGoalModel.findOne({ user_goal_id: userGoalId });
    if (!userGoal) return null;

    const goal = await GoalModel.findOne({ goal_id: userGoal.goal_id });
    if (!goal) return null;

    return {
      ...this.toUserGoalInterface(userGoal),
      goal: this.toGoalInterface(goal)
    };
  }

  async updateUserGoal(userGoalId: string, updateData: UpdateUserGoalRequest): Promise<UserGoal | null> {
    const userGoal = await UserGoalModel.findOneAndUpdate(
      { user_goal_id: userGoalId },
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
    return userGoal ? this.toUserGoalInterface(userGoal) : null;
  }

  async deleteUserGoal(userGoalId: string): Promise<boolean> {
    const result = await UserGoalModel.deleteOne({ user_goal_id: userGoalId });
    return result.deletedCount > 0;
  }

  // =================== Progress Tracking ===================

  async getGoalProgress(userGoalId: string): Promise<GoalProgress | null> {
    const userGoal = await UserGoalModel.findOne({ user_goal_id: userGoalId });
    if (!userGoal) return null;

    const goal = await GoalModel.findOne({ goal_id: userGoal.goal_id });
    if (!goal) return null;

    // Calculate days remaining
    let daysRemaining: number | undefined;
    if (userGoal.target_completion_date) {
      const now = new Date();
      const targetDate = new Date(userGoal.target_completion_date);
      daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      user_goal_id: userGoal.user_goal_id,
      goal_type: goal.goal_type,
      target_metrics: {
        calories: goal.target_calories || undefined,
        protein: goal.target_protein || undefined,
        carbs: goal.target_carbs || undefined,
        fat: goal.target_fat || undefined,
        weight: goal.target_weight || undefined,
        duration_weeks: goal.target_duration_weeks || undefined
      },
      current_metrics: {
        // This would be populated from actual user data in a real implementation
      },
      progress_percentage: userGoal.progress_percentage,
      days_remaining: daysRemaining,
      estimated_completion_date: userGoal.target_completion_date,
      on_track: userGoal.progress_percentage >= 50 // Simple logic for demo
    };
  }

  async updateGoalProgress(userGoalId: string, progressPercentage: number): Promise<UserGoal | null> {
    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    const updateData: any = {
      progress_percentage: progressPercentage,
      updated_at: new Date()
    };

    // Auto-complete if progress reaches 100%
    if (progressPercentage >= 100) {
      updateData.status = 'Completed';
      updateData.actual_completion_date = new Date();
    }

    const userGoal = await UserGoalModel.findOneAndUpdate(
      { user_goal_id: userGoalId },
      updateData,
      { new: true }
    );

    return userGoal ? this.toUserGoalInterface(userGoal) : null;
  }

  async getUserGoalStatistics(userId: string): Promise<GoalStatistics> {
    const userGoals = await UserGoalModel.find({ user_id: userId });
    
    const total_goals = userGoals.length;
    const active_goals = userGoals.filter(ug => ug.status === 'Active').length;
    const completed_goals = userGoals.filter(ug => ug.status === 'Completed').length;
    const paused_goals = userGoals.filter(ug => ug.status === 'Paused').length;
    const cancelled_goals = userGoals.filter(ug => ug.status === 'Cancelled').length;
    
    const completion_rate = total_goals > 0 ? (completed_goals / total_goals) * 100 : 0;
    const average_progress = total_goals > 0 
      ? userGoals.reduce((sum, ug) => sum + ug.progress_percentage, 0) / total_goals 
      : 0;

    // Get most common goal type
    const goalTypes: Record<string, number> = {};
    for (const userGoal of userGoals) {
      const goal = await GoalModel.findOne({ goal_id: userGoal.goal_id });
      if (goal) {
        goalTypes[goal.goal_type] = (goalTypes[goal.goal_type] || 0) + 1;
      }
    }

    const most_common_goal_type = Object.keys(goalTypes).reduce((a, b) => 
      goalTypes[a] > goalTypes[b] ? a : b, 'General Fitness'
    );

    return {
      total_goals,
      active_goals,
      completed_goals,
      paused_goals,
      cancelled_goals,
      completion_rate,
      average_progress,
      most_common_goal_type,
      goals_by_type: goalTypes,
      monthly_progress: [] // Would implement proper monthly aggregation
    };
  }

  async getActiveGoalsNearDeadline(userId: string, days: number = 7): Promise<UserGoalWithGoal[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const userGoals = await UserGoalModel.find({
      user_id: userId,
      status: 'Active',
      target_completion_date: { $lte: cutoffDate, $gte: new Date() }
    });

    const results: UserGoalWithGoal[] = [];
    for (const userGoal of userGoals) {
      const goal = await GoalModel.findOne({ goal_id: userGoal.goal_id });
      if (goal) {
        results.push({
          ...this.toUserGoalInterface(userGoal),
          goal: this.toGoalInterface(goal)
        });
      }
    }

    return results;
  }

  async getRecentGoalActivity(userId: string, days: number = 30): Promise<UserGoalWithGoal[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const userGoals = await UserGoalModel.find({
      user_id: userId,
      updated_at: { $gte: cutoffDate }
    }).sort({ updated_at: -1 });

    const results: UserGoalWithGoal[] = [];
    for (const userGoal of userGoals) {
      const goal = await GoalModel.findOne({ goal_id: userGoal.goal_id });
      if (goal) {
        results.push({
          ...this.toUserGoalInterface(userGoal),
          goal: this.toGoalInterface(goal)
        });
      }
    }

    return results;
  }

  // =================== Recommendations & Templates ===================

  async getGoalRecommendations(userId: string): Promise<GoalRecommendation[]> {
    // Simple recommendation logic - in reality this would be more sophisticated
    const userGoals = await UserGoalModel.find({ user_id: userId });
    const existingGoalTypes = new Set();
    
    for (const userGoal of userGoals) {
      const goal = await GoalModel.findOne({ goal_id: userGoal.goal_id });
      if (goal) {
        existingGoalTypes.add(goal.goal_type);
      }
    }

    const allGoalTypes: GoalType[] = [
      'Lose Weight', 'Build Muscle', 'Maintain Weight', 
      'Improve Endurance', 'General Fitness', 'Reduce Fat', 'Increase Endurance'
    ];

    const recommendations: GoalRecommendation[] = [];
    
    for (const goalType of allGoalTypes) {
      if (!existingGoalTypes.has(goalType)) {
        recommendations.push({
          goal_type: goalType,
          reason: `Based on your current goals, ${goalType.toLowerCase()} would complement your fitness journey`,
          recommended_metrics: {
            calories: goalType.includes('Weight') ? 2000 : 2200,
            protein: 150,
            duration_weeks: 12
          },
          priority: 'Medium',
          success_probability: 75
        });
      }
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  async getGoalAdjustmentSuggestions(userGoalId: string): Promise<GoalAdjustmentSuggestion[]> {
    const userGoal = await UserGoalModel.findOne({ user_goal_id: userGoalId });
    if (!userGoal) {
      throw new Error('User goal not found');
    }

    const suggestions: GoalAdjustmentSuggestion[] = [];

    // Check if progress is slow
    if (userGoal.progress_percentage < 25 && userGoal.created_at < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      suggestions.push({
        suggestion_type: 'Decrease',
        reason: 'Progress seems slower than expected. Consider reducing targets to build momentum.',
        suggested_metrics: { calories: 1800 }
      });
    }

    // Check if deadline is approaching with low progress
    if (userGoal.target_completion_date && userGoal.progress_percentage < 50) {
      const daysLeft = Math.ceil((new Date(userGoal.target_completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 30) {
        suggestions.push({
          suggestion_type: 'Modify Timeline',
          reason: 'With current progress, consider extending the deadline for a more sustainable approach.',
          suggested_metrics: { duration_weeks: 16 }
        });
      }
    }

    return suggestions;
  }

  async getGoalTemplates(): Promise<GoalTemplate[]> {
    // Static templates for now - could be stored in database
    return [
      {
        template_id: 'weight_loss_beginner',
        template_name: 'Beginner Weight Loss',
        goal_type: 'Lose Weight',
        default_metrics: { calories: 1800, protein: 120, duration_weeks: 12 },
        description: 'A gentle introduction to weight loss',
        difficulty_level: 'Beginner',
        category: 'Weight Management'
      },
      {
        template_id: 'muscle_building_intermediate',
        template_name: 'Muscle Building Program',
        goal_type: 'Build Muscle',
        default_metrics: { calories: 2400, protein: 180, duration_weeks: 16 },
        description: 'Structured muscle building approach',
        difficulty_level: 'Intermediate',
        category: 'Strength'
      }
    ];
  }

  async createGoalFromTemplate(templateId: string, customizations?: any): Promise<CreateGoalRequest> {
    const templates = await this.getGoalTemplates();
    const template = templates.find(t => t.template_id === templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    return {
      goal_type: template.goal_type as GoalType,
      description: template.description,
      target_calories: customizations?.target_calories || template.default_metrics.calories,
      target_protein: customizations?.target_protein || template.default_metrics.protein,
      target_carbs: customizations?.target_carbs || template.default_metrics.carbs,
      target_fat: customizations?.target_fat || template.default_metrics.fat,
      target_weight: customizations?.target_weight || template.default_metrics.weight,
      target_duration_weeks: customizations?.target_duration_weeks || template.default_metrics.duration_weeks
    };
  }

  async getSmartGoalSuggestions(userId: string): Promise<SmartGoalSuggestion[]> {
    // Simple AI-like suggestions based on user's goal history
    const userStats = await this.getUserGoalStatistics(userId);
    
    const suggestions: SmartGoalSuggestion[] = [];

    if (userStats.completion_rate < 50) {
      suggestions.push({
        suggested_goal_type: 'General Fitness',
        reason: 'Start with broader fitness goals to build sustainable habits',
        recommended_metrics: { calories: 2000, duration_weeks: 8 },
        difficulty_level: 'Beginner',
        estimated_success_rate: 85
      });
    }

    if (userStats.most_common_goal_type === 'Lose Weight') {
      suggestions.push({
        suggested_goal_type: 'Build Muscle',
        reason: 'Adding muscle building can boost metabolism and complement weight loss',
        recommended_metrics: { calories: 2200, protein: 160, duration_weeks: 12 },
        difficulty_level: 'Intermediate',
        estimated_success_rate: 70
      });
    }

    return suggestions;
  }

  // =================== Helper Methods ===================

  private toGoalInterface(goal: IGoal): Goal {
    return {
      goal_id: goal.goal_id,
      goal_type: goal.goal_type,
      description: goal.description || null,
      target_calories: goal.target_calories || null,
      target_protein: goal.target_protein || null,
      target_carbs: goal.target_carbs || null,
      target_fat: goal.target_fat || null,
      target_weight: goal.target_weight || null,
      target_duration_weeks: goal.target_duration_weeks || null,
      is_active: goal.is_active,
      created_at: goal.created_at.toISOString(),
      updated_at: goal.updated_at.toISOString()
    };
  }

  private toUserGoalInterface(userGoal: IUserGoal): UserGoal {
    return {
      user_goal_id: userGoal.user_goal_id,
      user_id: userGoal.user_id,
      goal_id: userGoal.goal_id,
      assigned_date: userGoal.assigned_date.toISOString(),
      target_completion_date: userGoal.target_completion_date?.toISOString() || null,
      actual_completion_date: userGoal.actual_completion_date?.toISOString() || null,
      progress_percentage: userGoal.progress_percentage,
      status: userGoal.status,
      notes: userGoal.notes || null,
      created_at: userGoal.created_at.toISOString(),
      updated_at: userGoal.updated_at.toISOString()
    };
  }
}