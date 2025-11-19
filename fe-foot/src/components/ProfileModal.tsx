import { useState } from "react";
import Button from "./ui/Button";
import { Input } from "./ui/Input";
import type { UserProfile } from "../types";

interface ProfileModalProps {
  profile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (profile: Partial<UserProfile>) => Promise<void>;
}

export default function ProfileModal({
  profile,
  isOpen,
  onClose,
  onUpdate,
}: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
  });

  if (!isOpen || !profile) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUpdate({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 text-slate-50 shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/80 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Hồ Sơ Cá Nhân
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Quản lý thông tin tài khoản FitFood của bạn
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900 text-slate-400 text-base hover:bg-slate-800 hover:text-slate-100 transition"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                <span className="mt-[2px] text-base">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-800/70">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 via-sky-500 to-indigo-500 p-[3px] shadow-lg shadow-emerald-500/30">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-3xl">👤</div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[11px] rounded-full bg-slate-900 px-3 py-1 border border-slate-700 text-slate-200 shadow-sm">
                  Ảnh đại diện
                </div>
              </div>

              {!isEditing && (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-4 h-9 rounded-xl px-4 text-sm font-medium bg-sky-500 hover:bg-sky-400 shadow-sm"
                >
                  Chỉnh sửa hồ sơ
                </Button>
              )}
            </div>

            {/* Profile Info */}
            {isEditing ? (
              // Edit Mode
              <div className="space-y-3 pt-1">
                <label className="block space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-300 uppercase">
                    Tên
                  </div>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Tên của bạn"
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-300 uppercase">
                    Email
                  </div>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-300 uppercase">
                    Số điện thoại
                  </div>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+84 9xx xxx xxx"
                    className="h-10 rounded-xl bg-slate-900 border-slate-700 text-sm text-slate-50 placeholder:text-slate-500"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-300 uppercase">
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

                <div className="flex flex-col sm:flex-row gap-2 pt-3">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 h-10 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: profile.name,
                        email: profile.email || "",
                        phone: profile.phone || "",
                        bio: profile.bio || "",
                      });
                    }}
                    className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4 pt-1">
                <div className="space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Tên
                  </div>
                  <div className="text-lg font-semibold text-slate-50">
                    {profile.name}
                  </div>
                </div>

                {profile.email && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                      Email
                    </div>
                    <div className="text-sm text-slate-200">
                      {profile.email}
                    </div>
                  </div>
                )}

                {profile.phone && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                      Số điện thoại
                    </div>
                    <div className="text-sm text-slate-200">
                      {profile.phone}
                    </div>
                  </div>
                )}

                {profile.bio && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                      Tiểu sử
                    </div>
                    <div className="text-sm text-slate-200 whitespace-pre-wrap">
                      {profile.bio}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5">
                    <div className="text-[11px] font-medium tracking-wide text-slate-200 uppercase">
                      Mục tiêu
                    </div>
                    <div className="mt-1 text-sm font-semibold text-sky-200 capitalize">
                      {profile.goal}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
                    <div className="text-[11px] font-medium tracking-wide text-slate-200 uppercase">
                      Chế độ ăn
                    </div>
                    <div className="mt-1 text-sm font-semibold text-emerald-200 capitalize">
                      {profile.diet}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
