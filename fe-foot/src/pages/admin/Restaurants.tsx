import { useState, useEffect } from 'react';

import AdminLayout from '../../components/layout/AdminLayout';
import { ApiClient } from '../../lib/api/client';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  cuisine: string;
  isActive: boolean;
  createdAt: string;
}

interface FormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  cuisine: string;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    cuisine: '',
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ApiClient.get('/restaurants');
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await ApiClient.post('/restaurants', formData);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        cuisine: '',
      });
      setShowForm(false);
      fetchRestaurants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create restaurant');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa nhà hàng này?')) return;
    try {
      setError('');
      await ApiClient.delete(`/restaurants/${id}`);
      fetchRestaurants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete restaurant');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quản lý Nhà hàng</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ➕
            Thêm nhà hàng
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Thêm nhà hàng mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên nhà hàng</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Điện thoại</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Loại món ăn</label>
                <input
                  type="text"
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Tạo
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Không có nhà hàng nào</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg">
                <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{restaurant.address}</p>
                <p className="text-sm text-gray-600">📞 {restaurant.phone}</p>
                <p className="text-sm text-gray-600">📧 {restaurant.email}</p>
                <p className="text-sm text-gray-600">🍴 {restaurant.cuisine}</p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleDelete(restaurant.id)}
                    className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
