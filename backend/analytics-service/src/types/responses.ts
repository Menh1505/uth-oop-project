export type DailyHealthSummary = {
  date: string;
  caloriesIn: number;
  caloriesOut: number;
  calorieBalance: number;
  calorieTarget: number;
  mealsLoggedCount: number;
  workoutsLoggedCount: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  proteinPercentage: number;
  carbPercentage: number;
  fatPercentage: number;
  healthScore: number;
};

export type MacroBreakdown = {
  proteinPercentage: number;
  carbPercentage: number;
  fatPercentage: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
};

export type WorkoutWeekSummary = {
  weekStart: string;
  sessions: number;
  minutes: number;
};

export type WeightTrendPoint = {
  date: string;
  weight: number;
};

export type HealthSummaryResponse = {
  userId: string;
  from: string;
  to: string;
  daily: DailyHealthSummary[];
  averages: {
    caloriesIn: number;
    caloriesOut: number;
    calorieBalance: number;
    healthScore: number;
  };
  macroBreakdown: MacroBreakdown;
  workoutSessionsPerWeek: WorkoutWeekSummary[];
  insights: string[];
  weightTrend: WeightTrendPoint[];
};

export type HabitScoreDaily = {
  date: string;
  healthScore: number;
  mealLoggingStreakDays: number;
  workoutLoggingStreakDays: number;
};

export type HabitScoreResponse = {
  userId: string;
  from: string;
  to: string;
  daily: HabitScoreDaily[];
  summary: {
    averageHealthScore: number;
    bestDay?: HabitScoreDaily;
    worstDay?: HabitScoreDaily;
    mealLoggingStreakDays: number;
    workoutLoggingStreakDays: number;
  };
};
