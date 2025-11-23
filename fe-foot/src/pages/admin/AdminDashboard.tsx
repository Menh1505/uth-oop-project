import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import AdminLayout from "../../components/layout/AdminLayout";
import { ApiClient } from "../../lib/api/client";

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats
      const statsData = await ApiClient.get<AdminStats>("/admin/stats");
      setStats(statsData);
      
      // Fetch users
      const usersData = await ApiClient.get<User[]>("/admin/users");
      setUsers(usersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Xóa user này?")) return;

    try {
      await ApiClient.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting user");
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="p-8 text-center">Đang tải...</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card title="Total Users">
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </Card>
            <Card title="Total Orders">
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </Card>
            <Card title="Total Revenue">
              <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} VND</p>
            </Card>
            <Card title="Active Users">
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </Card>
          </div>
        )}

        <Card title="Users">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Username</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.id}</td>
                    <td className="p-2">{user.username}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">{user.role}</td>
                    <td className="p-2">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
