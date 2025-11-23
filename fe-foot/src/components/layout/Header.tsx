import { Link } from "react-router-dom";
import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import ProfileModal from "../ProfileModal";

export default function Header() {
  const { authed, signOut, profile, updateProfile } = useAppStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b border-gray-200">
        <div className="container-app py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to={authed ? "/journal" : "/"} className="text-xl font-semibold">
              FitFood
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {authed && profile && (
              <>
                {/* Profile Button - Click to open modal */}
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden shrink-0">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs">👤</span>
                    )}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {profile.name}
                  </span>
                </button>
              </>
            )}
            {authed && <button className="btn btn-ghost" onClick={signOut}>Đăng xuất</button>}
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal
        profile={profile}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdate={updateProfile}
      />
    </>
  );
}
