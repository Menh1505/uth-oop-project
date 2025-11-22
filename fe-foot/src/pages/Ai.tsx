import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAppStore } from "../store/useAppStore";
import { useState, useEffect } from "react";
import { ApiClient } from "../lib/api/client";

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  calories?: number;
  durationMin?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export default function Ai() {
  const { profile, addMeal, addWorkout } = useAppStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      fetchRecommendations();
    }
  }, [profile]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = (profile as any)?.id ?? (profile as any)?.userId ?? 0;
      // Backend recommendation-service exposes GET /recommendations/daily/:userId
      const res: any = await ApiClient.get(`/recommendations/daily/${userId}`);
      const rec = res?.recommendation || res?.recommendations || [];
      const mapped: Recommendation[] = Array.isArray(rec)
        ? rec
        : [
            {
              id: String(rec.recommendation_id || "rec_1"),
              type: rec.type || "meal",
              title: rec.title || "Gợi ý bữa ăn",
              description: rec.content || "",
              calories: rec.calories,
              protein: rec.protein,
              carbs: rec.carbs,
              fat: rec.fat,
            },
          ];
      setRecommendations(mapped || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải gợi ý");
      useMockSuggestions();
    } finally {
      setLoading(false);
    }
  };

  const useMockSuggestions = () => {
    if (!profile) return;
    const cheap = (profile as any).budgetPerMeal < 90000;
    const baseMeal =
      (profile as any).diet === "vegan"
        ? { name: "Vegan Protein Bowl", calories: 520, protein: 28, carbs: 65, fat: 12 }
        : { name: "Chicken Brown Rice", calories: 550, protein: 40, carbs: 55, fat: 14 };
    const meal = cheap ? { ...baseMeal, name: baseMeal.name + " (Budget)" } : baseMeal;

    let workout = { name: "Full-body 30m", caloriesBurned: 250, durationMin: 30 };
    if ((profile as any).goal === "gain_muscle") workout = { name: "Strength 30m", caloriesBurned: 180, durationMin: 30 };
    if ((profile as any).goal === "lose_fat") workout = { name: "HIIT 30m", caloriesBurned: 300, durationMin: 30 };
    if ((profile as any).goal === "endurance") workout = { name: "Zone2 30m", caloriesBurned: 240, durationMin: 30 };

    setRecommendations([
      {
        id: "meal_1",
        type: "meal",
        title: meal.name,
        description: `${meal.calories} kcal · P${meal.protein}/C${meal.carbs}/F${meal.fat}`,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      },
      {
        id: "workout_1",
        type: "workout",
        title: workout.name,
        description: `~${workout.caloriesBurned} kcal đốt`,
        calories: workout.caloriesBurned,
        durationMin: workout.durationMin,
      },
    ]);
  };

  const mealRec = recommendations.find((r) => r.type === "meal");
  const workoutRec = recommendations.find((r) => r.type === "workout");

  if (!profile) return null;

  return (
    <div className="grid-2">
      <Card title="Ăn gì trưa nay?">
        {error && <div className="text-yellow-700 text-xs mb-2">Lỗi: {error}</div>}
        {loading ? (
          <div className="text-gray-500">Đang tải gợi ý...</div>
        ) : mealRec ? (
          <>
            <p className="text-sm text-gray-700 mb-3">
              <b>{mealRec.title}</b> — {mealRec.description}
            </p>
            <Button
              onClick={() =>
                addMeal({
                  name: mealRec.title,
                  calories: mealRec.calories || 0,
                  protein: mealRec.protein || 0,
                  carbs: mealRec.carbs || 0,
                  fat: mealRec.fat || 0,
                })
              }
            >
              Thêm vào Journal
            </Button>
          </>
        ) : (
          <p className="text-sm text-gray-500">Không có gợi ý</p>
        )}
      </Card>

      <Card title="Tập gì trong 30 phút?">
        {error && <div className="text-yellow-700 text-xs mb-2">Lỗi: {error}</div>}
        {loading ? (
          <div className="text-gray-500">Đang tải gợi ý...</div>
        ) : workoutRec ? (
          <>
            <p className="text-sm text-gray-700 mb-3">
              <b>{workoutRec.title}</b> — {workoutRec.description}
            </p>
            <Button
              onClick={() =>
                addWorkout({
                  name: workoutRec.title,
                  caloriesBurned: workoutRec.calories || 0,
                  durationMin: workoutRec.durationMin || 30,
                })
              }
            >
              Thêm vào Journal
            </Button>
          </>
        ) : (
          <p className="text-sm text-gray-500">Không có gợi ý</p>
        )}
      </Card>
    </div>
  );
}
