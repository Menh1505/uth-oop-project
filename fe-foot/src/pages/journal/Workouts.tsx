
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";

export default function Workouts() {
  const { workouts, addWorkout } = useAppStore();
  const [workName, setWorkName] = useState("HIIT 30m");
  const [burn, setBurn] = useState(280);
  const [dur, setDur] = useState(30);

  return (
    <Card title="Ghi buổi tập">
      <div className="grid-form">
        <label className="block">
          <div className="text-sm mb-1">Tên bài tập</div>
          <Input value={workName} onChange={e => setWorkName(e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Calories đốt</div>
          <Input type="number" value={burn} onChange={e => setBurn(Number(e.target.value))} />
        </label>
        <label className="block">
          <div className="text-sm mb-1">Thời lượng (phút)</div>
          <Input type="number" value={dur} onChange={e => setDur(Number(e.target.value))} />
        </label>
      </div>
      <div className="mt-3">
        <Button onClick={() => addWorkout({ name: workName, caloriesBurned: burn, durationMin: dur })}>
          Thêm buổi tập
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {workouts.map(w => (
          <li key={w.id} className="flex justify-between border-b border-gray-100 py-2">
            <span><b>{w.name}</b> — -{w.caloriesBurned} kcal · {w.durationMin} phút</span>
            <span className="text-sm text-gray-500">{new Date(w.time).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}