import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useEffect, useState } from "react";
import { ApiClient } from "../lib/api/client";

interface UserData {
  user_id: string;
  name: string;
  email: string;
  gender: string | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  profile_picture_url: string | null;
  is_active: boolean;
  created_at: string;
  email_verified: boolean;
  last_login?: string;
}

interface UserGoalSummary {
  user_goal_id: string;
  goal_type: string;
  description?: string | null;
  target_calories?: number | null;
  target_weight?: number | null;
  target_duration_weeks?: number | null;
  progress_percentage: number;
  status: string;
}

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
      const res: any = await ApiClient.get("/goals/user-goals?limit=1&status=Active");
      const payload = res?.data || res;
      const first = payload?.goals?.[0];
      if (first && first.goal) {
        setUserGoal({
          user_goal_id: first.user_goal_id,
          goal_type: first.goal.goal_type || "Goal",
          description: first.goal.description || null,
          target_calories: first.goal.target_calories ?? null,
          target_weight: first.goal.target_weight ?? null,
          target_duration_weeks: first.goal.target_duration_weeks ?? null,
          progress_percentage: first.progress_percentage ?? 0,
          status: first.status || "Active",
        });
      } else {
        setUserGoal(null);
      }
    } catch (e: any) {
      console.error("Failed to fetch user goals:", e);
      setGoalError(e?.message || "Không thể tải mục tiêu");
    } finally {
      setGoalLoading(false);
    }
  };

  const handleAddGoal = async () => {
    try {
      const goalType = window.prompt("Nhập loại mục tiêu (vd: Reduce Fat, Build Muscle)", "Reduce Fat");
      if (!goalType) return;
      const targetWeightStr = window.prompt("Nhập cân nặng mục tiêu (kg)", "65");
      const targetWeight = targetWeightStr ? parseFloat(targetWeightStr) : undefined;

      const createPayload: any = {
        goal_type: goalType,
        description: "Mục tiêu cá nhân từ Profile",
        target_weight: targetWeight,
        target_duration_weeks: 8,
      };

      const created: any = await ApiClient.post("/goals", createPayload);
      const createdGoal = created?.data || created;
      const goalId = createdGoal?.goal_id || createdGoal?.id;
      if (!goalId) {
        alert("Không tạo được goal mới");
        return;
      }

      const assignPayload = {
        goal_id: goalId,
        notes: "Mục tiêu được tạo từ trang hồ sơ",
      };
      await ApiClient.post("/goals/user-goals", assignPayload);
      await fetchUserGoal();
    } catch (e: any) {
      console.error("Add goal error:", e);
      alert(e?.message || "Không thể thêm mục tiêu");
    }
  };

  const handleUpdateGoal = async () => {
    if (!userGoal) return;
    try {
      const progressStr = window.prompt(
        "Nhập tiến độ mới (%) cho mục tiêu hiện tại",
        String(userGoal.progress_percentage || 0)
      );
      if (!progressStr) return;
      const progress = parseFloat(progressStr);
      if (Number.isNaN(progress)) return;
      await ApiClient.put(`/goals/user-goals/${userGoal.user_goal_id}`, {
        progress_percentage: progress,
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
      await ApiClient.delete(`/goals/user-goals/${userGoal.user_goal_id}`);
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
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <Card
          title="Hồ sơ cá nhân"
          // nếu Card support className thì thêm vào:
          // className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/60"
        >
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-200">
              <span className="mt-[2px] text-base">⚠️</span>
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
              <span className="mt-[2px] text-base">✅</span>
              <p>{success}</p>
            </div>
          )}

          {/* Profile Header with Avatar */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-slate-800/70">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 via-sky-500 to-indigo-500 p-[3px] shadow-lg shadow-emerald-500/30">
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
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[11px] rounded-full bg-slate-900 px-3 py-1 border border-slate-700 text-slate-200 shadow-sm">
                Ảnh đại diện
              </div>
            </div>

            <div className="flex-1 text-center md:text-left pt-2 md:pt-0">
              {isEditing ? (
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  placeholder="Họ và tên"
                  className="mb-2 h-11 rounded-xl border-slate-700 bg-slate-900 text-xl font-semibold text-slate-50 placeholder:text-slate-500"
                />
              ) : (
                <div className="text-2xl md:text-3xl font-semibold text-slate-50 tracking-tight">
                  {userData.name}
                </div>
              )}

              <div className="mt-1 text-sm text-slate-400">{userData.email}</div>
              <div className="mt-1 text-xs text-slate-500">
                ID tài khoản:{" "}
                <span className="font-mono text-slate-300">
                  {userData.user_id}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
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
                className="mt-2 h-10 rounded-xl px-4 text-sm font-medium shadow-sm bg-sky-500 hover:bg-sky-400"
              >
                Chỉnh sửa hồ sơ
              </Button>
            ) : null}
          </div>

          {/* User Information */}
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                Thông tin cá nhân
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-xs font-medium tracking-wide text-slate-400 uppercase">
                  Giới tính
                </label>
                {isEditing ? (
                  <Select
                    value={editForm.gender || ""}
                    onChange={(e) => handleEditChange("gender", e.target.value)}
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50"
                  >
                    <option value="">Không chọn</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </Select>
                ) : (
                  <div className="inline-flex items-center rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-100 border border-slate-700/70">
                    {userData.gender
                      ? {
                          Male: "Nam",
                          Female: "Nữ",
                          Other: "Khác",
                        }[userData.gender]
                      : "Chưa cập nhật"}
                  </div>
                )}
              </div>

              {/* Age */}
              <div className="space-y-2">
                <label className="block text-xs font-medium tracking-wide text-slate-400 uppercase">
                  Tuổi
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    min="13"
                    max="120"
                    value={editForm.age || ""}
                    onChange={(e) => handleEditChange("age", e.target.value)}
                    placeholder="Nhập tuổi"
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50"
                  />
                ) : (
                  <div className="inline-flex items-center rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-100 border border-slate-700/70">
                    {userData.age ? `${userData.age} tuổi` : "Chưa cập nhật"}
                  </div>
                )}
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <label className="block text-xs font-medium tracking-wide text-slate-400 uppercase">
                  Cân nặng (kg)
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    min="20"
                    max="200"
                    step="0.1"
                    value={editForm.weight || ""}
                    onChange={(e) => handleEditChange("weight", e.target.value)}
                    placeholder="Nhập cân nặng"
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50"
                  />
                ) : (
                  <div className="inline-flex items-center rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-100 border border-slate-700/70">
                    {userData.weight
                      ? `${userData.weight} kg`
                      : "Chưa cập nhật"}
                  </div>
                )}
              </div>

              {/* Height */}
              <div className="space-y-2">
                <label className="block text-xs font-medium tracking-wide text-slate-400 uppercase">
                  Chiều cao (cm)
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    min="100"
                    max="250"
                    step="0.1"
                    value={editForm.height || ""}
                    onChange={(e) => handleEditChange("height", e.target.value)}
                    placeholder="Nhập chiều cao"
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50"
                  />
                ) : (
                  <div className="inline-flex items-center rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-100 border border-slate-700/70">
                    {userData.height
                      ? `${userData.height} cm`
                      : "Chưa cập nhật"}
                  </div>
                )}
              </div>
            </div>

            {/* BMI Calculation */}
            {userData.weight && userData.height && (
              <div className="mt-2 rounded-2xl border border-sky-500/30 bg-sky-500/5 px-4 py-4">
                <div className="text-xs font-semibold tracking-wide text-slate-300 uppercase mb-2">
                  Chỉ số BMI
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-sky-400 tabular-nums">
                    {(
                      userData.weight /
                      (userData.height / 100) ** 2
                    ).toFixed(1)}
                  </div>
                  <div className="space-y-1 text-sm text-slate-200">
                    <div>
                      {(() => {
                        const bmi =
                          userData.weight /
                          (userData.height / 100) ** 2;
                        if (bmi < 18.5) return "Cân nặng thấp (gầy)";
                        if (bmi < 25) return "Bình thường";
                        if (bmi < 30) return "Thừa cân";
                        return "Béo phì";
                      })()}
                    </div>
                    <div className="text-xs text-slate-400">
                      Duy trì ăn uống và luyện tập đều đặn để giữ sức khỏe ổn định.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Goals section under personal info */}
          <div className="py-6 border-t border-slate-800/70 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                Mục tiêu cá nhân
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />
            </div>

            {goalLoading ? (
              <div className="text-sm text-slate-400">Đang tải mục tiêu...</div>
            ) : (
              <>
                {goalError && (
                  <div className="text-xs text-yellow-400">{goalError}</div>
                )}

                {userGoal ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-4 space-y-1">
                    <div className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                      {userGoal.goal_type}
                    </div>
                    {userGoal.description && (
                      <div className="text-sm text-slate-100">
                        {userGoal.description}
                      </div>
                    )}
                    <div className="text-xs text-slate-400">
                      Tiến độ:{" "}
                      <span className="text-emerald-300 font-semibold">
                        {Math.round(userGoal.progress_percentage)}%
                      </span>
                      {userGoal.target_weight && (
                        <span className="ml-2">
                          · Cân nặng mục tiêu: {userGoal.target_weight} kg
                        </span>
                      )}
                      {userGoal.target_duration_weeks && (
                        <span className="ml-2">
                          · Thời gian: {userGoal.target_duration_weeks} tuần
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Trạng thái: {userGoal.status}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">
                    Bạn chưa có mục tiêu nào. Hãy thêm một mục tiêu để FitFood
                    theo dõi cho bạn.
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={handleAddGoal}
                    className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-medium"
                  >
                    Thêm mục tiêu
                  </Button>
                  {userGoal && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={handleUpdateGoal}
                        className="flex-1 h-10 rounded-xl text-sm font-medium"
                      >
                        Sửa mục tiêu
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteGoal}
                        className="flex-1 h-10 rounded-xl text-sm font-medium"
                      >
                        Xóa mục tiêu
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Account Info */}
          <div className="py-6 border-t border-slate-800/70 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                Thông tin tài khoản
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                  Email đăng nhập
                </div>
                <div className="font-medium text-slate-100">
                  {userData.email}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
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

              <div className="space-y-1">
                <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                  Ngày tạo tài khoản
                </div>
                <div className="font-medium text-slate-100">
                  {new Date(userData.created_at).toLocaleDateString("vi-VN")}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
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

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-3 pt-5 border-t border-slate-800/70">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl font-medium shadow-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(userData);
                  }}
                  className="flex-1 h-11 rounded-xl font-medium border border-slate-700/70 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
                >
                  Hủy
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full h-11 rounded-xl font-medium shadow-sm bg-sky-500 hover:bg-sky-400"
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
