import { useEffect, useState } from "react";
import Button from "./ui/Button";
import { Input } from "./ui/Input";
import type { CombinedProfile } from "../types";
import { ApiClient } from "../lib/api/client";

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

interface ProfileModalProps {
  profile: CombinedProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (profile: Partial<CombinedProfile>) => Promise<void>;
}

const parseMetric = (
  value: number | string | null | undefined
): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const categorizeBmi = (bmi: number): string => {
  if (bmi < 18.5) return "Cân nặng thấp (gầy)";
  if (bmi < 25) return "Bình thường";
  if (bmi < 30) return "Thừa cân";
  return "Béo phì";
};

const deriveBmiFromProfile = (
  profile?: CombinedProfile | null
): { value: number | null; category: string | null } => {
  if (!profile) return { value: null, category: null };
  const backendBmi =
    typeof profile.bmi === "number" && Number.isFinite(profile.bmi)
      ? profile.bmi
      : null;

  if (backendBmi !== null) {
    return {
      value: backendBmi,
      category: profile.bmi_category || categorizeBmi(backendBmi),
    };
  }

  const weight = parseMetric(profile.weight as any);
  const height = parseMetric(profile.height as any);
  if (!weight || !height || height <= 0) {
    return { value: null, category: null };
  }

  const computed = Number(
    (weight / Math.pow(height / 100, 2)).toFixed(1)
  );
  return { value: computed, category: categorizeBmi(computed) };
};

