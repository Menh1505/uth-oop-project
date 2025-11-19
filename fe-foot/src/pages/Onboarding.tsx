import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import type { UserProfile } from "../types";
import { useAppStore } from "../store/useAppStore";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ApiClient } from "../lib/api/client";

export default function Onboarding() {
  const { completeOnboarding } = useAppStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData(e.currentTarget);
      const token = localStorage.getItem("authToken");

      if (!token) {
        setError("Không tìm thấy token, vui lòng đăng nhập lại");
        navigate("/login");
        return;
      }

      const profileData: any = {
        name: fd.get("fullName")?.toString() || "",
        gender: fd.get("gender")?.toString() || null,
        age: fd.get("age")
          ? parseInt(fd.get("age")?.toString() || "0")
          : null,
        weight: fd.get("weight")
          ? parseFloat(fd.get("weight")?.toString() || "0")
          : null,
        height: fd.get("height")
          ? parseFloat(fd.get("height")?.toString() || "0")
          : null,
      };

      let avatarUrl: string | null = null;
      if (avatarFile && avatarFile.size > 0) {
        const avatarFormData = new FormData();
        avatarFormData.append("avatar", avatarFile);

        try {
          const avatarData = await ApiClient.post<{
            profile_picture_url: string;
          }>("/users/me/avatar", avatarFormData);
          if (avatarData?.profile_picture_url) {
            avatarUrl = avatarData.profile_picture_url;
            profileData.profile_picture_url = avatarUrl;
          }
        } catch (err) {
          console.warn("Avatar upload failed, continuing without avatar");
        }
      }

      await ApiClient.put("/users/me", profileData);

      const profile: UserProfile = {
        name: profileData.name || "User",
        avatar: avatarUrl || avatarPreview || undefined,
        goal: "maintain",
        diet: "balanced",
        budgetPerMeal: 90000,
        timePerWorkout: 30,
        username: "",
        role: "user",
        needsOnboarding: false,
      };

      completeOnboarding(profile);
      navigate("/journal");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn một tệp hình ảnh");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Hình ảnh không được vượt quá 5MB");
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <Card
          title="Hồ Sơ Cá Nhân"
          // nếu Card hỗ trợ className thì mở comment:
          // className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/60"
        >
          <form onSubmit={submit} className="space-y-6">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-200">
                <span className="mt-[2px] text-base">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-slate-800/70">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 via-sky-500 to-indigo-500 p-[3px] shadow-lg shadow-emerald-500/30">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <div className="text-2xl mb-1">📸</div>
                        <div className="text-[11px]">Thêm ảnh đại diện</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[11px] rounded-full bg-slate-900 px-3 py-1 border border-slate-700 text-slate-200 shadow-sm">
                  Bước 1 · Hình ảnh
                </div>
              </div>

              <div className="pt-3 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 rounded-xl px-4 text-sm font-medium bg-sky-500 hover:bg-sky-400 shadow-sm"
                >
                  Chọn hình ảnh
                </Button>
                <p className="mt-2 text-[11px] text-slate-400">
                  Tối đa 5MB • JPG, PNG • Có thể đổi lại sau
                </p>
              </div>
            </div>

            {/* Basic info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                  Thông tin cơ bản
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-700 via-slate-800 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <label className="block md:col-span-2 space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-300 uppercase">
                    Họ và tên <span className="text-red-400">*</span>
                  </div>
                  <Input
                    name="fullName"
                    placeholder="Nguyễn Văn A"
                    required
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </label>

                {/* Gender */}
                <label className="block space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-300 uppercase">
                    Giới tính
                  </div>
                  <Select
                    name="gender"
                    defaultValue=""
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50"
                  >
                    <option value="">Không chọn</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </Select>
                </label>

                {/* Age */}
                <label className="block space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-300 uppercase">
                    Tuổi
                  </div>
                  <Input
                    name="age"
                    type="number"
                    min="13"
                    max="120"
                    placeholder="25"
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </label>

                {/* Weight (kg) */}
                <label className="block space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-300 uppercase">
                    Cân nặng (kg)
                  </div>
                  <Input
                    name="weight"
                    type="number"
                    min="20"
                    max="200"
                    step="0.1"
                    placeholder="70"
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </label>

                {/* Height (cm) */}
                <label className="block space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-300 uppercase">
                    Chiều cao (cm)
                  </div>
                  <Input
                    name="height"
                    type="number"
                    min="100"
                    max="250"
                    step="0.1"
                    placeholder="170"
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800/70">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-400 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Đang lưu..." : "Hoàn tất thiết lập"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex-1 h-11 rounded-xl font-medium border border-slate-700/70 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
