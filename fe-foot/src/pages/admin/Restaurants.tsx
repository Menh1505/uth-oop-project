import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive';
  rating: number;
  totalOrders: number;
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {
      id: '1',
      name: 'Nhà hàng A',
      address: '123 Đường ABC, Hà Nội',
      phone: '+84901234567',
      status: 'active',
      rating: 4.5,
      totalOrders: 245,
    },
    {
      id: '2',
      name: 'Nhà hàng B',
      address: '456 Đường XYZ, TP.HCM',
      phone: '+84912345678',
      status: 'active',
      rating: 4.2,
      totalOrders: 189,
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Nhà hàng</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Thêm nhà hàng
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Thêm nhà hàng mới</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên nhà hàng</label>
              <input
                type="text"
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Nhập tên nhà hàng"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ</label>
              <input
                type="text"
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Nhập địa chỉ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input
                type="tel"
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Tên nhà hàng</th>
              <th className="px-6 py-3 text-left font-semibold">Địa chỉ</th>
              <th className="px-6 py-3 text-left font-semibold">Điểm đánh giá</th>
              <th className="px-6 py-3 text-left font-semibold">Đơn hàng</th>
              <th className="px-6 py-3 text-left font-semibold">Trạng thái</th>
              <th className="px-6 py-3 text-left font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{restaurant.name}</td>
                <td className="px-6 py-4">{restaurant.address}</td>
                <td className="px-6 py-4">⭐ {restaurant.rating}</td>
                <td className="px-6 py-4">{restaurant.totalOrders}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      restaurant.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {restaurant.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Eye size={18} />
                  </button>
                  <button className="text-yellow-600 hover:text-yellow-700">
                    <Edit2 size={18} />
                  </button>
                  <button className="text-red-600 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </AdminLayout>
  );
}
