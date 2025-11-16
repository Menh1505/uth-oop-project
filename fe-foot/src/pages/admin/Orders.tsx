import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { ApiClient } from '../../lib/api/client';

interface Order {
  id: string;
  customerName: string;
  restaurant: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed';
  orderDate: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ApiClient.get<Order[]>('/orders');
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: Order['status']) => {
    const colors: Record<Order['status'], string> = {
      completed: 'bg-green-100 text-green-700',
      delivering: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-orange-100 text-orange-700',
      preparing: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels: Record<Order['status'], string> = {
      completed: 'Hoàn thành',
      delivering: 'Đang giao',
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
    };
    return labels[status] || status;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Quản lý Đơn hàng</h1>

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
                <p className="text-gray-600 text-sm">Tổng đơn hàng</p>
                <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Doanh thu</p>
                <p className="text-3xl font-bold text-green-600">
                  {(orders.reduce((sum, o) => sum + o.amount, 0) / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Đang giao</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === 'delivering').length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Hoàn thành</p>
                <p className="text-3xl font-bold text-purple-600">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-600">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Mã đơn</th>
                      <th className="px-6 py-3 text-left font-semibold">Khách hàng</th>
                      <th className="px-6 py-3 text-left font-semibold">Nhà hàng</th>
                      <th className="px-6 py-3 text-left font-semibold">Số tiền</th>
                      <th className="px-6 py-3 text-left font-semibold">Trạng thái</th>
                      <th className="px-6 py-3 text-left font-semibold">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{order.id}</td>
                        <td className="px-6 py-4">{order.customerName}</td>
                        <td className="px-6 py-4">{order.restaurant}</td>
                        <td className="px-6 py-4 font-semibold">{order.amount.toLocaleString()} đ</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{order.orderDate}</td>
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
