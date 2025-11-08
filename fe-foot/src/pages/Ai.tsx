import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAppStore } from "../store/useAppStore";
import { useMemo } from "react";

export default function Ai() {
  const { profile, addMeal, addWorkout } = useAppStore();

  const suggestion = useMemo(() => {
    if (!profile) return null;
    const cheap = profile.budgetPerMeal < 90000;
    const baseMeal =
      profile.diet === "vegan"
        ? { name: "Vegan Protein Bowl", calories: 520, protein: 28, carbs: 65, fat: 12 }
        : { name: "Chicken Brown Rice", calories: 550, protein: 40, carbs: 55, fat: 14 };
    const meal = cheap ? { ...baseMeal, name: baseMeal.name + " (Budget)" } : baseMeal;

    let workout = { name: "Full-body 30m", caloriesBurned: 250, durationMin: 30 };
    if (profile.goal === "gain_muscle") workout = { name: "Strength 30m", caloriesBurned: 180, durationMin: 30 };
    if (profile.goal === "lose_fat") workout = { name: "HIIT 30m", caloriesBurned: 300, durationMin: 30 };
    if (profile.goal === "endurance") workout = { name: "Zone2 30m", caloriesBurned: 240, durationMin: 30 };

    return { meal, workout };
  }, [profile]);

  if (!profile || !suggestion) return null;

  return (
    <div className="grid-2">
      <Card title="Ăn gì trưa nay?">
        <p className="text-sm text-gray-700 mb-3">
          <b>{suggestion.meal.name}</b> — {suggestion.meal.calories} kcal · P{suggestion.meal.protein}/C{suggestion.meal.carbs}/F{suggestion.meal.fat}
        </p>
        <Button onClick={() => addMeal(suggestion.meal)}>Thêm vào Journal</Button>
      </Card>

      <Card title="Tập gì trong 30 phút?">
        <p className="text-sm text-gray-700 mb-3">
          <b>{suggestion.workout.name}</b> — ~{suggestion.workout.caloriesBurned} kcal
        </p>
        <Button onClick={() => addWorkout(suggestion.workout)}>Thêm vào Journal</Button>
      </Card>
    </div>
  );
}
