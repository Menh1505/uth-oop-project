
import Button from "./Button";

export default function OAuthButtons() {
  return (
    <div className="mt-6 space-y-2">
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => window.location.href = 'http://localhost:3001/auth/oauth/google'}
      >
        Đăng nhập với Google
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => window.location.href = 'http://localhost:3001/auth/oauth/facebook'}
      >
        Đăng nhập với Facebook
      </Button>
    </div>
  );
}