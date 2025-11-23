import { ExerciseRepository } from '../repositories/ExerciseRepository';
import { 
  CreateExercisePayload, 
  UpdateExercisePayload, 
  ExerciseFilters,
  Exercise,
  ExerciseStatistics,
  DailyExerciseSummary,
  ExercisePerformanceMetrics,
  ExerciseRecommendationCriteria,
  ExerciseRecommendation,
  CalorieBurnFactors
} from '../models/Exercise';

export class ExerciseService {
  // Create a new exercise
  static async createExercise(userId: string, exerciseData: CreateExercisePayload): Promise<Exercise> {
    // Validate exercise date format
    if (!this.isValidDate(exerciseData.exercise_date)) {
      throw new Error('Invalid exercise date format. Use YYYY-MM-DD');
    }

    // Validate exercise time format if provided
    if (exerciseData.exercise_time && !this.isValidTime(exerciseData.exercise_time)) {
      throw new Error('Invalid exercise time format. Use HH:MM');
    }

    // Validate duration
    if (exerciseData.duration_minutes !== undefined && exerciseData.duration_minutes <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    // Validate calories
    if (exerciseData.calories_burned !== undefined && exerciseData.calories_burned < 0) {
      throw new Error('Calories burned must be 0 or greater');
    }

    // Validate weight for strength exercises
    if (exerciseData.exercise_type === 'Strength' && exerciseData.weight_kg !== undefined && exerciseData.weight_kg <= 0) {
      throw new Error('Weight must be greater than 0 for strength exercises');
    }

    // Validate sets and reps for strength exercises
    if (exerciseData.exercise_type === 'Strength') {
      if (exerciseData.sets !== undefined && exerciseData.sets <= 0) {
        throw new Error('Sets must be greater than 0 for strength exercises');
      }
      if (exerciseData.reps !== undefined && exerciseData.reps <= 0) {
        throw new Error('Reps must be greater than 0 for strength exercises');
      }
    }

    // Validate distance for cardio exercises
    if (exerciseData.exercise_type === 'Cardio' && exerciseData.distance !== undefined && exerciseData.distance <= 0) {
      throw new Error('Distance must be greater than 0 for cardio exercises');
    }

    // Auto-calculate calories if not provided
    if (!exerciseData.calories_burned && exerciseData.duration_minutes) {
      exerciseData.calories_burned = await this.estimateCaloriesBurned(
        exerciseData.exercise_type,
        exerciseData.duration_minutes,
        exerciseData.intensity || 'Medium',
        { user_weight_kg: 70 } // Default weight, should be fetched from user profile
      );
    }

    return await ExerciseRepository.create(userId, exerciseData);
  }

  // Get exercise by ID
  static async getExerciseById(userId: string, exerciseId: string): Promise<Exercise | null> {
    const exercise = await ExerciseRepository.findById(exerciseId);
    
    if (!exercise || exercise.user_id !== userId) {
      return null;
    }

    return exercise;
  }

  // Get user exercises with filters
  static async getUserExercises(
    userId: string, 
    filters: ExerciseFilters = {}, 
    limit = 50, 
    offset = 0
  ): Promise<Exercise[]> {
    // Validate date filters
    if (filters.date_from && !this.isValidDate(filters.date_from)) {
      throw new Error('Invalid date_from format. Use YYYY-MM-DD');
    }

    if (filters.date_to && !this.isValidDate(filters.date_to)) {
      throw new Error('Invalid date_to format. Use YYYY-MM-DD');
    }

    if (filters.date_from && filters.date_to && new Date(filters.date_from) > new Date(filters.date_to)) {
      throw new Error('date_from must be before or equal to date_to');
    }

    // Validate numeric filters
    if (filters.min_duration !== undefined && filters.min_duration < 0) {
      throw new Error('min_duration must be 0 or greater');
    }

    if (filters.max_duration !== undefined && filters.max_duration < 0) {
      throw new Error('max_duration must be 0 or greater');
    }

    if (filters.min_calories !== undefined && filters.min_calories < 0) {
      throw new Error('min_calories must be 0 or greater');
    }

    if (filters.max_calories !== undefined && filters.max_calories < 0) {
      throw new Error('max_calories must be 0 or greater');
    }

    if (limit <= 0 || limit > 100) {
      throw new Error('limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('offset must be 0 or greater');
    }

    return await ExerciseRepository.getUserExercises(userId, filters, limit, offset);
  }

  // Get exercises by date
  static async getExercisesByDate(userId: string, date: string): Promise<Exercise[]> {
    if (!this.isValidDate(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    return await ExerciseRepository.getUserExercisesByDate(userId, date);
  }

  // Get exercises by date range
  static async getExercisesByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<Exercise[]> {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Start date must be before or equal to end date');
    }

    return await ExerciseRepository.getUserExercisesByDateRange(userId, startDate, endDate);
  }

  // Update exercise
  static async updateExercise(
    userId: string, 
    exerciseId: string, 
    updateData: UpdateExercisePayload
  ): Promise<Exercise> {
    // Check if exercise belongs to user
    const isUserExercise = await ExerciseRepository.isUserExercise(userId, exerciseId);
    if (!isUserExercise) {
      throw new Error('Exercise not found or does not belong to user');
    }

    // Validate exercise time format if provided
    if (updateData.exercise_time && !this.isValidTime(updateData.exercise_time)) {
      throw new Error('Invalid exercise time format. Use HH:MM');
    }

    // Validate duration
    if (updateData.duration_minutes !== undefined && updateData.duration_minutes <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    // Validate calories
    if (updateData.calories_burned !== undefined && updateData.calories_burned < 0) {
      throw new Error('Calories burned must be 0 or greater');
    }

    // Validate weight
    if (updateData.weight_kg !== undefined && updateData.weight_kg <= 0) {
      throw new Error('Weight must be greater than 0');
    }

    // Validate sets and reps
    if (updateData.sets !== undefined && updateData.sets <= 0) {
      throw new Error('Sets must be greater than 0');
    }

    if (updateData.reps !== undefined && updateData.reps <= 0) {
      throw new Error('Reps must be greater than 0');
    }

    // Validate distance
    if (updateData.distance !== undefined && updateData.distance <= 0) {
      throw new Error('Distance must be greater than 0');
    }

    return await ExerciseRepository.update(exerciseId, updateData);
  }

  // Delete exercise
  static async deleteExercise(userId: string, exerciseId: string): Promise<void> {
    // Check if exercise belongs to user
    const isUserExercise = await ExerciseRepository.isUserExercise(userId, exerciseId);
    if (!isUserExercise) {
      throw new Error('Exercise not found or does not belong to user');
    }

    await ExerciseRepository.delete(exerciseId);
  }

  // Get exercise statistics
  static async getExerciseStatistics(
    userId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ExerciseStatistics> {
    if (startDate && !this.isValidDate(startDate)) {
      throw new Error('Invalid start date format. Use YYYY-MM-DD');
    }

    if (endDate && !this.isValidDate(endDate)) {
      throw new Error('Invalid end date format. Use YYYY-MM-DD');
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error('Start date must be before or equal to end date');
    }

    return await ExerciseRepository.getUserExerciseStatistics(userId, startDate, endDate);
  }

  // Get daily exercise summary
  static async getDailyExerciseSummary(userId: string, date: string): Promise<DailyExerciseSummary> {
    if (!this.isValidDate(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    return await ExerciseRepository.getDailyExerciseSummary(userId, date);
  }

  // Get exercise performance metrics
  static async getExercisePerformanceMetrics(
    userId: string, 
    exerciseName: string
  ): Promise<ExercisePerformanceMetrics> {
    if (!exerciseName || exerciseName.trim().length === 0) {
      throw new Error('Exercise name is required');
    }

    return await ExerciseRepository.getExercisePerformanceMetrics(userId, exerciseName.trim());
  }

  // Get exercise recommendations
  static async getExerciseRecommendations(
    userId: string, 
    criteria: ExerciseRecommendationCriteria
  ): Promise<ExerciseRecommendation[]> {
    const recommendations: ExerciseRecommendation[] = [];

    // Get user's recent exercises to avoid repetition
    const recentExercises = await ExerciseRepository.getUserExercises(
      userId, 
      { date_from: this.getDateDaysAgo(7) }, 
      20
    );
    
    const recentExerciseNames = recentExercises.map(e => e.exercise_name.toLowerCase());

    // Base recommendations based on exercise type and fitness goal
    const baseRecommendations = this.getBaseRecommendations(criteria);

    for (const baseRec of baseRecommendations) {
      // Skip if exercise was done recently and user wants variety
      if (criteria.previous_exercises?.includes(baseRec.exercise_name) ||
          recentExerciseNames.includes(baseRec.exercise_name.toLowerCase())) {
        continue;
      }

      // Skip if exercise type doesn't match criteria
      if (criteria.exercise_type && baseRec.exercise_type !== criteria.exercise_type) {
        continue;
      }

      // Skip if exercise name is in exclude list
      if (criteria.exclude_exercises?.some((excluded: string) => 
        excluded.toLowerCase() === baseRec.exercise_name.toLowerCase())) {
        continue;
      }

      // Adjust recommendation based on available duration
      if (criteria.available_duration_minutes) {
        const currentDuration = baseRec.recommended_duration_minutes || baseRec.recommended_duration || 30;
        baseRec.recommended_duration_minutes = Math.min(
          currentDuration,
          criteria.available_duration_minutes
        );
        baseRec.recommended_duration = baseRec.recommended_duration_minutes;
        
        // Recalculate calories based on adjusted duration
        baseRec.estimated_calories_burned = await this.estimateCaloriesBurned(
          baseRec.exercise_type,
          baseRec.recommended_duration_minutes || 30,
          baseRec.recommended_intensity,
          { user_weight_kg: 70 } // Should be fetched from user profile
        );
      }

      // Adjust intensity based on preference
      if (criteria.preferred_intensity) {
        baseRec.recommended_intensity = criteria.preferred_intensity;
      }

      // Calculate match score
      baseRec.match_score = this.calculateMatchScore(baseRec, criteria);

      recommendations.push(baseRec);
    }

    // Sort by match score and return top recommendations
    return recommendations
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
      .slice(0, 10);
  }

  // Get popular exercises
  static async getPopularExercises(): Promise<{exercise_name: string; usage_count: number}[]> {
    return await ExerciseRepository.getPopularExercises();
  }

  // Estimate calories burned
  static async estimateCaloriesBurned(
    exerciseType: string,
    durationMinutes: number,
    intensity: string,
    factors: CalorieBurnFactors
  ): Promise<number> {
    // MET (Metabolic Equivalent) values for different exercise types and intensities
    const metValues: { [key: string]: { [key: string]: number } } = {
      'Cardio': {
        'Low': 3.5,
        'Medium': 6.0,
        'High': 8.5,
        'Very High': 11.0
      },
      'Strength': {
        'Low': 3.0,
        'Medium': 5.0,
        'High': 6.5,
        'Very High': 8.0
      },
      'Flexibility': {
        'Low': 2.5,
        'Medium': 3.0,
        'High': 3.5,
        'Very High': 4.0
      },
      'Sports': {
        'Low': 4.0,
        'Medium': 7.0,
        'High': 10.0,
        'Very High': 12.0
      },
      'Other': {
        'Low': 3.0,
        'Medium': 5.0,
        'High': 7.0,
        'Very High': 9.0
      }
    };

    const met = metValues[exerciseType]?.[intensity] || 5.0;
    
    // Calories = MET × weight (kg) × duration (hours)
    const weight = factors.user_weight_kg || 70; // Default 70kg if not provided
    const calories = met * weight * (durationMinutes / 60);
    
    // Apply age and gender adjustments
    let adjustmentFactor = 1.0;
    
    if (factors.age && factors.age > 40) {
      adjustmentFactor *= 0.95; // Slightly lower burn rate for older adults
    }
    
    if (factors.gender === 'Female') {
      adjustmentFactor *= 0.9; // Generally lower metabolic rate
    }

    if (factors.fitness_level === 'Advanced') {
      adjustmentFactor *= 1.1; // Higher efficiency
    } else if (factors.fitness_level === 'Beginner') {
      adjustmentFactor *= 0.9; // Lower efficiency
    }

    return Math.round(calories * adjustmentFactor);
  }

  // Helper methods
  private static isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private static isValidTime(timeString: string): boolean {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeString);
  }

  private static getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private static getBaseRecommendations(criteria: ExerciseRecommendationCriteria): ExerciseRecommendation[] {
    // This is a simplified recommendation system
    // In a real application, this would be more sophisticated with ML or a comprehensive database
    
    const recommendations: ExerciseRecommendation[] = [];

    // Cardio recommendations
    if (!criteria.exercise_type || criteria.exercise_type === 'Cardio') {
      recommendations.push({
        exercise_name: 'Brisk Walking',
        exercise_type: 'Cardio',
        recommended_duration: 30,
        recommended_duration_minutes: 30,
        calories_estimate: 150,
        estimated_calories_burned: 150,
        recommended_intensity: 'Medium',
        description: 'A low-impact cardiovascular exercise suitable for all fitness levels',
        instructions: [
          'Maintain a pace where you can still hold a conversation',
          'Keep your posture upright',
          'Land on your heel and roll through to your toes',
          'Swing your arms naturally'
        ],
        benefits: ['Improves cardiovascular health', 'Burns calories', 'Low impact on joints', 'Accessible anywhere'],
        equipment_needed: ['Comfortable walking shoes'],
        difficulty_level: 'Beginner',
        muscle_groups: ['Legs', 'Core'],
        match_score: 85
      });

      recommendations.push({
        exercise_name: 'Running',
        exercise_type: 'Cardio',
        recommended_duration: 25,
        recommended_duration_minutes: 25,
        calories_estimate: 250,
        estimated_calories_burned: 250,
        recommended_intensity: 'High',
        description: 'High-intensity cardiovascular exercise for building endurance and burning calories',
        instructions: [
          'Start with a 5-minute warm-up walk',
          'Maintain a steady pace',
          'Focus on your breathing rhythm',
          'Cool down with a 5-minute walk'
        ],
        benefits: ['High calorie burn', 'Improves cardiovascular endurance', 'Strengthens leg muscles', 'Boosts mental health'],
        equipment_needed: ['Running shoes', 'Comfortable athletic wear'],
        difficulty_level: 'Intermediate',
        muscle_groups: ['Legs', 'Core', 'Cardiovascular system'],
        match_score: 80
      });

      recommendations.push({
        exercise_name: 'Cycling',
        exercise_type: 'Cardio',
        recommended_duration: 35,
        recommended_duration_minutes: 35,
        calories_estimate: 200,
        estimated_calories_burned: 200,
        recommended_intensity: 'Medium',
        description: 'Low-impact cycling exercise that builds leg strength and cardiovascular fitness',
        instructions: [
          'Adjust seat height properly',
          'Maintain steady pedaling rhythm',
          'Keep your core engaged',
          'Vary resistance or terrain for challenge'
        ],
        benefits: ['Low impact on joints', 'Builds leg strength', 'Improves cardiovascular health', 'Can be done indoors or outdoors'],
        equipment_needed: ['Bicycle or stationary bike', 'Helmet (for outdoor cycling)'],
        difficulty_level: 'Beginner',
        muscle_groups: ['Legs', 'Core'],
        match_score: 75
      });
    }

    // Strength recommendations
    if (!criteria.exercise_type || criteria.exercise_type === 'Strength') {
      recommendations.push({
        exercise_name: 'Push-ups',
        exercise_type: 'Strength',
        recommended_duration: 15,
        recommended_duration_minutes: 15,
        calories_estimate: 70,
        estimated_calories_burned: 70,
        recommended_intensity: 'Medium',
        recommended_sets: 3,
        recommended_reps: 12,
        description: 'Bodyweight exercise targeting chest, shoulders, and triceps',
        instructions: [
          'Start in plank position with hands shoulder-width apart',
          'Lower your body until chest nearly touches the floor',
          'Push back up to starting position',
          'Keep your body in a straight line throughout'
        ],
        benefits: ['Builds upper body strength', 'Improves core stability', 'No equipment needed', 'Multiple variations available'],
        equipment_needed: ['None (bodyweight)'],
        difficulty_level: 'Beginner',
        muscle_groups: ['Chest', 'Shoulders', 'Triceps', 'Core'],
        match_score: 85
      });

      recommendations.push({
        exercise_name: 'Squats',
        exercise_type: 'Strength',
        recommended_duration: 15,
        recommended_duration_minutes: 15,
        calories_estimate: 80,
        estimated_calories_burned: 80,
        recommended_intensity: 'Medium',
        recommended_sets: 3,
        recommended_reps: 15,
        description: 'Fundamental lower body exercise targeting quadriceps, glutes, and core',
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower your body as if sitting in a chair',
          'Keep your chest up and knees behind toes',
          'Push through your heels to return to standing'
        ],
        benefits: ['Builds lower body strength', 'Improves functional movement', 'Burns calories', 'Strengthens core'],
        equipment_needed: ['None (bodyweight)', 'Optional: Dumbbells or barbell'],
        difficulty_level: 'Beginner',
        muscle_groups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
        match_score: 80
      });

      recommendations.push({
        exercise_name: 'Plank',
        exercise_type: 'Strength',
        recommended_duration: 10,
        recommended_duration_minutes: 10,
        calories_estimate: 50,
        estimated_calories_burned: 50,
        recommended_intensity: 'Medium',
        description: 'Isometric core strengthening exercise',
        instructions: [
          'Start in push-up position but on forearms',
          'Keep your body in a straight line from head to heels',
          'Engage your core and hold the position',
          'Breathe normally throughout the hold'
        ],
        benefits: ['Builds core strength', 'Improves posture', 'Enhances stability', 'Low impact'],
        equipment_needed: ['Exercise mat (optional)'],
        difficulty_level: 'Beginner',
        muscle_groups: ['Core', 'Shoulders', 'Back'],
        match_score: 75
      });
    }

    // Flexibility recommendations
    if (!criteria.exercise_type || criteria.exercise_type === 'Flexibility') {
      recommendations.push({
        exercise_name: 'Full Body Stretching',
        exercise_type: 'Flexibility',
        recommended_duration: 20,
        recommended_duration_minutes: 20,
        calories_estimate: 60,
        estimated_calories_burned: 60,
        recommended_intensity: 'Low',
        description: 'Comprehensive stretching routine to improve flexibility and mobility',
        instructions: [
          'Hold each stretch for 15-30 seconds',
          'Breathe deeply and relax into each position',
          'Never bounce or force a stretch',
          'Focus on major muscle groups'
        ],
        benefits: ['Improves flexibility', 'Reduces muscle tension', 'Enhances recovery', 'Promotes relaxation'],
        equipment_needed: ['Exercise mat (optional)'],
        difficulty_level: 'Beginner',
        muscle_groups: ['Full body'],
        match_score: 70
      });
    }

    return recommendations;
  }

  private static calculateMatchScore(
    recommendation: ExerciseRecommendation, 
    criteria: ExerciseRecommendationCriteria
  ): number {
    let score = 50; // Base score

    // Fitness goal alignment
    if (criteria.fitness_goal) {
      if (criteria.fitness_goal === 'Reduce Fat' && recommendation.exercise_type === 'Cardio') {
        score += 20;
      } else if (criteria.fitness_goal === 'Build Muscle' && recommendation.exercise_type === 'Strength') {
        score += 20;
      } else if (criteria.fitness_goal === 'General Fitness') {
        score += 10; // All exercises are somewhat beneficial
      }
    }

    // Duration match
    if (criteria.available_duration_minutes) {
      const durationDiff = Math.abs((recommendation.recommended_duration_minutes || recommendation.recommended_duration) - criteria.available_duration_minutes);
      if (durationDiff <= 5) score += 15;
      else if (durationDiff <= 15) score += 10;
      else if (durationDiff <= 30) score += 5;
    }

    // Intensity match
    if (criteria.preferred_intensity && recommendation.recommended_intensity === criteria.preferred_intensity) {
      score += 15;
    }

    // Equipment availability
    if (criteria.equipment_available) {
      const hasRequiredEquipment = recommendation.equipment_needed.every((equipment: string) => 
        criteria.equipment_available!.includes(equipment) || equipment === 'None (bodyweight)'
      );
      if (hasRequiredEquipment) {
        score += 10;
      } else {
        score -= 20; // Penalize if equipment is not available
      }
    }

    // User fitness level
    if (criteria.user_fitness_level) {
      if (recommendation.difficulty_level === criteria.user_fitness_level) {
        score += 10;
      } else if (
        (criteria.user_fitness_level === 'Beginner' && recommendation.difficulty_level === 'Intermediate') ||
        (criteria.user_fitness_level === 'Intermediate' && recommendation.difficulty_level === 'Advanced')
      ) {
        score += 5; // Slightly challenging is good
      } else if (
        (criteria.user_fitness_level === 'Intermediate' && recommendation.difficulty_level === 'Beginner') ||
        (criteria.user_fitness_level === 'Advanced' && recommendation.difficulty_level === 'Intermediate')
      ) {
        score -= 5; // Too easy
      } else {
        score -= 10; // Too difficult or too easy
      }
    }

    // Calorie target
    if (criteria.target_calories) {
      const calorieDiff = Math.abs((recommendation.estimated_calories_burned || recommendation.calories_estimate) - criteria.target_calories);
      const percentageDiff = (calorieDiff / criteria.target_calories) * 100;
      if (percentageDiff <= 10) score += 15;
      else if (percentageDiff <= 25) score += 10;
      else if (percentageDiff <= 50) score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }
}