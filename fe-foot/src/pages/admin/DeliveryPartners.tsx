import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { ApiClient } from '../../lib/api/client';

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'busy' | 'offline';
  completedDeliveries?: number;
  rating?: number;
}

export default function DeliveryPartners() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ApiClient.get<DeliveryPartner[]>('/deliveries/drivers');
      setPartners(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: DeliveryPartner['status']) => {
    const labels: Record<DeliveryPartner['status'], string> = {
      available: 'Sẵn sàng',
      busy: 'Đang giao',
      offline: 'Ngoại tuyến',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: DeliveryPartner['status']) => {
    const colors: Record<DeliveryPartner['status'], string> = {
      available: 'bg-green-100 text-green-700',
      busy: 'bg-yellow-100 text-yellow-700',
      offline: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quản lý Đối tác giao hàng</h1>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={20} />
            Thêm đối tác
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Tổng đối tác</p>
                <p className="text-3xl font-bold text-blue-600">{partners.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Đang sẵn sàng</p>
                <p className="text-3xl font-bold text-green-600">
                  {partners.filter(p => p.status === 'available').length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Đang giao hàng</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {partners.filter(p => p.status === 'busy').length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Tổng lần giao</p>
                <p className="text-3xl font-bold text-purple-600">
                  {partners.reduce((sum, p) => sum + (p.completedDeliveries || 0), 0)}
                </p>
              </div>
            </div>

            {partners.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-600">Chưa có đối tác giao hàng nào</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Tên</th>
                      <th className="px-6 py-3 text-left font-semibold">Điện thoại</th>
                      <th className="px-6 py-3 text-left font-semibold">Phương tiện</th>
                      <th className="px-6 py-3 text-left font-semibold">Trạng thái</th>
                      <th className="px-6 py-3 text-left font-semibold">Lần giao</th>
                      <th className="px-6 py-3 text-left font-semibold">Đánh giá</th>
                      <th className="px-6 py-3 text-left font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner) => (
                      <tr key={partner.id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{partner.name}</td>
                        <td className="px-6 py-4">{partner.phone}</td>
                        <td className="px-6 py-4">{partner.vehicle || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(partner.status)}`}>
                            {getStatusLabel(partner.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">{partner.completedDeliveries || '-'}</td>
                        <td className="px-6 py-4">⭐ {partner.rating || '-'}</td>
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
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
