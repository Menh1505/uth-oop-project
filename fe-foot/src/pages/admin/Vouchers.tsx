import { useState, useEffect } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { ApiClient } from "../../lib/api/client";

interface Voucher {
  id: string;
  code: string;
  discount: number;
  maxUses: number;
  used: number;
  status: "active" | "inactive";
  expiryDate: string;
}

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ApiClient.get<Voucher[]>("/vouchers");
      setVouchers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải vouchers");
      // Fallback to empty list
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const createVoucher = async () => {
    const code = prompt("Nhập mã voucher:");
    if (!code) return;

    const discount = prompt("Nhập % giảm giá:");
    if (!discount) return;

    try {
      const newVoucher = {
        code,
        discount: parseInt(discount),
        maxUses: 100,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      };

      await ApiClient.post("/vouchers", newVoucher);
      await fetchVouchers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tạo voucher");
    }
  };

  if (loading) return <AdminLayout><div className="p-8">Đang tải...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quản lý Voucher & Khuyến mãi</h1>
          <button onClick={createVoucher} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Tạo voucher mới
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

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
              {vouchers.reduce((sum, v) => sum + v.used * v.discount, 0)}%
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
                        voucher.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {voucher.status === "active" ? "Hoạt động" : "Ngừng"}
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
