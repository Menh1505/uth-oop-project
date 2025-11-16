import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAppStore } from "../store/useAppStore";
import { useEffect, useState } from "react";
import type { Goal, DietPref, UserProfile } from "../types";
import { ApiClient } from "../lib/api/client";

interface ProfileFormState {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  goal: Goal;
  diet: DietPref;
  budgetPerMeal: number;
  timePerWorkout: number;
}

export default function ProfilePage() {
  const { profile, completeOnboarding } = useAppStore();
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    // Khởi tạo form từ profile hiện tại
    setForm({
      fullName: profile.name,
      email: profile.username || "",
      phone: profile.phone || "",
      bio: profile.bio || "",
      goal: profile.goal,
      diet: profile.diet,
      budgetPerMeal: profile.budgetPerMeal,
      timePerWorkout: profile.timePerWorkout,
    });
  }, [profile]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profile) return;
      try {
        setLoading(true);
        setError(null);
        // Thử lấy thông tin chi tiết từ backend nếu có
        const data = await ApiClient.get<any>("/users/me");
        setForm((prev) => ({
          fullName: data.profile?.full_name || prev?.fullName || profile.name,
          email: data.email || prev?.email || profile.username || "",
          phone: data.profile?.phone || prev?.phone || profile.phone || "",
          bio: data.profile?.bio || prev?.bio || profile.bio || "",
          goal: prev?.goal ?? profile.goal,
          diet: prev?.diet ?? profile.diet,
          budgetPerMeal: prev?.budgetPerMeal ?? profile.budgetPerMeal,
          timePerWorkout: prev?.timePerWorkout ?? profile.timePerWorkout,
        }));
      } catch (err) {
        // Nếu lỗi thì vẫn dùng dữ liệu từ store
        console.warn("Fetch /users/me failed, using local profile only", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profile]);

  if (!profile || !form) {
    return (
      <Card title="Hồ sơ cá nhân">
        <div className="text-sm text-gray-500">Đang tải hồ sơ...</div>
      </Card>
    );
  }

  const handleChange = (field: keyof ProfileFormState, value: string | number) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: any = {
        full_name: form.fullName,
        phone: form.phone || null,
        bio: form.bio || "",
        // Các trường này hiện chưa có schema backend rõ ràng,
        // nhưng có thể được map vào preferences trong tương lai.
        preferences: {
          goal: form.goal,
          diet: form.diet,
          budget_per_meal: form.budgetPerMeal,
          time_per_workout: form.timePerWorkout,
        },
      };

      await ApiClient.put("/users/me", payload);

      // Cập nhật lại profile trong store để các màn khác dùng
      const updated: UserProfile = {
        ...profile,
        name: form.fullName || profile.name,
        phone: form.phone || profile.phone,
        bio: form.bio || profile.bio,
        goal: form.goal,
        diet: form.diet,
        budgetPerMeal: form.budgetPerMeal,
        timePerWorkout: form.timePerWorkout,
      };
      completeOnboarding(updated);

      setSuccess("Đã lưu hồ sơ thành công.");
    } catch (err: any) {
      console.error("Update profile error:", err);
      setError(err?.message || "Không thể lưu hồ sơ, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Hồ sơ & Mục tiêu sức khỏe">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded text-sm">{success}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Họ và tên</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                value={form.email}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input
                type="tel"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Giới thiệu ngắn</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Ví dụ: muốn giảm 5kg trong 3 tháng, bận rộn, thích ăn chay..."
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Mục tiêu & Thói quen</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mục tiêu chính</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.goal}
                onChange={(e) => handleChange("goal", e.target.value as Goal)}
              >
                <option value="lose_fat">Giảm mỡ</option>
                <option value="gain_muscle">Tăng cơ</option>
                <option value="maintain">Giữ cân</option>
                <option value="endurance">Tăng sức bền</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Chế độ ăn</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.diet}
                onChange={(e) => handleChange("diet", e.target.value as DietPref)}
              >
                <option value="balanced">Cân bằng</option>
                <option value="low_carb">Low-carb</option>
                <option value="keto">Keto</option>
                <option value="vegetarian">Ăn chay (có trứng/sữa)</option>
                <option value="vegan">Thuần chay</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngân sách mỗi bữa (VND)</label>
              <input
                type="number"
                min={0}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.budgetPerMeal}
                onChange={(e) => handleChange("budgetPerMeal", Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thời gian mỗi buổi tập (phút)</label>
              <input
                type="number"
                min={10}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.timePerWorkout}
                onChange={(e) => handleChange("timePerWorkout", Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
