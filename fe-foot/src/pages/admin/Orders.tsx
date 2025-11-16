import { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

interface Order {
  id: string;
  customerName: string;
  restaurant: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed';
  orderDate: string;
}

export default function Orders() {
  const [orders] = useState<Order[]>([
    {
      id: '1',
      customerName: 'Nguyễn Văn A',
      restaurant: 'Nhà hàng A',
      amount: 250000,
      status: 'completed',
      orderDate: '2025-11-16 12:30',
    },
    {
      id: '2',
      customerName: 'Trần Thị B',
      restaurant: 'Nhà hàng B',
      amount: 180000,
      status: 'delivering',
      orderDate: '2025-11-16 14:15',
    },
  ]);

  return (
    <AdminLayout>
      <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quản lý Đơn hàng</h1>

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
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'delivering'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {order.status === 'completed' && 'Hoàn thành'}
                    {order.status === 'delivering' && 'Đang giao'}
                    {order.status === 'pending' && 'Chờ xác nhận'}
                    {order.status === 'confirmed' && 'Đã xác nhận'}
                    {order.status === 'preparing' && 'Đang chuẩn bị'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{order.orderDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </AdminLayout>
  );
}
