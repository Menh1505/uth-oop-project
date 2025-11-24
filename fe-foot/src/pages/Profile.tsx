import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiClient } from "../lib/api/client";
import type { DailySummary, DailySummaryStatus } from "../types";

interface UserData {
  user_id: string;
  name: string;
  email: string;
  gender: string | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  bmi?: number | null;
  bmi_category?: string | null;
  profile_picture_url: string | null;
  is_active: boolean;
  created_at: string;
  email_verified: boolean;
  last_login?: string;
}

interface UserGoalSummary {
  goal_id: string;
  loai_muc_tieu: string;
  can_nang_hien_tai: number;
  can_nang_muc_tieu: number;
  tong_calo_moi_ngay: number;
  so_gio_tap_moi_ngay: number;
  thoi_gian_dat_muc_tieu: number;
  tien_trinh: number;
  trang_thai: string;
}

type MealTypeVi = "Bữa sáng" | "Bữa trưa" | "Bữa tối" | "Ăn vặt";

interface MealEntry {
  id: string;
  ten_mon: string;
  loai_bua_an: MealTypeVi;
  luong_calories: number;
  khoi_luong: number;
  ngay_an: string;
  thoi_gian_an: string;
  ghi_chu?: string | null;
}

const MEAL_TYPE_OPTIONS: MealTypeVi[] = [
  "Bữa sáng",
  "Bữa trưa",
  "Bữa tối",
  "Ăn vặt",
];

const STATUS_STYLES: Record<
  DailySummaryStatus,
  { bg: string; text: string; border: string }
> = {
  "Đạt mục tiêu": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
  "Chưa đạt": {
    bg: "bg-amber-500/10",
    text: "text-amber-200",
    border: "border-amber-500/30",
  },
  "Vượt mức": {
    bg: "bg-red-500/10",
    text: "text-red-200",
    border: "border-red-500/30",
  },
};

const getBmiValue = (data: UserData | null): number | null => {
  if (!data?.weight || !data?.height) {
    return null;
  }
  if (typeof data.bmi === "number") {
    return data.bmi;
  }
  const bmi = data.weight / Math.pow(data.height / 100, 2);
  return Number(bmi.toFixed(1));
};

