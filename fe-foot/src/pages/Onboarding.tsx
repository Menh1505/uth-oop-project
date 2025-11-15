import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import type { UserProfile } from "../types";
import { useAppStore } from "../store/useAppStore";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('Không tìm thấy token, vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      // Prepare profile data to send to backend
      const profileData: any = {
        full_name: fd.get("fullName")?.toString() || "",
        phone: fd.get("phone")?.toString() || "",
        date_of_birth: fd.get("dateOfBirth")?.toString() || null,
        gender: fd.get("gender")?.toString() || null,
        bio: fd.get("bio")?.toString() || "",
        timezone: fd.get("timezone")?.toString() || "Asia/Ho_Chi_Minh",
        language: fd.get("language")?.toString() || "vi"
      };

      // If avatar file is selected, upload it separately
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile);
        
        const avatarResponse = await fetch('/api/users/me/avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: avatarFormData,
        });

        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json();
          avatarUrl = avatarData.avatar_url;
          profileData.avatar_url = avatarUrl;
        } else {
          console.warn('Avatar upload failed, continuing without avatar');
        }
      }

      // Send profile to backend
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Cập nhật profile thất bại');
      }

      await response.json();

      // Update local store
      const profile: UserProfile = {
        name: profileData.full_name || "User",
        avatar: avatarUrl || avatarPreview || undefined,
        goal: 'maintain',
        diet: 'balanced',
        budgetPerMeal: 90000,
        timePerWorkout: 30,
        username: "",
        role: 'user',
        needsOnboarding: false
      };

      completeOnboarding(profile);
      navigate('/journal');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn một tệp hình ảnh');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Hình ảnh không được vượt quá 5MB');
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
    <div className="max-w-2xl mx-auto p-4">
      <Card title="Hồ Sơ Cá Nhân">
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 pb-4 border-b">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="text-2xl">📸</div>
                  <div className="text-xs">Hình ảnh</div>
                </div>
              )}
            </div>
            <div>
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
              >
                Chọn hình ảnh
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Tối đa 5MB, định dạng JPG, PNG
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <label className="block">
              <div className="text-sm font-medium mb-1">Họ và tên *</div>
              <Input 
                name="fullName" 
                placeholder="Nguyễn Văn A"
                required
              />
            </label>

            {/* Phone */}
            <label className="block">
              <div className="text-sm font-medium mb-1">Số điện thoại</div>
              <Input 
                name="phone" 
                type="tel"
                placeholder="+84 9xx xxx xxx"
              />
            </label>

            {/* Date of Birth */}
            <label className="block">
              <div className="text-sm font-medium mb-1">Ngày sinh</div>
              <Input 
                name="dateOfBirth" 
                type="date"
              />
            </label>

            {/* Gender */}
            <label className="block">
              <div className="text-sm font-medium mb-1">Giới tính</div>
              <Select name="gender" defaultValue="">
                <option value="">Không chọn</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
                <option value="prefer_not_to_say">Không muốn tiết lộ</option>
              </Select>
            </label>

            {/* Timezone */}
            <label className="block">
              <div className="text-sm font-medium mb-1">Múi giờ</div>
              <Select name="timezone" defaultValue="Asia/Ho_Chi_Minh">
                <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
                <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                <option value="Asia/Kolkata">Ấn Độ (GMT+5:30)</option>
                <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                <option value="America/New_York">New York (GMT-5)</option>
                <option value="Europe/London">London (GMT+0)</option>
              </Select>
            </label>

            {/* Language */}
            <label className="block">
              <div className="text-sm font-medium mb-1">Ngôn ngữ</div>
              <Select name="language" defaultValue="vi">
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
                <option value="zh">中文</option>
              </Select>
            </label>
          </div>

          {/* Bio */}
          <label className="block">
            <div className="text-sm font-medium mb-1">Tiểu sử cá nhân</div>
            <textarea 
              name="bio" 
              placeholder="Viết gì đó về bạn..."
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </label>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Hoàn tất'}
            </Button>
            <Button 
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
            >
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
