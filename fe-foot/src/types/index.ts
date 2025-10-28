export type Goal = "lose_fat" | "gain_muscle" | "maintain" | "endurance";
export type DietPref = "balanced" | "low_carb" | "keto" | "vegetarian" | "vegan";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled";

export type UserProfile = {
  name: string;
  goal: Goal;
  diet: DietPref;
  budgetPerMeal: number; // VND
  timePerWorkout: number; // min
  username?: string;
  role?: string;
  needsOnboarding: boolean;
};

export type MealLog = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string; // ISO
};

export type WorkoutLog = {
  id: string;
  name: string;
  caloriesBurned: number;
  durationMin: number;
  time: string; // ISO
};

export type MenuItem = {
  id: string;
  name: string;
  price: number; // VND
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type CartItem = {
  item: MenuItem;
  qty: number;
};

export type Order = {
  id: string;
  items: CartItem[];
  total: number; // VND
  status: OrderStatus;
  createdAt: string; // ISO
};
