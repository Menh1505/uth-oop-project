import { useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import OAuthButtons from "../../components/ui/OAuthButtons";
import { useAppStore } from "../../store/useAppStore";

export default function Login() {
  const { login, loginError, loginLoading } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    // Navigation handled by authed state in App.tsx
  };

  return (
    <div className="max-w-md mx-auto">
      <Card title="Đăng nhập">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Nhập email"
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
            {loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/register" className="text-blue-600 hover:underline">
            Chưa có tài khoản? Đăng ký
          </Link>
        </div>
        <OAuthButtons />
      </Card>
    </div>
  );
}
