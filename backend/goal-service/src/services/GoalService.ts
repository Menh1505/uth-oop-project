import { GoalRepository } from '../repositories/GoalRepository';
import {
  Goal,
  UserGoal,
  UserGoalWithGoal,
  CreateGoalRequest,
  UpdateGoalRequest,
  AssignGoalRequest,
  UpdateUserGoalRequest,
  GoalFilters,
  GoalPagination,
  GoalSearchResult,
  GoalStatistics,
  GoalProgress,
  GoalRecommendation,
  GoalAdjustmentSuggestion,
  GoalTemplate,
  SmartGoalSuggestion,
  GoalType,
  GoalTargetMetrics
} from '../models/Goal';

export class GoalService {
  private goalRepository: GoalRepository;

  constructor() {
    this.goalRepository = new GoalRepository();
  }

  // =================== Goal Management ===================

  async createGoal(goalData: CreateGoalRequest): Promise<Goal> {
    // Validate goal data
    this.validateGoalData(goalData);
    
    // Create goal
    const goal = await this.goalRepository.createGoal(goalData);
    
    return goal;
  }

  async getGoalById(goalId: string): Promise<Goal | null> {
    return await this.goalRepository.getGoalById(goalId);
  }

  async updateGoal(goalId: string, updateData: UpdateGoalRequest): Promise<Goal | null> {
    // Check if goal exists
    const existingGoal = await this.goalRepository.getGoalById(goalId);
    if (!existingGoal) {
      throw new Error('Goal not found');
    }

    // Validate update data
    if (Object.keys(updateData).length > 0) {
      this.validatePartialGoalData(updateData);
    }

    return await this.goalRepository.updateGoal(goalId, updateData);
  }

  async deleteGoal(goalId: string): Promise<boolean> {
    // Check if goal exists
    const existingGoal = await this.goalRepository.getGoalById(goalId);
    if (!existingGoal) {
      throw new Error('Goal not found');
    }

    return await this.goalRepository.deleteGoal(goalId);
  }

  async getAllGoals(filters?: GoalFilters, pagination?: GoalPagination): Promise<Goal[]> {
    return await this.goalRepository.getAllGoals(filters, pagination);
  }

  async getPopularGoals(limit: number = 10): Promise<Goal[]> {
    return await this.goalRepository.getGoalsByPopularity(limit);
  }

  // =================== User Goal Management ===================

  async assignGoalToUser(userId: string, assignData: AssignGoalRequest): Promise<UserGoal> {
    // Validate goal exists
    const goal = await this.goalRepository.getGoalById(assignData.goal_id);
    if (!goal) {
      throw new Error('Goal not found');
    }

    if (!goal.is_active) {
      throw new Error('Cannot assign inactive goal');
    }

    // Validate target completion date
    if (assignData.target_completion_date) {
      const targetDate = new Date(assignData.target_completion_date);
      const today = new Date();
      
      if (targetDate <= today) {
        throw new Error('Target completion date must be in the future');
      }
    }

    return await this.goalRepository.assignGoalToUser(userId, assignData);
  }

  async getUserGoals(
    userId: string,
    filters?: GoalFilters,
    pagination?: GoalPagination
  ): Promise<GoalSearchResult> {
    return await this.goalRepository.getUserGoals(userId, filters, pagination);
  }

  async getUserGoalById(userGoalId: string): Promise<UserGoal | null> {
    return await this.goalRepository.getUserGoalById(userGoalId);
  }

  async updateUserGoal(userGoalId: string, updateData: UpdateUserGoalRequest): Promise<UserGoal | null> {
    // Check if user goal exists
    const existingUserGoal = await this.goalRepository.getUserGoalById(userGoalId);
    if (!existingUserGoal) {
      throw new Error('User goal not found');
    }

    // Validate progress percentage
    if (updateData.progress_percentage !== undefined) {
      if (updateData.progress_percentage < 0 || updateData.progress_percentage > 100) {
        throw new Error('Progress percentage must be between 0 and 100');
      }
    }

    // Auto-complete goal if progress reaches 100%
    if (updateData.progress_percentage === 100 && updateData.status !== 'Completed') {
      updateData.status = 'Completed';
      updateData.actual_completion_date = new Date().toISOString();
    }

    // Validate status transitions
    if (updateData.status) {
      this.validateStatusTransition(existingUserGoal.status, updateData.status);
    }

    return await this.goalRepository.updateUserGoal(userGoalId, updateData);
  }

