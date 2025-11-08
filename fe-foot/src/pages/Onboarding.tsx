import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import type { DietPref, Goal, UserProfile } from "../types";
import { useAppStore } from "../store/useAppStore";

export default function Onboarding() {
  const { completeOnboarding } = useAppStore();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const profile: UserProfile = {
      name: fd.get("name")?.toString() || "User",
      goal: fd.get("goal") as Goal,
      diet: fd.get("diet") as DietPref,
      budgetPerMeal: Number(fd.get("budget")),
      timePerWorkout: Number(fd.get("time")),
      needsOnboarding: false
    };
    completeOnboarding(profile);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="Onboarding">
        <form onSubmit={submit} className="grid-form">
          <label className="block">
            <div className="text-sm mb-1">Tên</div>
            <Input name="name" defaultValue="User" />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Mục tiêu</div>
            <Select name="goal" defaultValue="maintain">
              <option value="lose_fat">Giảm mỡ</option>
              <option value="gain_muscle">Tăng cơ</option>
              <option value="maintain">Duy trì</option>
              <option value="endurance">Sức bền</option>
            </Select>
          </label>
          <label className="block">
            <div className="text-sm mb-1">Chế độ ăn</div>
            <Select name="diet" defaultValue="balanced">
              <option value="balanced">Balanced</option>
              <option value="low_carb">Low-carb</option>
              <option value="keto">Keto</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </Select>
          </label>
          <label className="block">
            <div className="text-sm mb-1">Ngân sách / bữa (VND)</div>
            <Input name="budget" type="number" defaultValue={90000} />
          </label>
          <label className="block">
            <div className="text-sm mb-1">Thời gian / buổi tập (phút)</div>
            <Input name="time" type="number" defaultValue={30} />
          </label>

          <div className="col-span-full mt-2">
            <Button type="submit">Hoàn tất</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
