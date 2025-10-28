import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";

export default function Meals() {
  const { meals, addMeal } = useAppStore();
  const [mealName, setMealName] = useState("Chicken Bowl");
  const [mealCal, setMealCal] = useState(520);
  const [p, setP] = useState(40);
  const [c, setC] = useState(45);
  const [f, setF] = useState(15);

  const handleScan = (file?: File) => {
    if (!file) return;
    addMeal({ name: `Scanned: ${file.name}`, calories: 400, protein: 20, carbs: 50, fat: 10 });
    alert("Đã quét & thêm bữa ăn (mock)!");
  };

  return (
    <Card title="Ghi bữa ăn">
      <div className="grid-form">
        <label className="block">
          <div className="text-sm mb-1">Tên</div>
          <Input value={mealName} onChange={e => setMealName(e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Calories</div>
          <Input type="number" value={mealCal} onChange={e => setMealCal(Number(e.target.value))} />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Protein (g)</div>
          <Input type="number" value={p} onChange={e => setP(Number(e.target.value))} />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Carbs (g)</div>
          <Input type="number" value={c} onChange={e => setC(Number(e.target.value))} />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Fat (g)</div>
          <Input type="number" value={f} onChange={e => setF(Number(e.target.value))} />
        </label>
      </div>
      <div className="mt-3 flex gap-3">
        <Button onClick={() => addMeal({ name: mealName, calories: mealCal, protein: p, carbs: c, fat: f })}>
          Thêm bữa ăn
        </Button>
        <label className="btn btn-ghost cursor-pointer">
          Quét barcode/ảnh
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleScan(e.target.files?.[0] || undefined)} />
        </label>
      </div>
      <ul className="mt-4 space-y-2">
        {meals.map(m => (
          <li key={m.id} className="flex justify-between border-b border-gray-100 py-2">
            <span><b>{m.name}</b> — {m.calories} kcal · P{m.protein}/C{m.carbs}/F{m.fat}</span>
            <span className="text-sm text-gray-500">{new Date(m.time).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