  async deleteUserGoal(userGoalId: string): Promise<boolean> {
    // Check if user goal exists
    const existingUserGoal = await this.goalRepository.getUserGoalById(userGoalId);
    if (!existingUserGoal) {
      throw new Error('User goal not found');
    }

    return await this.goalRepository.deleteUserGoal(userGoalId);
  }

  // =================== Progress Tracking ===================

  async getGoalProgress(userGoalId: string): Promise<GoalProgress | null> {
    return await this.goalRepository.calculateGoalProgress(userGoalId);
  }

  async updateGoalProgress(userGoalId: string, progressPercentage: number): Promise<UserGoal | null> {
    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    const updateData: UpdateUserGoalRequest = {
      progress_percentage: progressPercentage
    };

    // Auto-complete if reaches 100%
    if (progressPercentage >= 100) {
      updateData.status = 'Completed';
      updateData.actual_completion_date = new Date().toISOString();
    }

    return await this.updateUserGoal(userGoalId, updateData);
  }

  async getUserGoalStatistics(userId: string): Promise<GoalStatistics> {
    return await this.goalRepository.getUserGoalStatistics(userId);
  }

  async getActiveGoalsNearDeadline(userId: string, days: number = 7): Promise<UserGoalWithGoal[]> {
    return await this.goalRepository.getActiveGoalsNearDeadline(userId, days);
  }

  async getRecentGoalActivity(userId: string, days: number = 30): Promise<UserGoalWithGoal[]> {
    return await this.goalRepository.getRecentGoalActivity(userId, days);
  }

  // =================== Goal Recommendations ===================

  async getGoalRecommendations(userId: string): Promise<GoalRecommendation[]> {
    // Get user's goal history and statistics
    const stats = await this.goalRepository.getUserGoalStatistics(userId);
    const activeGoals = await this.goalRepository.getUserGoals(userId, { status: 'Active' });

    const recommendations: GoalRecommendation[] = [];

    // If user has no active goals, recommend based on popularity and goal types
    if (activeGoals.goals.length === 0) {
      recommendations.push(...this.getBeginnerRecommendations());
    } else {
      // Recommend complementary goals based on current goals
      recommendations.push(...this.getComplementaryRecommendations(activeGoals.goals, stats));
    }

    // Add progressive goals based on completed goals
    if (stats.completed_goals > 0) {
      recommendations.push(...this.getProgressiveRecommendations(stats));
    }

    // Sort by priority and success probability
    return recommendations
      .sort((a, b) => {
        const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        const bPriority = b.priority || 'Low';
        const aPriority = a.priority || 'Low';
        const priorityScore = (priorityWeight[bPriority] || 0) - (priorityWeight[aPriority] || 0);
        if (priorityScore !== 0) return priorityScore;
        const bProb = b.success_probability || 0;
        const aProb = a.success_probability || 0;
        return bProb - aProb;
      })
      .slice(0, 5); // Return top 5 recommendations
  }

