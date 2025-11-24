export type MealLoggedEvent = {
  userId: string;
  mealId: string;
  loggedAt: string;
  totalCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
};

export type WorkoutLoggedEvent = {
  userId: string;
  workoutSessionId: string;
  startedAt: string;
  durationMinutes: number;
  caloriesBurned: number;
  workoutType: string;
};

export type GoalUpdatedEvent = {
  userId: string;
  goalId: string;
  goalType: string;
  targetWeight?: number;
  targetDailyCalories?: number;
  startDate?: string;
  endDate?: string;
  status: string;
};

export type BodyMetricsUpdatedEvent = {
  userId: string;
  weight: number;
  height?: number;
  recordedAt: string;
};