export default function ProfileModal({
  profile,
  isOpen,
  onClose,
  onUpdate,
}: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dữ liệu lấy trực tiếp từ /users/me
  const [serverProfile, setServerProfile] = useState<CombinedProfile | null>(
    null
  );
  const [userGoal, setUserGoal] = useState<UserGoalSummary | null>(null);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: (profile as any)?.phone || "",
    bio: (profile as any)?.bio || "",
  });

  // Toggle panel mục tiêu trái
  const [showGoals, setShowGoals] = useState(true);

  // Khi prop profile đổi, sync lại form
  useEffect(() => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: (profile as any)?.phone || "",
      bio: (profile as any)?.bio || "",
    });
  }, [profile]);

  const fetchUserGoal = async () => {
    setGoalLoading(true);
    setGoalError(null);
    try {
      const res: any = await ApiClient.get("/goals/me");
      const payload = res?.data || res;
      const goals = Array.isArray(payload?.goals)
        ? payload.goals
        : Array.isArray(payload)
        ? payload
        : [];
      setUserGoal(goals[0] || null);
    } catch (err: any) {
      console.error("ProfileModal goals fetch failed:", err);
      setGoalError(err?.message || "Không thể tải mục tiêu");
    } finally {
      setGoalLoading(false);
    }
  };

  // Mỗi lần mở modal → lấy dữ liệu mới nhất từ backend
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const hydrateFromApi = async () => {
      setFetching(true);
      setError(null);
      try {
        const data = await ApiClient.get<{ user: any }>("/users/me");
        const user = data?.user || data;
        if (!user || !active) return;

        const hydrated: CombinedProfile = {
          ...(profile || ({} as CombinedProfile)),
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          age: user.age,
          weight: user.weight,
          height: user.height,
          bmi: typeof user.bmi === "number" ? user.bmi : undefined,
          bmi_category: user.bmi_category || undefined,
          fitness_goal: user.fitness_goal,
          preferred_diet: user.preferred_diet,
          subscription_status: user.subscription_status,
          profile_picture_url: user.profile_picture_url,
        };

        setServerProfile(hydrated);

        setFormData({
          name: user.name || profile?.name || "",
          email: user.email || profile?.email || "",
          phone: (profile as any)?.phone || "",
          bio: (profile as any)?.bio || "",
        });
      } catch (err) {
        console.error("ProfileModal hydrate failed:", err);
        if (active) {
          setError("Không thể tải hồ sơ từ server");
        }
      } finally {
        if (active) setFetching(false);
      }
    };

    hydrateFromApi();
    fetchUserGoal();
    return () => {
      active = false;
    };
  }, [isOpen, profile]);

  const handleAddGoal = async () => {
    try {
      const loai =
        window.prompt(
          "Nhập loại mục tiêu (Giảm cân, Tăng cân, Giữ dáng, Tăng cơ)",
          "Giảm cân"
        )?.trim() || "";
      if (!loai) return;

      const currentWeight = window.prompt(
        "Nhập cân nặng hiện tại (kg)",
        serverProfile?.weight ? String(serverProfile.weight) : "65"
      );
      const targetWeight = window.prompt(
        "Nhập cân nặng mục tiêu (kg)",
        serverProfile?.weight ? String(Number(serverProfile.weight) - 3) : "60"
      );
      const hours = window.prompt(
        "Số giờ tập mỗi ngày (0.5, 1, 1.5, 2)",
        "1"
      );
      const weeks = window.prompt(
        "Thời gian đạt mục tiêu (tuần)",
        "8"
      );

      if (!currentWeight || !targetWeight || !hours || !weeks) return;

      const body = {
        loai_muc_tieu: loai as any,
        can_nang_hien_tai: parseFloat(currentWeight),
        can_nang_muc_tieu: parseFloat(targetWeight),
        so_gio_tap_moi_ngay: Number(hours) as any,
        thoi_gian_dat_muc_tieu: parseInt(weeks, 10),
      };

      await ApiClient.post("/goals/", body);
      await fetchUserGoal();
    } catch (err: any) {
      console.error("Add goal error:", err);
      alert(err?.message || "Không thể thêm mục tiêu");
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
        "Số giờ tập mỗi ngày (0.5, 1, 1.5, 2)",
        String(userGoal.so_gio_tap_moi_ngay)
      );
      await ApiClient.put(`/goals/${userGoal.goal_id}`, {
        trang_thai: status as any,
        so_gio_tap_moi_ngay: hours ? Number(hours) : undefined,
      });
      await fetchUserGoal();
    } catch (err: any) {
      alert(err?.message || "Không thể cập nhật mục tiêu");
    }
  };

  const handleDeleteGoal = async () => {
    if (!userGoal) return;
    if (!window.confirm("Bạn chắc chắn muốn xóa mục tiêu này?")) return;
    try {
      await ApiClient.delete(`/goals/${userGoal.goal_id}`);
      setUserGoal(null);
    } catch (err: any) {
      alert(err?.message || "Không thể xóa mục tiêu");
    }
  };

  if (!isOpen) return null;
  // Ưu tiên dữ liệu từ server, fallback về profile prop
  const displayProfile = (serverProfile || profile) as CombinedProfile | null;
  if (!displayProfile) return null;
  const { value: bmiValue, category: bmiCategory } =
    deriveBmiFromProfile(displayProfile);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdate({
        name: formData.name,
        email: formData.email,
        phone: formData.phone as any,
        bio: formData.bio as any,
      });

      setIsEditing(false);
      setServerProfile((prev) =>
        prev
          ? {
              ...prev,
              name: formData.name,
              email: formData.email,
              phone: formData.phone as any,
              bio: formData.bio as any,
            }
          : prev
      );
    } catch (err: any) {
      setError(err.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl =
    displayProfile.profile_picture_url ||
    (displayProfile as any).avatar ||
    null;

  const goalText =
    displayProfile.fitness_goal ||
    (displayProfile as any).goal ||
    "Chưa đặt mục tiêu";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6">
        <div className="mt-8 w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/95 text-slate-50 shadow-2xl shadow-black/60 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-5 py-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Hồ Sơ Cá Nhân
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Quản lý thông tin tài khoản FitFood của bạn
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900 text-slate-400 text-sm hover:bg-slate-800 hover:text-slate-100 transition"
            >
              ✕
            </button>
          </div>

          {/* Body: 2 cột */}
          <div className="px-5 py-4">
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-100">
                <span className="mt-[1px] text-sm">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              {/* LEFT: Goals panel */}
              {showGoals && (
                <div className="md:w-[40%] w-full rounded-2xl border border-slate-800/70 bg-slate-900/80 px-3.5 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-slate-300 tracking-wide">
                        Mục tiêu của bạn
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Theo dõi & thao tác nhanh mục tiêu hiện tại
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={fetchUserGoal}
                        className="h-7 rounded-lg px-2.5 bg-emerald-500/80 hover:bg-emerald-500 text-[11px]"
                      >
                        Làm mới
                      </Button>
                    </div>
                  </div>

                  {goalError && (
                    <div className="text-[11px] text-yellow-400">
                      {goalError}
                    </div>
                  )}

                  {goalLoading ? (
                    <div className="text-[11px] text-slate-500">
                      Đang tải mục tiêu...
                    </div>
                  ) : userGoal ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 grid gap-1 text-xs">
                      <div className="flex items-center justify-between font-semibold uppercase text-emerald-200 tracking-wide">
                        <span>{userGoal.loai_muc_tieu}</span>
                        <span>{Math.round(userGoal.tien_trinh)}%</span>
                      </div>
                      <div className="text-xs text-slate-200">
                        Hiện tại: {userGoal.can_nang_hien_tai} kg • Mục tiêu:{" "}
                        {userGoal.can_nang_muc_tieu} kg
                      </div>
                      <div className="text-[10px] text-slate-400 flex flex-wrap gap-2">
                        {userGoal.can_nang_muc_tieu && (
                          <span>
                            Cân nặng mục tiêu: {userGoal.can_nang_muc_tieu} kg
                          </span>
                        )}
                        {userGoal.thoi_gian_dat_muc_tieu && (
                          <span>
                            Thời gian: {userGoal.thoi_gian_dat_muc_tieu} tuần
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Trạng thái: {userGoal.trang_thai}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      Bạn chưa có mục tiêu nào được gán.
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={handleAddGoal}
                      className="flex-1 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[11px] font-medium"
                    >
                      Thêm mục tiêu
                    </Button>
                    {userGoal && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleUpdateGoal}
                          className="flex-1 h-8 rounded-xl text-[11px] font-medium"
                        >
                          Cập nhật
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={handleDeleteGoal}
                          className="flex-1 h-8 rounded-xl text-[11px] font-medium"
                        >
                          Xóa
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Toggle giữa 2 panel – chỉ hiện trên md+ */}
              <div className="hidden md:flex items-center">
                <button
                  type="button"
                  onClick={() => setShowGoals((v) => !v)}
                  className="h-10 w-7 flex items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  {showGoals ? "<|" : "|>"}
                </button>
              </div>

              {/* RIGHT: Profile info */}
              <div
                className={`flex-1 rounded-2xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 space-y-4 ${
                  !showGoals ? "md:w-full" : "md:w-[60%]"
                }`}
              >
                {/* Avatar + nút edit */}
                <div className="flex items-start gap-3 border-b border-slate-800/70 pb-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 via-sky-500 to-indigo-500 p-[3px] shadow-lg shadow-emerald-500/30">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayProfile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-xl">👤</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 pl-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-50">
                          {displayProfile.name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {displayProfile.email}
                        </div>
                      </div>
                      {!isEditing && (
                        <Button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="h-8 rounded-xl px-3 text-xs font-medium bg-sky-500 hover:bg-sky-400"
                          disabled={fetching}
                        >
                          {fetching ? "Đang tải..." : "Chỉnh sửa"}
                        </Button>
                      )}
                    </div>

                    <div className="mt-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5">
                      <div className="text-[10px] font-medium uppercase text-slate-200 tracking-wide">
                        Mục tiêu
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-sky-200 capitalize line-clamp-1">
                        {goalText}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                {isEditing ? (
                  // EDIT MODE
                  <div className="space-y-2">
                    <label className="block space-y-1.5">
                      <div className="text-[11px] font-medium tracking-wide text-slate-300 uppercase">
                        Tên
                      </div>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Tên của bạn"
                        className="h-9 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <div className="text-[11px] font-medium tracking-wide text-slate-300 uppercase">
                        Email
                      </div>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                        className="h-9 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <div className="text-[11px] font-medium tracking-wide text-slate-300 uppercase">
                        Số điện thoại
                      </div>
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+84 9xx xxx xxx"
                        className="h-9 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <div className="text-[11px] font-medium tracking-wide text-slate-300 uppercase">
                        Tiểu sử
                      </div>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Viết gì đó về bạn..."
                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                        rows={3}
                      />
                    </label>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-9 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                      >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: profile?.name || "",
                            email: profile?.email || "",
                            phone: (profile as any)?.phone || "",
                            bio: (profile as any)?.bio || "",
                          });
                        }}
                        className="flex-1 h-9 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-sm"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                          Tên
                        </div>
                        <div className="text-sm font-semibold text-slate-50">
                          {displayProfile.name}
                        </div>
                      </div>

                      {displayProfile.email && (
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                            Email
                          </div>
                          <div className="text-sm text-slate-200">
                            {displayProfile.email}
                          </div>
                        </div>
                      )}

                      {displayProfile.gender && (
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                            Giới tính
                          </div>
                          <div className="text-sm text-slate-200">
                            {displayProfile.gender}
                          </div>
                        </div>
                      )}
                    </div>

                    {(displayProfile.age ||
                      displayProfile.height ||
                      displayProfile.weight) && (
                      <div className="grid grid-cols-3 gap-2">
                        {displayProfile.age && (
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                              Tuổi
                            </div>
                            <div className="text-sm text-slate-200">
                              {displayProfile.age}
                            </div>
                          </div>
                        )}
                        {displayProfile.height && (
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                              Chiều cao
                            </div>
                            <div className="text-sm text-slate-200">
                              {displayProfile.height} cm
                            </div>
                          </div>
                        )}
                        {displayProfile.weight && (
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                              Cân nặng
                            </div>
                            <div className="text-sm text-slate-200">
                              {displayProfile.weight} kg
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {bmiValue !== null && (
                      <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 px-3 py-2.5 flex flex-col gap-1">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-200 uppercase">
                          BMI hiện tại
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-sky-300 tabular-nums">
                            {bmiValue.toFixed(1)}
                          </div>
                          <div className="text-sm text-slate-100">
                            {bmiCategory || "Chưa phân loại"}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Dựa trên cân nặng và chiều cao đã cập nhật từ hồ sơ.
                        </p>
                      </div>
                    )}

                    {(displayProfile as any).bio && (
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                          Tiểu sử
                        </div>
                        <div className="text-sm text-slate-200 whitespace-pre-wrap">
                          {(displayProfile as any).bio}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