  async getGoalAdjustmentSuggestions(userGoalId: string): Promise<GoalAdjustmentSuggestion[]> {
    const progress = await this.goalRepository.calculateGoalProgress(userGoalId);
    if (!progress) {
      throw new Error('Goal progress not found');
    }

    const suggestions: GoalAdjustmentSuggestion[] = [];
    const targetMetrics = progress.target_metrics || {};

    // Analyze progress and suggest adjustments
    if (progress.progress_percentage < 25 && progress.days_remaining && progress.days_remaining > 0) {
      // Slow progress - suggest easier targets or extended timeline
      suggestions.push({
        suggestion_type: 'Decrease',
        reason: 'Your current progress suggests the targets might be too ambitious. Consider adjusting to more achievable goals.',
        suggested_metrics: this.calculateEasierTargets(targetMetrics)
      });

      if (targetMetrics.duration_weeks) {
        suggestions.push({
          suggestion_type: 'Modify Timeline',
          reason: 'Extending the timeline by 30% may help you achieve your goals without compromising quality.',
          suggested_metrics: { 
            duration_weeks: Math.ceil(targetMetrics.duration_weeks * 1.3) 
          }
        });
      }
    }

    if (progress.progress_percentage > 75 && progress.days_remaining && progress.days_remaining > 14) {
      // Excellent progress - suggest more ambitious targets
      suggestions.push({
        suggestion_type: 'Increase',
        reason: 'You\'re ahead of schedule! Consider setting more challenging targets to maximize your progress.',
        suggested_metrics: this.calculateMoreAmbitiousTargets(targetMetrics)
      });
    }

    if (!progress.on_track && progress.days_remaining && progress.days_remaining < 14) {
      // Behind schedule with little time left - suggest strategy change
      suggestions.push({
        suggestion_type: 'Change Strategy',
        reason: 'With limited time remaining, focus on the most impactful changes and consistency.',
        suggested_metrics: targetMetrics
      });
    }

    return suggestions;
  }

  async getGoalTemplates(): Promise<GoalTemplate[]> {
    const templates: GoalTemplate[] = [
      {
        template_id: 'template-1',
        template_name: 'Beginner Fat Loss',
        goal_type: 'Reduce Fat',
        default_metrics: {
          calories: 2000,
          duration_weeks: 12
        },
        description: 'A sustainable fat loss plan for beginners focusing on moderate calorie deficit.',
        difficulty_level: 'Easy',
        category: 'Weight Loss',
        tips: [
          'Create a moderate calorie deficit of 300-500 calories daily',
          'Focus on whole foods and reduce processed foods',
          'Include 3-4 cardio sessions per week',
          'Stay hydrated with 8-10 glasses of water daily'
        ]
      },
      {
        template_id: 'template-2',
        template_name: 'Muscle Building Foundation',
        goal_type: 'Build Muscle',
        default_metrics: {
          calories: 2500,
          protein: 140,
          duration_weeks: 16
        },
        description: 'Build lean muscle mass with proper nutrition and progressive training.',
        difficulty_level: 'Medium',
        category: 'Fitness',
        tips: [
          'Eat in a slight calorie surplus (200-300 calories)',
          'Consume 1.6-2.2g protein per kg body weight',
          'Focus on compound movements',
          'Get adequate sleep for recovery'
        ]
      },
      {
        template_id: 'template-3',
        template_name: 'Weight Maintenance',
        goal_type: 'Maintain Weight',
        default_metrics: {
          calories: 2200,
          duration_weeks: 8
        },
        description: 'Maintain current weight while improving body composition.',
        difficulty_level: 'Easy',
        category: 'Nutrition',
        tips: [
          'Eat at maintenance calories',
          'Focus on consistent exercise routine',
          'Monitor weekly weigh-ins',
          'Prioritize strength training'
        ]
      },
      {
        template_id: 'template-4',
        template_name: 'Endurance Builder',
        goal_type: 'Increase Endurance',
        default_metrics: {
          calories: 2400,
          duration_weeks: 12
        },
        description: 'Improve cardiovascular endurance and stamina.',
        difficulty_level: 'Medium',
        category: 'Fitness',
        tips: [
          'Gradually increase cardio duration',
          'Include interval training',
          'Focus on carbohydrate timing',
          'Monitor heart rate zones'
        ]
      }
    ];

    return templates;
  }

