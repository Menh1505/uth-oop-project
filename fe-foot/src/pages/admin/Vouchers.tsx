import { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

interface Voucher {
  id: string;
  code: string;
  discount: number;
  maxUses: number;
  used: number;
  status: 'active' | 'inactive';
  expiryDate: string;
}

export default function Vouchers() {
  const [vouchers] = useState<Voucher[]>([
    {
      id: '1',
      code: 'FITFOOD10',
      discount: 10,
      maxUses: 100,
      used: 45,
      status: 'active',
      expiryDate: '2025-12-31',
    },
    {
      id: '2',
      code: 'NEWUSER20',
      discount: 20,
      maxUses: 200,
      used: 156,
      status: 'active',
      expiryDate: '2025-11-30',
    },
  ]);

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Voucher & Khuyến mãi</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Tạo voucher mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Tổng voucher</p>
          <p className="text-3xl font-bold text-blue-600">{vouchers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Đã sử dụng</p>
          <p className="text-3xl font-bold text-green-600">
            {vouchers.reduce((sum, v) => sum + v.used, 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Tổng giảm</p>
          <p className="text-3xl font-bold text-purple-600">
            {vouchers.reduce((sum, v) => sum + (v.used * v.discount), 0)}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Mã voucher</th>
              <th className="px-6 py-3 text-left font-semibold">Giảm giá</th>
              <th className="px-6 py-3 text-left font-semibold">Sử dụng</th>
              <th className="px-6 py-3 text-left font-semibold">Trạng thái</th>
              <th className="px-6 py-3 text-left font-semibold">Hết hạn</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((voucher) => (
              <tr key={voucher.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-bold text-blue-600">{voucher.code}</td>
                <td className="px-6 py-4">{voucher.discount}%</td>
                <td className="px-6 py-4">
                  {voucher.used}/{voucher.maxUses}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      voucher.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {voucher.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{voucher.expiryDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </AdminLayout>
  );
}
