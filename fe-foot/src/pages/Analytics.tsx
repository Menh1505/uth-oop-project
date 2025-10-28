import Card from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { useAppStore } from "../store/useAppStore";
import { useMemo } from "react";

export default function Analytics() {
  const { meals, workouts } = useAppStore();

  const logsByDay = useMemo(() => {
    const map = new Map<string, { in: number; p: number; c: number; f: number; out: number }>();
    const addIn = (k: string, cal: number, p: number, c: number, f: number) => {
      const cur = map.get(k) ?? { in: 0, p: 0, c: 0, f: 0, out: 0 };
      cur.in += cal; cur.p += p; cur.c += c; cur.f += f; map.set(k, cur);
    };
    const addOut = (k: string, cal: number) => {
      const cur = map.get(k) ?? { in: 0, p: 0, c: 0, f: 0, out: 0 };
      cur.out += cal; map.set(k, cur);
    };
    meals.forEach(m => addIn(m.time.slice(0, 10), m.calories, m.protein, m.carbs, m.fat));
    workouts.forEach(w => addOut(w.time.slice(0, 10), w.caloriesBurned));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([day, v]) => ({ day, ...v }));
  }, [meals, workouts]);

  const rows = logsByDay.map(d => [
    d.day,
    Math.round(d.in),
    "-" + Math.round(d.out),
    Math.round(d.p) + " g",
    Math.round(d.c) + " g",
    Math.round(d.f) + " g",
    Math.round(d.in - d.out) + " kcal",
  ]);

  return (
    <Card title="7-day Summary">
      <Table head={["Ngày", "Kcal in", "Kcal out", "Protein", "Carbs", "Fat", "Balance"]} rows={rows} />
      <p className="text-xs text-gray-500 mt-3">* Có thể thêm biểu đồ sau (Recharts/Chart.js).</p>
    </Card>
  );
}