  async createGoalFromTemplate(templateId: string, customizations?: Partial<GoalTargetMetrics>): Promise<CreateGoalRequest> {
    const templates = await this.getGoalTemplates();
    const template = templates.find(t => t.template_id === templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    const goalData: CreateGoalRequest = {
      goal_type: template.goal_type,
      target_calories: customizations?.calories || template.default_metrics.calories,
      target_protein: customizations?.protein || template.default_metrics.protein,
      target_carbs: customizations?.carbs || template.default_metrics.carbs,
      target_fat: customizations?.fat || template.default_metrics.fat,
      target_weight: customizations?.weight || template.default_metrics.weight,
      target_duration_weeks: customizations?.duration_weeks || template.default_metrics.duration_weeks,
      description: template.description
    };

    return goalData;
  }

  async getSmartGoalSuggestions(userId: string): Promise<SmartGoalSuggestion[]> {
    const stats = await this.goalRepository.getUserGoalStatistics(userId);
    const activeGoals = await this.goalRepository.getUserGoals(userId, { status: 'Active' });

    const suggestions: SmartGoalSuggestion[] = [];

    // Suggest based on goal completion patterns
    if (stats.completion_rate > 80) {
      // High completion rate - suggest more challenging goals
      suggestions.push({
        suggested_goal_type: 'Build Muscle',
        reason: 'Your high completion rate suggests you\'re ready for more challenging muscle-building goals.',
        recommended_metrics: {
          calories: 2600,
          protein: 150,
          duration_weeks: 16
        },
        difficulty_level: 'Hard',
        estimated_success_rate: 85
      });
    }

    if (activeGoals.goals.length === 0) {
      // No active goals - suggest starter goals
      suggestions.push({
        suggested_goal_type: 'General Fitness',
        reason: 'Start with a balanced approach to establish healthy habits.',
        recommended_metrics: {
          calories: 2200,
          duration_weeks: 8
        },
        difficulty_level: 'Easy',
        estimated_success_rate: 90
      });
    }

    // Suggest complementary goals based on most common goal type
    if (stats.most_common_goal_type === 'Reduce Fat') {
      suggestions.push({
        suggested_goal_type: 'Build Muscle',
        reason: 'Combining fat loss with muscle building will improve body composition.',
        recommended_metrics: {
          calories: 2400,
          protein: 130,
          duration_weeks: 14
        },
        difficulty_level: 'Medium',
        estimated_success_rate: 82
      });
    }

    return suggestions.slice(0, 3);
  }

  // =================== Private Helper Methods ===================

  private validateGoalData(goalData: CreateGoalRequest): void {
    if (!goalData.goal_type) {
      throw new Error('Goal type is required');
    }

    if (goalData.target_calories && goalData.target_calories <= 0) {
      throw new Error('Target calories must be positive');
    }

    if (goalData.target_protein && goalData.target_protein < 0) {
      throw new Error('Target protein cannot be negative');
    }

    if (goalData.target_carbs && goalData.target_carbs < 0) {
      throw new Error('Target carbs cannot be negative');
    }

    if (goalData.target_fat && goalData.target_fat < 0) {
      throw new Error('Target fat cannot be negative');
    }

    if (goalData.target_weight && goalData.target_weight <= 0) {
      throw new Error('Target weight must be positive');
    }

    if (goalData.target_duration_weeks && goalData.target_duration_weeks <= 0) {
      throw new Error('Target duration must be positive');
    }
  }

  private validatePartialGoalData(updateData: UpdateGoalRequest): void {
    if (updateData.target_calories !== undefined && updateData.target_calories <= 0) {
      throw new Error('Target calories must be positive');
    }

    if (updateData.target_protein !== undefined && updateData.target_protein < 0) {
      throw new Error('Target protein cannot be negative');
    }

    if (updateData.target_carbs !== undefined && updateData.target_carbs < 0) {
      throw new Error('Target carbs cannot be negative');
    }

    if (updateData.target_fat !== undefined && updateData.target_fat < 0) {
      throw new Error('Target fat cannot be negative');
    }

    if (updateData.target_weight !== undefined && updateData.target_weight <= 0) {
      throw new Error('Target weight must be positive');
    }

    if (updateData.target_duration_weeks !== undefined && updateData.target_duration_weeks <= 0) {
      throw new Error('Target duration must be positive');
    }
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'Active': ['Paused', 'Completed', 'Cancelled'],
      'Paused': ['Active', 'Cancelled'],
      'Completed': [], // Completed goals cannot be changed
      'Cancelled': ['Active'] // Can reactivate cancelled goals
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private getBeginnerRecommendations(): GoalRecommendation[] {
    return [
      {
        goal_type: 'General Fitness',
        reason: 'Perfect starting point to establish healthy habits and build consistency.',
        recommended_metrics: {
          calories: 2200,
          duration_weeks: 8
        },
        priority: 'High',
        success_probability: 90
      },
      {
        goal_type: 'Maintain Weight',
        reason: 'Learn portion control and develop awareness of your eating patterns.',
        recommended_metrics: {
          calories: 2100,
          duration_weeks: 6
        },
        priority: 'Medium',
        success_probability: 85
      }
    ];
  }

  private getComplementaryRecommendations(activeGoals: UserGoalWithGoal[], stats: GoalStatistics): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = [];
    const activeGoalTypes = activeGoals
      .filter(g => g.goal !== undefined)
      .map(g => g.goal!.goal_type);

    // If user has fat loss goal, suggest muscle building
    if (activeGoalTypes.includes('Reduce Fat') && !activeGoalTypes.includes('Build Muscle')) {
      recommendations.push({
        goal_type: 'Build Muscle',
        reason: 'Adding muscle building to your fat loss goals will improve body composition.',
        recommended_metrics: {
          calories: 2400,
          protein: 130,
          duration_weeks: 12
        },
        priority: 'High',
        success_probability: 75
      });
    }

    // If user has muscle building, suggest endurance
    if (activeGoalTypes.includes('Build Muscle') && !activeGoalTypes.includes('Increase Endurance')) {
      recommendations.push({
        goal_type: 'Increase Endurance',
        reason: 'Improve cardiovascular health while maintaining muscle gains.',
        recommended_metrics: {
          calories: 2500,
          duration_weeks: 10
        },
        priority: 'Medium',
        success_probability: 70
      });
    }

    return recommendations;
  }

  private getProgressiveRecommendations(stats: GoalStatistics): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = [];

    if (stats.most_common_goal_type === 'General Fitness' && stats.completed_goals >= 2) {
      recommendations.push({
        goal_type: 'Build Muscle',
        reason: 'You\'ve mastered the basics. Time to focus on building lean muscle mass.',
        recommended_metrics: {
          calories: 2500,
          protein: 140,
          duration_weeks: 14
        },
        priority: 'High',
        success_probability: 80
      });
    }

    return recommendations;
  }

