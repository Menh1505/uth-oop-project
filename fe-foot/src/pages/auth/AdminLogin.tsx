import { useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAppStore } from "../../store/useAppStore";

export default function AdminLogin() {
  const { adminLogin, loginError, loginLoading } = useAppStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminLogin(username, password);
    // Navigation handled by authed state in App.tsx
  };

  return (
    <div className="max-w-md mx-auto">
      <Card title="Admin Đăng nhập">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập username admin"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>
          {loginError && (
            <div className="text-red-600 text-sm">
              {loginError}
            </div>
          )}
          <Button type="submit" disabled={loginLoading} className="w-full">
            {loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập Admin'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-blue-600 hover:underline">
            Đăng nhập User
          </Link>
        </div>
      </Card>
    </div>
  );
}
