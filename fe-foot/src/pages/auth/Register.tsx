import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAppStore } from "../../store/useAppStore";

export default function Register() {
  const { register, registerError, registerLoading, registerSuccess } = useAppStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (registerSuccess) {
      navigate('/login');
    }
  }, [registerSuccess, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    await register(email, password, username || undefined);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card title="Đăng ký">
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
            <label htmlFor="regUsername" className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập (tùy chọn)
            </label>
            <Input
              id="regUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
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
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Nhập lại mật khẩu"
            />
          </div>
          {registerError && (
            <div className="text-red-600 text-sm">
              {registerError}
            </div>
          )}
          {registerSuccess && (
            <div className="text-green-600 text-sm">
              {registerSuccess}
            </div>
          )}
          <Button type="submit" disabled={registerLoading} className="w-full">
            {registerLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-blue-600 hover:underline">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
}
