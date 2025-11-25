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
  subscriptionStatus?: string;
  createdAt?: string;
}

interface Session {
  _id: string;
  user_id: string;
  ip?: string;
  user_agent?: string;
  login_method?: string;
  created_at: string;
  expires_at: string;
  current?: boolean;
}

const pickUserId = (record: any): string => {
  return (
    record?.id ||
    record?._id ||
    record?.user_id ||
    record?.email ||
    record?.username ||
    `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
};

const normalizeUsersResponse = (data: unknown): User[] => {
  const candidates = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.users)
      ? (data as any).users
      : Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray((data as any)?.users?.users)
          ? (data as any).users.users
          : [];

  return candidates.map((record: any) => ({
    id: pickUserId(record),
    username: record?.username || record?.name || record?.email || "Unknown",
    email: record?.email || "—",
    role:
      (record?.role || (record?.email?.includes("admin") ? "admin" : "user")) ??
      "user",
    subscriptionStatus: record?.subscription_status || record?.status,
    createdAt: record?.created_at,
  }));
};

const normalizeSessionResponse = (
  sessionsData: { items?: Session[] } | Session[] | undefined,
  normalizeUserId: (value: unknown) => string
): Session[] => {
  const rawList = Array.isArray((sessionsData as any)?.items)
    ? ((sessionsData as { items?: Session[] }).items as Session[])
    : Array.isArray(sessionsData)
      ? (sessionsData as Session[])
      : [];

  return rawList.map((session: any) => ({
    ...session,
    user_id: normalizeUserId(session?.user_id),
  }));
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchSessionsWithFallback = async () => {
    try {
      const sessionsData =
        await ApiClient.get<{ items?: Session[] } | Session[]>(
          "/admin/sessions"
        );
      return normalizeSessionResponse(sessionsData, normalizeUserId);
    } catch (primaryError) {
      console.warn(
        "[AdminDashboard] /admin/sessions failed, fallback to /auth/sessions",
        primaryError
      );
      const fallbackData = await ApiClient.get<{ items?: Session[] } | Session[]>(
        "/auth/sessions"
      );
      return normalizeSessionResponse(fallbackData, normalizeUserId);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const usersDataRaw = await fetchUsersWithFallback();
      const normalizedUsers = normalizeUsersResponse(usersDataRaw);
      setUsers(normalizedUsers);

      const statsData = await fetchStatsWithFallback(normalizedUsers);
      setStats(statsData);

      const sessionsList = await fetchSessionsWithFallback();
      setSessions(sessionsList);
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

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Xóa phiên đăng nhập này?")) return;
    try {
      await ApiClient.delete(`/admin/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((session) => session._id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting session");
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString("vi-VN", {
          hour12: false,
        });
  };

  const normalizeUserId = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (typeof obj.$oid === "string") return obj.$oid;
      if (typeof obj._id === "string") return obj._id;
      if (typeof obj.id === "string") return obj.id;
      if (typeof obj.toString === "function") {
        const str = obj.toString();
        if (str && str !== "[object Object]") return str;
      }
    }
    return JSON.stringify(value);
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
                  <th className="text-left p-2">Tên</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Gói</th>
                  <th className="text-left p-2">Tạo lúc</th>
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
                    <td className="p-2">{user.subscriptionStatus || "—"}</td>
                    <td className="p-2 text-xs">
                      {user.createdAt ? formatDate(user.createdAt) : "—"}
                    </td>
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

        <Card title="Phiên đăng nhập">
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa ghi nhận phiên đăng nhập nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Session</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Phương thức</th>
                    <th className="text-left p-2">IP</th>
                    <th className="text-left p-2">Tạo lúc</th>
                    <th className="text-left p-2">Hết hạn</th>
                    <th className="text-left p-2">Trạng thái</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session._id} className="border-b">
                      <td className="p-2 font-mono text-xs">
                        {session._id.slice(0, 8)}…
                      </td>
                      <td className="p-2 text-xs">
                        {typeof session.user_id === "string"
                          ? session.user_id.slice(0, 12) + "…"
                          : JSON.stringify(session.user_id)}
                      </td>
                      <td className="p-2 capitalize">
                        {session.login_method || "email"}
                      </td>
                      <td className="p-2 text-xs">{session.ip || "—"}</td>
                      <td className="p-2 text-xs">{formatDate(session.created_at)}</td>
                      <td className="p-2 text-xs">{formatDate(session.expires_at)}</td>
                      <td className="p-2">
                        {session.current ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                            Hiện tại
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            Khác
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => deleteSession(session._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
  const fetchUsersWithFallback = async (): Promise<any> => {
    try {
      const usersData = await ApiClient.get<User[]>("/admin/users");
      return usersData;
    } catch (primaryError) {
      console.warn(
        "[AdminDashboard] /admin/users failed, fallback to /users/admin/users",
        primaryError
      );
      return ApiClient.get("/users/admin/users");
    }
  };

  const fetchStatsWithFallback = async (
    normalizedUsers: User[]
  ): Promise<AdminStats> => {
    try {
      return await ApiClient.get<AdminStats>("/admin/stats");
    } catch (primaryError) {
      console.warn(
        "[AdminDashboard] /admin/stats failed, using fallback stats",
        primaryError
      );
      const totalUsers = normalizedUsers.length;
      return {
        totalUsers,
        activeUsers: totalUsers,
        totalOrders: 0,
        totalRevenue: 0,
      };
    }
  };
