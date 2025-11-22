import Card from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { useAppStore } from "../store/useAppStore";
import { useState, useEffect } from "react";
import { ApiClient } from "../lib/api/client";

interface DailyAnalysis {
  date: string;
  caloriesIn: number;
  caloriesOut: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function Analytics() {
  const { meals, workouts } = useAppStore();
  const [analysis, setAnalysis] = useState<DailyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      // Backend provides: GET /nutrition/daily/:date -> { success, nutrition }
      const today = new Date().toISOString().slice(0, 10);
      const res: any = await ApiClient.get("/nutrition/daily/" + today);
      const n = res?.nutrition || res;

      if (n) {
        const rows: DailyAnalysis[] = [
          {
            date: today,
            caloriesIn: Math.round(n.total_calories || 0),
            caloriesOut: 0,
            protein: Math.round(n.total_protein || 0),
            carbs: Math.round(n.total_carbs || 0),
            fat: Math.round(n.total_fat || 0),
          },
        ];
        setAnalysis(rows);
      } else {
        setAnalysis([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      // Fallback to local calculation
      console.error("Error fetching analytics, using local calc:", err);
      calculateLocal();
    } finally {
      setLoading(false);
    }
  };

  const calculateLocal = () => {
    const map = new Map<string, { in: number; p: number; c: number; f: number; out: number }>();
    const addIn = (k: string, cal: number, p: number, c: number, f: number) => {
      const cur = map.get(k) ?? { in: 0, p: 0, c: 0, f: 0, out: 0 };
      cur.in += cal;
      cur.p += p;
      cur.c += c;
      cur.f += f;
      map.set(k, cur);
    };
    const addOut = (k: string, cal: number) => {
      const cur = map.get(k) ?? { in: 0, p: 0, c: 0, f: 0, out: 0 };
      cur.out += cal;
      map.set(k, cur);
    };
    
    // Use Zustand data as fallback
    if (meals && meals.length > 0) {
      meals.forEach(m => addIn(new Date().toISOString().slice(0, 10), m.calories, m.protein, m.carbs, m.fat));
    }
    if (workouts && workouts.length > 0) {
      workouts.forEach(w => addOut(new Date().toISOString().slice(0, 10), w.caloriesBurned));
    }
    
    const result = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([date, v]) => ({
      date,
      caloriesIn: v.in,
      caloriesOut: v.out,
      protein: v.p,
      carbs: v.c,
      fat: v.f,
    }));
    
    setAnalysis(result);
  };

  const rows = (analysis || []).map((d) => [
    d.date,
    Math.round(d.caloriesIn),
    "-" + Math.round(d.caloriesOut),
    Math.round(d.protein) + " g",
    Math.round(d.carbs) + " g",
    Math.round(d.fat) + " g",
    Math.round(d.caloriesIn - d.caloriesOut) + " kcal",
  ]);

  return (
    <Card title="7-day Summary">
      {error && <div className="bg-yellow-50 text-yellow-700 p-3 rounded mb-4 text-sm">{error} (Sử dụng dữ liệu local)</div>}
      {loading ? (
        <div className="text-center text-gray-500">Đang tải...</div>
      ) : (
        <>
          <Table head={["Ngày", "Kcal in", "Kcal out", "Protein", "Carbs", "Fat", "Balance"]} rows={rows} />
          <p className="text-xs text-gray-500 mt-3">* Có thể thêm biểu đồ sau (Recharts/Chart.js).</p>
        </>
      )}
    </Card>
  );
}
