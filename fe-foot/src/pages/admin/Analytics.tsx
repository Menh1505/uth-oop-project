import AdminLayout from '../../components/layout/AdminLayout';

export default function AdminAnalytics() {
  return (
    <AdminLayout>
      <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics & Thống kê</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Doanh thu hôm nay</p>
          <p className="text-4xl font-bold text-green-600 mt-2">45.2M</p>
          <p className="text-sm text-green-600 mt-2">↑ 12% so với hôm qua</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Đơn hàng hôm nay</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">156</p>
          <p className="text-sm text-blue-600 mt-2">↑ 8% so với hôm qua</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Người dùng mới</p>
          <p className="text-4xl font-bold text-purple-600 mt-2">42</p>
          <p className="text-sm text-purple-600 mt-2">↑ 15% so với hôm qua</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Tỷ lệ hoàn thành</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">98.5%</p>
          <p className="text-sm text-orange-600 mt-2">↑ 2% so với hôm qua</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top nhà hàng</h2>
          <div className="space-y-3">
            {[
              { name: 'Nhà hàng A', orders: 245, revenue: '25.3M' },
              { name: 'Nhà hàng B', orders: 189, revenue: '18.7M' },
              { name: 'Nhà hàng C', orders: 156, revenue: '15.2M' },
              { name: 'Nhà hàng D', orders: 123, revenue: '12.1M' },
            ].map((restaurant) => (
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
            {[
              { name: 'Nguyễn Văn A', orders: 18, spent: '4.5M' },
              { name: 'Trần Thị B', orders: 14, spent: '3.2M' },
              { name: 'Phạm Văn C', orders: 12, spent: '2.8M' },
              { name: 'Hoàng Thị D', orders: 10, spent: '2.3M' },
            ].map((customer) => (
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
      </div>
    </AdminLayout>
  );
}
