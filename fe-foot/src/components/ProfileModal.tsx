import { useState } from 'react';
import Button from './ui/Button';
import { Input } from './ui/Input';
import type { UserProfile } from '../types';

interface ProfileModalProps {
  profile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (profile: Partial<UserProfile>) => Promise<void>;
}

export default function ProfileModal({ profile, isOpen, onClose, onUpdate }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
  });

  if (!isOpen || !profile) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      setError(err.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b flex items-center justify-between p-4">
          <h2 className="text-xl font-bold">Hồ Sơ Cá Nhân</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-3xl">👤</div>
              )}
            </div>
            {!isEditing && (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
              >
                Chỉnh sửa hồ sơ
              </Button>
            )}
          </div>

          {/* Profile Info */}
          {isEditing ? (
            // Edit Mode
            <div className="space-y-3">
              <label className="block">
                <div className="text-sm font-medium mb-1">Tên</div>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Tên của bạn"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium mb-1">Email</div>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium mb-1">Số điện thoại</div>
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+84 9xx xxx xxx"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium mb-1">Tiểu sử</div>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Viết gì đó về bạn..."
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </label>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Đang lưu...' : 'Lưu'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: profile.name,
                      email: profile.email || '',
                      phone: profile.phone || '',
                      bio: profile.bio || '',
                    });
                  }}
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-600">Tên</div>
                <div className="text-lg font-semibold">{profile.name}</div>
              </div>

              {profile.email && (
                <div>
                  <div className="text-sm font-medium text-gray-600">Email</div>
                  <div className="text-gray-700">{profile.email}</div>
                </div>
              )}

              {profile.phone && (
                <div>
                  <div className="text-sm font-medium text-gray-600">Số điện thoại</div>
                  <div className="text-gray-700">{profile.phone}</div>
                </div>
              )}

              {profile.bio && (
                <div>
                  <div className="text-sm font-medium text-gray-600">Tiểu sử</div>
                  <div className="text-gray-700 whitespace-pre-wrap">{profile.bio}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="bg-blue-50 rounded p-3">
                  <div className="text-xs text-gray-600">Mục tiêu</div>
                  <div className="font-semibold text-blue-600 capitalize">
                    {profile.goal}
                  </div>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <div className="text-xs text-gray-600">Chế độ ăn</div>
                  <div className="font-semibold text-green-600 capitalize">
                    {profile.diet}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
