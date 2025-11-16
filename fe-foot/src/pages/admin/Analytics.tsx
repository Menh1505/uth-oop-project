import { useState, useEffect } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { ApiClient } from "../../lib/api/client";

interface AnalyticsData {
  revenue: number;
  ordersCount: number;
  newUsers: number;
  completionRate: number;
  topRestaurants?: Array<{ name: string; orders: number; revenue: string }>;
  topCustomers?: Array<{ name: string; orders: number; spent: string }>;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ApiClient.get<AnalyticsData>("/admin/analytics");
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải analytics");
      // Use mock data as fallback
      useMockAnalytics();
    } finally {
      setLoading(false);
    }
  };

  const useMockAnalytics = () => {
    setAnalytics({
      revenue: 45200000,
      ordersCount: 156,
      newUsers: 42,
      completionRate: 98.5,
      topRestaurants: [
        { name: "Nhà hàng A", orders: 245, revenue: "25.3M" },
        { name: "Nhà hàng B", orders: 189, revenue: "18.7M" },
        { name: "Nhà hàng C", orders: 156, revenue: "15.2M" },
        { name: "Nhà hàng D", orders: 123, revenue: "12.1M" },
      ],
      topCustomers: [
        { name: "Nguyễn Văn A", orders: 18, spent: "4.5M" },
        { name: "Trần Thị B", orders: 14, spent: "3.2M" },
        { name: "Phạm Văn C", orders: 12, spent: "2.8M" },
        { name: "Hoàng Thị D", orders: 10, spent: "2.3M" },
      ],
    });
  };

  if (loading) return <AdminLayout><div className="p-8">Đang tải...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics & Thống kê</h1>

        {error && <div className="bg-yellow-50 text-yellow-700 p-3 rounded text-sm mb-4">Lỗi: {error} (dùng mock data)</div>}

        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm font-medium">Doanh thu hôm nay</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {(analytics.revenue / 1000000).toFixed(1)}M
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm font-medium">Đơn hàng hôm nay</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{analytics.ordersCount}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm font-medium">Người dùng mới</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">{analytics.newUsers}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm font-medium">Tỷ lệ hoàn thành</p>
                <p className="text-4xl font-bold text-orange-600 mt-2">{analytics.completionRate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Top nhà hàng</h2>
                <div className="space-y-3">
                  {analytics.topRestaurants?.map((restaurant) => (
                    <div key={restaurant.name} className="flex justify-between items-center pb-3 border-b">
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-gray-600">{restaurant.orders} đơn hàng</p>
                      </div>
                      <p className="font-bold text-green-600">{restaurant.revenue}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Top khách hàng</h2>
                <div className="space-y-3">
                  {analytics.topCustomers?.map((customer) => (
                    <div key={customer.name} className="flex justify-between items-center pb-3 border-b">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.orders} đơn hàng</p>
                      </div>
                      <p className="font-bold text-blue-600">{customer.spent}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
