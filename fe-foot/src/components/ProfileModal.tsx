import { useEffect, useState } from "react";
import Button from "./ui/Button";
import { Input } from "./ui/Input";
import type { UserProfile } from "../types";
import { ApiClient } from "../lib/api/client";

// Mở rộng thêm các field backend trả về
type CombinedProfile = UserProfile & {
  gender?: string | null;
  age?: number | null;
  weight?: string | null;
  height?: string | null;
  fitness_goal?: string | null;
  preferred_diet?: string | null;
  subscription_status?: string | null;
  profile_picture_url?: string | null;
};

interface ProfileModalProps {
  profile: CombinedProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (profile: Partial<CombinedProfile>) => Promise<void>;
}

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

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: (profile as any)?.phone || "",
    bio: (profile as any)?.bio || "",
  });

  // Khi prop profile đổi, sync lại form
  useEffect(() => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: (profile as any)?.phone || "",
      bio: (profile as any)?.bio || "",
    });
  }, [profile]);

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
    return () => {
      active = false;
    };
  }, [isOpen, profile]);

  if (!isOpen) return null;
  // Ưu tiên dữ liệu từ server, fallback về profile prop
  const displayProfile = (serverProfile || profile) as CombinedProfile | null;
  if (!displayProfile) return null;

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
        // tuỳ backend có support phone/bio hay không
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

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-800/70">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 via-sky-500 to-indigo-500 p-[3px] shadow-lg shadow-emerald-500/30">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayProfile.name}
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
                  disabled={fetching}
                >
                  {fetching ? "Đang tải..." : "Chỉnh sửa hồ sơ"}
                </Button>
              )}
            </div>

            {/* Info */}
            {isEditing ? (
              // EDIT MODE
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
                    disabled={saving}
                    className="flex-1 h-10 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              // VIEW MODE
              <div className="space-y-4 pt-1">
                <div className="space-y-1">
                  <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Tên
                  </div>
                  <div className="text-lg font-semibold text-slate-50">
                    {displayProfile.name}
                  </div>
                </div>

                {displayProfile.email && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                      Email
                    </div>
                    <div className="text-sm text-slate-200">
                      {displayProfile.email}
                    </div>
                  </div>
                )}

                {displayProfile.gender && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                      Giới tính
                    </div>
                    <div className="text-sm text-slate-200">
                      {displayProfile.gender}
                    </div>
                  </div>
                )}

                {(displayProfile.age ||
                  displayProfile.height ||
                  displayProfile.weight) && (
                  <div className="grid grid-cols-3 gap-3">
                    {displayProfile.age && (
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                          Tuổi
                        </div>
                        <div className="text-sm text-slate-200">
                          {displayProfile.age}
                        </div>
                      </div>
                    )}
                    {displayProfile.height && (
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                          Chiều cao
                        </div>
                        <div className="text-sm text-slate-200">
                          {displayProfile.height} cm
                        </div>
                      </div>
                    )}
                    {displayProfile.weight && (
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                          Cân nặng
                        </div>
                        <div className="text-sm text-slate-200">
                          {displayProfile.weight} kg
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(displayProfile as any).bio && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                      Tiểu sử
                    </div>
                    <div className="text-sm text-slate-200 whitespace-pre-wrap">
                      {(displayProfile as any).bio}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5">
                    <div className="text-[11px] font-medium tracking-wide text-slate-200 uppercase">
                      Mục tiêu
                    </div>
                    <div className="mt-1 text-sm font-semibold text-sky-200 capitalize">
                      {goalText}
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
