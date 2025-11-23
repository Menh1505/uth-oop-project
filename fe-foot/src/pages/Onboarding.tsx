import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import type { UserProfile } from "../types";
import { useAppStore } from "../store/useAppStore";
import { useState, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
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

  const submit = async (e: FormEvent<HTMLFormElement>) => {
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
          ? parseInt(fd.get("age")?.toString() || "0", 10)
          : null,
        weight: fd.get("weight")
          ? parseFloat(fd.get("weight")?.toString() || "0")
          : null,
        height: fd.get("height")
          ? parseFloat(fd.get("height")?.toString() || "0")
          : null,
        fitness_goal: "maintain", // Default goal to complete onboarding
      };

      // Upload avatar: ưu tiên gửi FormData, fallback base64 nếu cần
      let avatarUrl: string | null = null;
      if (avatarFile && avatarFile.size > 0) {
        const fdAvatar = new FormData();
        fdAvatar.append("avatar", avatarFile);
        try {
          const avatarData = await ApiClient.post<{
            user?: { profile_picture_url?: string };
            profile_picture_url?: string;
          }>("/users/me/avatar", fdAvatar);

          const uploadedUrl =
            avatarData?.profile_picture_url ||
            avatarData?.user?.profile_picture_url ||
            avatarPreview;

          if (uploadedUrl) {
            avatarUrl = uploadedUrl;
            profileData.profile_picture_url = uploadedUrl;
          }
        } catch (err) {
          console.warn("Avatar upload failed, continuing without avatar", err);
        }
      } else if (avatarPreview) {
        try {
          const avatarData = await ApiClient.post<{
            user?: { profile_picture_url?: string };
            profile_picture_url?: string;
          }>("/users/me/avatar", {
            avatar: avatarPreview,
          });

          const uploadedUrl =
            avatarData?.profile_picture_url ||
            avatarData?.user?.profile_picture_url ||
            avatarPreview;

          if (uploadedUrl) {
            avatarUrl = uploadedUrl;
            profileData.profile_picture_url = uploadedUrl;
          }
        } catch (err) {
          console.warn("Avatar upload failed, continuing without avatar", err);
        }
      }

      // Cập nhật thông tin user
      await ApiClient.put("/users/me", profileData);

      // Cập nhật state phía frontend
      const profile: UserProfile = {
        user_id: "",
        name: profileData.name || "User",
        email: "",
        profile_picture_url: avatarUrl || avatarPreview || undefined,
        gender: profileData.gender,
        age: profileData.age || undefined,
        height: profileData.height || undefined,
        weight: profileData.weight || undefined,
        dietary_restrictions: [],
        allergies: [],
        health_conditions: [],
        fitness_goals: ["maintain"],
        is_premium: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <Card
          title="Hồ Sơ Cá Nhân"
          className="rounded-3xl border border-slate-200 bg-white shadow-xl px-8 py-10"
        >
          <form onSubmit={submit} className="space-y-7">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="mt-[2px] text-base">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-slate-200">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-sky-400 to-emerald-400 p-[3px] shadow-md">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-slate-500">
                          <div className="text-2xl mb-1">📸</div>
                          <div className="text-xs">Thêm ảnh đại diện</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs rounded-full bg-white px-4 py-1 border border-slate-200 text-slate-700 shadow">
                    Bước 1 · Hình ảnh
                  </div>
                </div>

                <div className="pt-6 text-center">
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
                    className="h-10 rounded-xl px-5 text-sm font-medium bg-sky-500 hover:bg-sky-400 text-white shadow"
                  >
                    Chọn hình ảnh
                  </Button>
                  <p className="mt-2 text-xs text-slate-500">
                    Tối đa 5MB · JPG, PNG · Có thể đổi lại sau
                  </p>
                </div>
              </div>
            </div>

            {/* Basic info */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
                  Thông tin cơ bản
                </h3>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <label className="block md:col-span-2 space-y-1">
                  <span className="text-xs font-medium text-slate-700 uppercase">
                    Họ và tên <span className="text-red-500">*</span>
                  </span>
                  <Input
                    name="fullName"
                    placeholder="Nguyễn Văn A"
                    required
                    className="h-11 rounded-xl bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500"
                  />
                </label>

                {/* Gender */}
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 uppercase">
                    Giới tính
                  </span>
                  <Select
                    name="gender"
                    className="h-11 rounded-xl bg-white border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-sky-500"
                  >
                    <option value="">Không chọn</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </Select>
                </label>

                {/* Age */}
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 uppercase">
                    Tuổi
                  </span>
                  <Input
                    name="age"
                    type="number"
                    min="13"
                    max="120"
                    placeholder="25"
                    className="h-11 rounded-xl bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500"
                  />
                </label>

                {/* Weight */}
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 uppercase">
                    Cân nặng (kg)
                  </span>
                  <Input
                    name="weight"
                    type="number"
                    placeholder="70"
                    className="h-11 rounded-xl bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500"
                  />
                </label>

                {/* Height */}
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-700 uppercase">
                    Chiều cao (cm)
                  </span>
                  <Input
                    name="height"
                    type="number"
                    placeholder="170"
                    className="h-11 rounded-xl bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-sky-500"
                  />
                </label>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow disabled:opacity-60"
              >
                {loading ? "Đang lưu..." : "Hoàn tất thiết lập"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/")}
                className="flex-1 h-11 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
