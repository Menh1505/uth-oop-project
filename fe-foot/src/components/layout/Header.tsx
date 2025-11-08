import { Link } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

export default function Header() {
  const { authed, signOut, profile } = useAppStore();

  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b border-gray-200">
      <div className="container-app py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={authed ? "/journal" : "/"} className="text-xl font-semibold">
            FitFood
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {authed && <span className="text-sm text-gray-600">👋 {profile?.name ?? "User"}</span>}
          {authed && <button className="btn btn-ghost" onClick={signOut}>Đăng xuất</button>}
        </div>
      </div>
    </header>
  );
}