  private calculateEasierTargets(currentTargets: GoalTargetMetrics): Partial<GoalTargetMetrics> {
    const easierTargets: Partial<GoalTargetMetrics> = {};

    if (currentTargets.calories) {
      easierTargets.calories = Math.floor(currentTargets.calories * 1.1); // 10% easier
    }

    if (currentTargets.protein) {
      easierTargets.protein = Math.floor(currentTargets.protein * 0.9); // 10% less protein
    }

    if (currentTargets.weight) {
      easierTargets.weight = currentTargets.weight + 1; // 1kg less ambitious
    }

    return easierTargets;
  }

  private calculateMoreAmbitiousTargets(currentTargets: GoalTargetMetrics): Partial<GoalTargetMetrics> {
    const ambitiousTargets: Partial<GoalTargetMetrics> = {};

    if (currentTargets.calories) {
      ambitiousTargets.calories = Math.floor(currentTargets.calories * 0.95); // 5% more deficit/surplus
    }

    if (currentTargets.protein) {
      ambitiousTargets.protein = Math.floor(currentTargets.protein * 1.1); // 10% more protein
    }

    if (currentTargets.weight) {
      ambitiousTargets.weight = currentTargets.weight - 1; // 1kg more ambitious
    }

    return ambitiousTargets;
  }
}