const getBmiCategory = (
  data: UserData | null,
  bmiValue: number | null
): string | null => {
  if (!bmiValue) return null;
  if (data?.bmi_category) return data.bmi_category;
  if (bmiValue < 18.5) return "Cân nặng thấp (gầy)";
  if (bmiValue < 25) return "Bình thường";
  if (bmiValue < 30) return "Thừa cân";
  return "Béo phì";
};

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});

  const [userGoal, setUserGoal] = useState<UserGoalSummary | null>(null);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSetupVisible, setGoalSetupVisible] = useState(false);
  const [goalSetupWeight, setGoalSetupWeight] = useState<number | null>(null);
  const [goalSetupDuration, setGoalSetupDuration] = useState<number>(8);

  const todayISO = new Date().toISOString().slice(0, 10);
  const [selectedMealDate, setSelectedMealDate] = useState<string>(todayISO);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [mealSummary, setMealSummary] = useState<DailySummary | null>(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealError, setMealError] = useState<string | null>(null);
  const [savingMeal, setSavingMeal] = useState(false);
  const [mealForm, setMealForm] = useState({
    ten_mon: "Cơm gà",
    loai_bua_an: "Bữa trưa" as MealTypeVi,
    luong_calories: "600",
    khoi_luong: "350",
    thoi_gian_an: new Date().toISOString().slice(11, 16),
    ghi_chu: "",
  });
  const bmiValue = getBmiValue(userData);
  const bmiCategory = getBmiCategory(userData, bmiValue);

  const fetchMealsForDate = useCallback(
    async (date: string) => {
      try {
        setMealLoading(true);
        setMealError(null);
        const query = date ? `?date=${date}` : "";
        const data = await ApiClient.get<{
          date: string;
          meals: MealEntry[];
          summary: DailySummary;
        }>(`/meals/me${query}`);

        if (data?.date) {
          setSelectedMealDate((current) =>
            current === data.date ? current : data.date
          );
        }

        const sortedMeals = [...(data?.meals || [])].sort((a, b) =>
          `${a.thoi_gian_an}`.localeCompare(`${b.thoi_gian_an}`)
        );
        setMeals(sortedMeals);
        setMealSummary(data?.summary ?? null);
      } catch (error: any) {
        console.error("Failed to fetch meals:", error);
        setMealError(error?.message || "Không thể tải danh sách bữa ăn");
      } finally {
        setMealLoading(false);
      }
    },
    []
  );

  const handleMealFormChange = (field: keyof typeof mealForm, value: string) => {
    setMealForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateMealEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mealForm.ten_mon.trim()) {
      setMealError("Vui lòng nhập tên món ăn");
      return;
    }

    const calories = Number(mealForm.luong_calories);
    const weight = Number(mealForm.khoi_luong);
    if (!Number.isFinite(calories) || calories <= 0) {
      setMealError("Calories phải lớn hơn 0");
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      setMealError("Khối lượng phải lớn hơn 0");
      return;
    }

    setSavingMeal(true);
    setMealError(null);
    try {
      await ApiClient.post("/meals", {
        ten_mon: mealForm.ten_mon.trim(),
        loai_bua_an: mealForm.loai_bua_an,
        luong_calories: calories,
        khoi_luong: weight,
        ngay_an: selectedMealDate,
        thoi_gian_an: mealForm.thoi_gian_an,
        ghi_chu: mealForm.ghi_chu?.trim() || undefined,
      });
      setMealForm((prev) => ({
        ...prev,
        ten_mon: "Cơm gà",
        luong_calories: "600",
        khoi_luong: "350",
        ghi_chu: "",
      }));
      await fetchMealsForDate(selectedMealDate);
    } catch (error: any) {
      console.error("Create meal error:", error);
      setMealError(error?.message || "Không thể thêm món ăn");
    } finally {
      setSavingMeal(false);
    }
  };

  const handleEditMeal = async (meal: MealEntry) => {
    const ten_mon =
      window.prompt("Tên món ăn", meal.ten_mon)?.trim() || meal.ten_mon;
    const calInput = window.prompt(
      "Lượng calories (kcal)",
      String(meal.luong_calories)
    );
    if (calInput === null) return;
    const luong_calories = Number(calInput);
    if (!Number.isFinite(luong_calories) || luong_calories <= 0) {
      alert("Calories không hợp lệ");
      return;
    }

    try {
      await ApiClient.put(`/meals/${meal.id}`, {
        ten_mon,
        luong_calories,
      });
      await fetchMealsForDate(selectedMealDate);
    } catch (error: any) {
      console.error("Update meal error:", error);
      alert(error?.message || "Không thể cập nhật món ăn");
    }
  };

  const handleDeleteMeal = async (mealId: string, name: string) => {
    if (!window.confirm(`Xoá món "${name}" khỏi ngày này?`)) return;
    try {
      await ApiClient.delete(`/meals/${mealId}`);
      await fetchMealsForDate(selectedMealDate);
    } catch (error: any) {
      console.error("Delete meal error:", error);
      alert(error?.message || "Không thể xoá món ăn");
    }
  };

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await ApiClient.get<{ user: UserData }>("/users/me");
        if (data?.user) {
          setUserData(data.user);
          setEditForm(data.user);
        }
        await fetchUserGoal();
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Không thể tải thông tin hồ sơ");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const fetchUserGoal = async () => {
    try {
      setGoalLoading(true);
      setGoalError(null);
      const res: any = await ApiClient.get("/goals/me");
      const payload = res?.data || res;
      const goals = Array.isArray(payload?.goals)
        ? payload.goals
        : Array.isArray(payload)
        ? payload
        : [];
      setUserGoal(goals[0] || null);
    } catch (e: any) {
      console.error("Failed to fetch user goals:", e);
      setGoalError(e?.message || "Không thể tải mục tiêu");
    } finally {
      setGoalLoading(false);
    }
  };

  useEffect(() => {
    if (userGoal) {
      setGoalSetupWeight(
        typeof userGoal.can_nang_muc_tieu === "number"
          ? userGoal.can_nang_muc_tieu
          : userGoal.can_nang_muc_tieu
          ? Number(userGoal.can_nang_muc_tieu)
          : null
      );
      setGoalSetupDuration(userGoal.thoi_gian_dat_muc_tieu ?? 8);
    } else {
      setGoalSetupWeight(null);
      setGoalSetupDuration(8);
    }
  }, [userGoal]);

  useEffect(() => {
    if (!userData) return;
    fetchMealsForDate(selectedMealDate);
  }, [userData, selectedMealDate, fetchMealsForDate]);

  const openGoalSetup = () => {
    setGoalSetupWeight(
      typeof userGoal?.can_nang_muc_tieu === "number"
        ? userGoal.can_nang_muc_tieu
        : userGoal?.can_nang_muc_tieu
        ? Number(userGoal.can_nang_muc_tieu)
        : userData?.weight || 60
    );
    setGoalSetupDuration(
      typeof userGoal?.thoi_gian_dat_muc_tieu === "number"
        ? userGoal.thoi_gian_dat_muc_tieu
        : 8
    );
    setGoalSetupVisible(true);
  };

  const closeGoalSetup = () => setGoalSetupVisible(false);

  const adjustWeight = (delta: number) => {
    setGoalSetupWeight((prev) => {
    const base = prev ?? userGoal?.can_nang_muc_tieu ?? userData?.weight ?? 60;
      const next = Math.min(
        200,
        Math.max(30, Number((base + delta).toFixed(1)))
      );
      return next;
    });
  };

  const adjustDuration = (delta: number) => {
    setGoalSetupDuration((prev) => Math.min(52, Math.max(1, prev + delta)));
  };

  const applyGoalSetup = () => {
    setUserGoal((prev) =>
      prev
        ? {
            ...prev,
            can_nang_muc_tieu: goalSetupWeight ?? prev.can_nang_muc_tieu,
            thoi_gian_dat_muc_tieu: goalSetupDuration,
          }
        : prev
    );
    setGoalSetupVisible(false);
  };

  const handleAddGoal = async () => {
    try {
      const loai =
        window.prompt(
          "Nhập loại mục tiêu (Giảm cân, Tăng cân, Giữ dáng, Tăng cơ)",
          "Giảm cân"
        )?.trim() || "";
      if (!loai) return;
      const currentWeightStr = window.prompt(
        "Nhập cân nặng hiện tại (kg)",
        userData?.weight ? String(userData.weight) : "65"
      );
      const targetWeightStr = window.prompt(
        "Nhập cân nặng mục tiêu (kg)",
        userData?.weight ? String(Number(userData.weight) - 3) : "60"
      );
      const hoursStr = window.prompt(
        "Số giờ tập mỗi ngày (0.5, 1, 1.5, 2)",
        "1"
      );
      const weeksStr = window.prompt(
        "Thời gian đạt mục tiêu (tuần)",
        "8"
      );
      if (!currentWeightStr || !targetWeightStr || !hoursStr || !weeksStr)
        return;

      await ApiClient.post("/goals/", {
        loai_muc_tieu: loai as any,
        can_nang_hien_tai: parseFloat(currentWeightStr),
        can_nang_muc_tieu: parseFloat(targetWeightStr),
        so_gio_tap_moi_ngay: Number(hoursStr),
        thoi_gian_dat_muc_tieu: parseInt(weeksStr, 10),
      });
      await fetchUserGoal();
    } catch (e: any) {
      console.error("Add goal error:", e);
      alert(e?.message || "Không thể thêm mục tiêu");
    }
  };

  const handleUpdateGoal = async () => {
    if (!userGoal) return;
    try {
      const status =
        window.prompt(
          "Nhập trạng thái mới (Đang thực hiện/Đã hoàn thành/Hủy bỏ)",
          userGoal.trang_thai
        ) || userGoal.trang_thai;
      const hours = window.prompt(
        "Nhập số giờ tập mỗi ngày (0.5, 1, 1.5, 2)",
        String(userGoal.so_gio_tap_moi_ngay)
      );
      await ApiClient.put(`/goals/${userGoal.goal_id}`, {
        trang_thai: status as any,
        so_gio_tap_moi_ngay: hours ? Number(hours) : undefined,
      });
      await fetchUserGoal();
    } catch (e: any) {
      console.error("Update goal error:", e);
      alert(e?.message || "Không thể cập nhật mục tiêu");
    }
  };

  const handleDeleteGoal = async () => {
    if (!userGoal) return;
    if (!window.confirm("Bạn chắc chắn muốn xóa mục tiêu này?")) return;
    try {
      await ApiClient.delete(`/goals/${userGoal.goal_id}`);
      setUserGoal(null);
    } catch (e: any) {
      console.error("Delete goal error:", e);
      alert(e?.message || "Không thể xóa mục tiêu");
    }
  };

  const handleEditChange = (field: keyof UserData, value: any) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
  };

  const handleSave = async () => {
    if (!userData) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatePayload = {
        name: editForm.name,
        gender: editForm.gender,
        age: editForm.age ? parseInt(editForm.age.toString()) : null,
        weight: editForm.weight ? parseFloat(editForm.weight.toString()) : null,
        height: editForm.height ? parseFloat(editForm.height.toString()) : null,
      };

      await ApiClient.put("/users/me", updatePayload);
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              name: editForm.name || prev.name,
              gender: editForm.gender || prev.gender,
              age: editForm.age ? parseInt(editForm.age.toString()) : prev.age,
              weight: editForm.weight
                ? parseFloat(editForm.weight.toString())
                : prev.weight,
              height: editForm.height
                ? parseFloat(editForm.height.toString())
                : prev.height,
            }
          : prev
      );
      setSuccess("Hồ sơ đã được cập nhật");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Không thể cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  const summaryPercent =
    mealSummary?.calo_muc_tieu && mealSummary.calo_muc_tieu > 0
      ? Math.min(
          150,
          Math.round((mealSummary.tong_calo / mealSummary.calo_muc_tieu) * 100)
        )
      : null;
  const summaryStyle =
    mealSummary?.trang_thai_calo && STATUS_STYLES[mealSummary.trang_thai_calo]
      ? STATUS_STYLES[mealSummary.trang_thai_calo]
      : STATUS_STYLES["Chưa đạt"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card title="Hồ sơ cá nhân">
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">Đang tải hồ sơ...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card title="Hồ sơ cá nhân">
          <div className="text-center py-8">
            <div className="text-red-400 text-sm">
              Không thể tải hồ sơ. Vui lòng thử lại sau.
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4 py-6">
      <div className="w-full max-w-5xl mx-auto">
        <Card
          title="Hồ sơ cá nhân"
          // nếu Card support className thì thêm vào:
          // className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/60"
        >
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-200">
              <span className="mt-[2px] text-base">⚠️</span>
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-200">
              <span className="mt-[2px] text-base">✅</span>
              <p>{success}</p>
            </div>
          )}

          {/* Profile Header with Avatar */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 pb-5 border-b border-slate-800/70">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 via-sky-500 to-indigo-500 p-[3px] shadow-lg shadow-emerald-500/30">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  {userData.profile_picture_url ? (
                    <img
                      src={userData.profile_picture_url}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-slate-50">
                      {userData.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] rounded-full bg-slate-900 px-2 py-0.5 border border-slate-700 text-slate-200 shadow-sm">
                Ảnh đại diện
              </div>
            </div>

            <div className="flex-1 text-center md:text-left pt-3 md:pt-0">
              {isEditing ? (
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  placeholder="Họ và tên"
                  className="mb-1.5 h-10 rounded-xl border-slate-700 bg-slate-900 text-xl font-semibold text-slate-50 placeholder:text-slate-500"
                />
              ) : (
                <div className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight">
                  {userData.name}
                </div>
              )}

              <div className="mt-1 text-sm text-slate-400">
                {userData.email}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                ID tài khoản:{" "}
                <span className="font-mono text-slate-300">
                  {userData.user_id}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-center md:justify-start gap-2">
                {userData.email_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                    <span>✔</span> Email đã xác thực
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-300 border border-sky-500/25">
                  Sức khỏe • FitFood
                </span>
              </div>
            </div>

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="mt-2 h-9 rounded-xl px-4 text-sm font-medium shadow-sm bg-sky-500 hover:bg-sky-400"
              >
                Chỉnh sửa hồ sơ
              </Button>
            ) : null}
          </div>

          {/* Main content: 2 cột trên màn hình lớn */}
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2.2fr)]">
            {/* LEFT: Thông tin cá nhân + BMI */}
            <div className="space-y-5">
              {/* User Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                    Thông tin cá nhân
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      Giới tính
                    </label>
                    {isEditing ? (
                      <Select
                        value={editForm.gender || ""}
                        onChange={(e) =>
                          handleEditChange("gender", e.target.value)
                        }
                        className="h-9 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50"
                      >
                        <option value="">Không chọn</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </Select>
                    ) : (
                      <div className="inline-flex items-center rounded-xl bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100 border border-slate-700/70">
                        {userData.gender
                          ? {
                              male: "Nam",
                              female: "Nữ",
                              other: "Khác",
                            }[userData.gender]
                          : "Chưa cập nhật"}
                      </div>
                    )}
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      Tuổi
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="13"
                        max="120"
                        value={editForm.age || ""}
                        onChange={(e) =>
                          handleEditChange("age", e.target.value)
                        }
                        placeholder="Nhập tuổi"
                        className="h-9 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50"
                      />
                    ) : (
                      <div className="inline-flex items-center rounded-xl bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100 border border-slate-700/70">
                        {userData.age
                          ? `${userData.age} tuổi`
                          : "Chưa cập nhật"}
                      </div>
                    )}
                  </div>

                  {/* Weight */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      Cân nặng (kg)
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="20"
                        max="200"
                        step="0.1"
                        value={editForm.weight || ""}
                        onChange={(e) =>
                          handleEditChange("weight", e.target.value)
                        }
                        placeholder="Nhập cân nặng"
                        className="h-9 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50"
                      />
                    ) : (
                      <div className="inline-flex items-center rounded-xl bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100 border border-slate-700/70">
                        {userData.weight
                          ? `${userData.weight} kg`
                          : "Chưa cập nhật"}
                      </div>
                    )}
                  </div>

                  {/* Height */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      Chiều cao (cm)
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="100"
                        max="250"
                        step="0.1"
                        value={editForm.height || ""}
                        onChange={(e) =>
                          handleEditChange("height", e.target.value)
                        }
                        placeholder="Nhập chiều cao"
                        className="h-9 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50"
                      />
                    ) : (
                      <div className="inline-flex items-center rounded-xl bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100 border border-slate-700/70">
                        {userData.height
                          ? `${userData.height} cm`
                          : "Chưa cập nhật"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BMI Calculation */}
              {bmiValue !== null && (
                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-wide text-slate-300 uppercase mb-1.5">
                    Chỉ số BMI
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-sky-400 tabular-nums">
                      {bmiValue.toFixed(1)}
                    </div>
                    <div className="space-y-0.5 text-sm text-slate-200">
                      <div>{bmiCategory}</div>
                      <div className="text-xs text-slate-400">
                        Duy trì ăn uống và luyện tập đều đặn để giữ sức khỏe ổn
                        định.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Goals + Account info */}
            <div className="space-y-5">
              {/* Goals section */}
              <div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                    Mục tiêu cá nhân
                  </h3>
                  {(!userGoal ||
                    (userGoal.loai_muc_tieu || '')
                      .toLowerCase()
                      .includes('giữ')) && (
                    <button
                      type="button"
                      onClick={openGoalSetup}
                      className="flex items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                    >
                      <span className="text-base leading-none mr-1">＋</span>
                      Setup
                    </button>
                  )}
                </div>

                {goalLoading ? (
                  <div className="text-sm text-slate-400">
                    Đang tải mục tiêu...
                  </div>
                ) : (
                  <div
                    className={`grid gap-4 ${
                      goalSetupVisible ? "lg:grid-cols-2" : ""
                    }`}
                  >
                    <div
                      className={`space-y-3 ${
                        goalSetupVisible ? "" : "lg:col-span-2"
                      }`}
                    >
                      {goalError && (
                        <div className="text-xs text-yellow-400">
                          {goalError}
                        </div>
                      )}

                      {userGoal ? (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-3 space-y-1">
                          <div className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                            {userGoal.loai_muc_tieu}
                          </div>
                          <div className="text-xs text-slate-400">
                            Tiến độ:{" "}
                            <span className="text-emerald-300 font-semibold">
                              {Math.round(userGoal.tien_trinh)}%
                            </span>
                            <span className="ml-2">
                              · Cân nặng hiện tại: {userGoal.can_nang_hien_tai} kg
                            </span>
                            <span className="ml-2">
                              · Mục tiêu: {userGoal.can_nang_muc_tieu} kg
                            </span>
                            <span className="ml-2">
                              · Thời gian: {userGoal.thoi_gian_dat_muc_tieu} tuần
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Trạng thái: {userGoal.trang_thai}
                          </div>
                          <div className="text-xs text-slate-500">
                            Đốt mỗi ngày: {userGoal.tong_calo_moi_ngay} kcal •{" "}
                            {userGoal.so_gio_tap_moi_ngay} giờ tập
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400">
                          Bạn chưa có mục tiêu nào. Hãy thêm một mục tiêu để
                          FitFood theo dõi cho bạn.
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Button
                          onClick={handleAddGoal}
                          className="flex-1 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-medium"
                        >
                          Thêm mục tiêu
                        </Button>
                        {userGoal && (
                          <>
                            <Button
                              variant="ghost"
                              onClick={handleUpdateGoal}
                              className="flex-1 h-9 rounded-xl text-sm font-medium"
                            >
                              Sửa mục tiêu
                            </Button>
                            <Button
                              variant="danger"
                              onClick={handleDeleteGoal}
                              className="flex-1 h-9 rounded-xl text-sm font-medium"
                            >
                              Xóa mục tiêu
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {goalSetupVisible && (
                      <div className="rounded-2xl border border-slate-800/70 bg-slate-900 px-3.5 py-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-100">
                              Thiết lập mục tiêu duy trì
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Tùy chỉnh nhanh cân nặng và thời gian cho mục tiêu
                              của bạn
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={closeGoalSetup}
                            className="text-xs text-slate-400 hover:text-slate-100"
                          >
                            Thoát ✕
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="text-[11px] font-semibold tracking-wide text-slate-300 uppercase">
                            Cân nặng mong muốn
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => adjustWeight(-0.5)}
                              className="h-8 w-8 rounded-xl border border-slate-700 text-lg text-slate-100 hover:bg-slate-800"
                            >
                              −
                            </button>
                            <div className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-center text-lg font-semibold text-slate-50">
                              {goalSetupWeight !== null
                                ? `${goalSetupWeight.toFixed(1)} kg`
                                : "-- kg"}
                            </div>
                            <button
                              type="button"
                              onClick={() => adjustWeight(0.5)}
                              className="h-8 w-8 rounded-xl border border-slate-700 text-lg text-slate-100 hover:bg-slate-800"
                            >
                              ＋
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-[11px] font-semibold tracking-wide text-slate-300 uppercase">
                            Thời gian duy trì (tuần)
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => adjustDuration(-1)}
                              className="h-8 w-8 rounded-xl border border-slate-700 text-lg text-slate-100 hover:bg-slate-800"
                            >
                              −
                            </button>
                            <div className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-center text-lg font-semibold text-slate-50">
                              {goalSetupDuration} tuần
                            </div>
                            <button
                              type="button"
                              onClick={() => adjustDuration(1)}
                              className="h-8 w-8 rounded-xl border border-slate-700 text-lg text-slate-100 hover:bg-slate-800"
                            >
                              ＋
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={applyGoalSetup}
                            className="flex-1 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold"
                          >
                            Áp dụng
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={closeGoalSetup}
                            className="flex-1 h-9 rounded-xl text-sm font-semibold"
                          >
                            Đóng
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account Info */}
              <div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                    Thông tin tài khoản
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      Email đăng nhập
                    </div>
                    <div className="font-medium text-slate-100">
                      {userData.email}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      Trạng thái
                    </div>
                    <div className="font-medium">
                      {userData.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 border border-emerald-500/40">
                          <span className="text-[11px]">●</span> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300 border border-red-500/40">
                          <span className="text-[11px]">●</span> Bị khóa
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      Ngày tạo tài khoản
                    </div>
                    <div className="font-medium text-slate-100">
                      {new Date(userData.created_at).toLocaleDateString(
                        "vi-VN"
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                      Lần đăng nhập cuối
                    </div>
                    <div className="font-medium text-slate-100">
                      {userData.last_login
                        ? new Date(userData.last_login).toLocaleString("vi-VN")
                        : "Chưa có"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meal Diary Section */}
          <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                  Nhật ký bữa ăn
                </h3>
                <p className="text-xs text-slate-400">
                  Ghi lại món ăn và lượng calo tiêu thụ mỗi ngày
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={selectedMealDate}
                  onChange={(e) => setSelectedMealDate(e.target.value)}
                  className="h-9 rounded-xl border-slate-700 bg-slate-900 text-slate-50"
                />
                <Button
                  variant="ghost"
                  onClick={() => fetchMealsForDate(selectedMealDate)}
                  className="h-9 rounded-xl text-sm font-medium"
                >
                  Làm mới
                </Button>
              </div>
            </div>

            {mealError && (
              <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {mealError}
              </div>
            )}

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
              <div className="space-y-4">
                <div
                  className={`rounded-2xl border ${summaryStyle.border} ${summaryStyle.bg} px-4 py-3 transition`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">
                        Tổng calories ngày {selectedMealDate}
                      </p>
                      <p className="text-2xl font-semibold text-slate-50">
                        {mealSummary?.tong_calo ?? 0} kcal
                      </p>
                    </div>
                    {mealSummary && (
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${summaryStyle.bg} ${summaryStyle.text} ${summaryStyle.border}`}
                      >
                        {mealSummary.trang_thai_calo}
                      </span>
                    )}
                  </div>
                  {mealSummary?.calo_muc_tieu ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Mục tiêu: {mealSummary.calo_muc_tieu} kcal</span>
                        <span>
                          {summaryPercent !== null ? `${summaryPercent}%` : ""}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500"
                          style={{
                            width: `${
                              summaryPercent !== null
                                ? Math.min(summaryPercent, 150)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-slate-400">
                      Bạn chưa có mục tiêu calo. Thêm mục tiêu ở phần "Mục tiêu
                      cá nhân" để tự động đối chiếu mỗi ngày.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {mealLoading ? (
                    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-400">
                      Đang tải dữ liệu món ăn...
                    </div>
                  ) : meals.length ? (
                    <ul className="space-y-2">
                      {meals.map((meal) => (
                        <li
                          key={meal.id}
                          className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-semibold text-slate-50">
                                {meal.ten_mon}
                              </div>
                              <div className="text-xs text-slate-400">
                                {meal.loai_bua_an} · {meal.luong_calories} kcal ·{" "}
                                {meal.khoi_luong}g
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {meal.ngay_an} lúc {meal.thoi_gian_an}
                              </div>
                              {meal.ghi_chu && (
                                <div className="mt-1 text-xs text-slate-400">
                                  Ghi chú: {meal.ghi_chu}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                className="h-8 rounded-xl px-3 text-xs"
                                onClick={() => handleEditMeal(meal)}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="danger"
                                className="h-8 rounded-xl px-3 text-xs"
                                onClick={() => handleDeleteMeal(meal.id, meal.ten_mon)}
                              >
                                Xoá
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800/70 bg-slate-900/40 px-4 py-5 text-center text-sm text-slate-400">
                      Chưa có món ăn nào cho ngày {selectedMealDate}. Hãy thêm
                      món bên phải.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  Thêm món ăn
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Dữ liệu lưu trực tiếp vào MongoDB của meal-service
                </p>
                <form onSubmit={handleCreateMealEntry} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wide text-slate-400">
                      Tên món
                    </label>
                    <Input
                      value={mealForm.ten_mon}
                      onChange={(e) =>
                        handleMealFormChange("ten_mon", e.target.value)
                      }
                      placeholder="Ví dụ: Cơm gà, Phở bò..."
                      className="h-9 rounded-xl border-slate-700 bg-slate-900 text-slate-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wide text-slate-400">
                      Loại bữa ăn
                    </label>
                    <Select
                      value={mealForm.loai_bua_an}
                      onChange={(e) =>
                        handleMealFormChange(
                          "loai_bua_an",
                          e.target.value as MealTypeVi
                        )
                      }
                      className="h-9 rounded-xl border-slate-700 bg-slate-900 text-slate-50"
                    >
                      {MEAL_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wide text-slate-400">
                        Calories (kcal)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={mealForm.luong_calories}
                        onChange={(e) =>
                          handleMealFormChange("luong_calories", e.target.value)
                        }
                        className="h-9 rounded-xl border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wide text-slate-400">
                        Khối lượng (g)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={mealForm.khoi_luong}
                        onChange={(e) =>
                          handleMealFormChange("khoi_luong", e.target.value)
                        }
                        className="h-9 rounded-xl border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wide text-slate-400">
                        Thời gian ăn
                      </label>
                      <Input
                        type="time"
                        value={mealForm.thoi_gian_an}
                        onChange={(e) =>
                          handleMealFormChange("thoi_gian_an", e.target.value)
                        }
                        className="h-9 rounded-xl border-slate-700 bg-slate-900 text-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wide text-slate-400">
                        Ngày ăn
                      </label>
                      <Input
                        type="text"
                        value={selectedMealDate}
                        disabled
                        className="h-9 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 text-center text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wide text-slate-400">
                      Ghi chú
                    </label>
                    <textarea
                      value={mealForm.ghi_chu}
                      onChange={(e) =>
                        handleMealFormChange("ghi_chu", e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:border-slate-500 focus:outline-none"
                      placeholder="Ví dụ: Ăn cùng salad, ít dầu..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingMeal}
                    className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold disabled:opacity-60"
                  >
                    {savingMeal ? "Đang lưu..." : "Lưu món ăn"}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-800/70 flex flex-col md:flex-row gap-3">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl font-medium shadow-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(userData);
                  }}
                  className="flex-1 h-10 rounded-xl font-medium border border-slate-700/70 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
                >
                  Hủy
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full h-10 rounded-xl font-medium shadow-sm bg-sky-500 hover:bg-sky-400"
              >
                Chỉnh sửa thông tin
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
