import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import Landing from "./pages/Landing";
import { useAppStore } from "./store/useAppStore";

// Lazy pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Journal = lazy(() => import("./pages/Journal"));
const Meals = lazy(() => import("./pages/journal/Meals"));
const Workouts = lazy(() => import("./pages/journal/Workouts"));
const Ai = lazy(() => import("./pages/Ai"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Menu = lazy(() => import("./pages/Menu"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Order = lazy(() => import("./pages/Order"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Shell = lazy(() => import("./components/layout/Shell"));
const NotFound = () => <div className="p-6">404 — Không tìm thấy trang</div>;
function FullScreenSpinner() {
  return <div className="grid h-screen place-items-center">Đang tải…</div>;
}

// --- Guards ---
// RequireAuth: phân luồng admin/user khi chưa có token
function RequireAuth() {
  const token = localStorage.getItem('authToken');
  const loc = useLocation();
  const isAdminPath = loc.pathname.startsWith('/admin');
  const { loading } = useAppStore();

  if (loading) return <FullScreenSpinner />;

  if (!token) {
    return (
      <Navigate
        to={isAdminPath ? "/admin/login" : "/login"}
        replace
        state={{ from: loc }}
      />
    );
  }

  return <Outlet />;
}

function RequireNoAuth() {
  const { authed, profile, loading } = useAppStore();
  if (loading) return <FullScreenSpinner />;

  if (authed) {
    return profile?.role === 'admin'
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/journal" replace />;
  }
  return <Outlet />;
}

function RootPage() {
  const { authed, profile, loading } = useAppStore();
  if (loading) return <FullScreenSpinner />;

  if (authed) {
    return profile?.role === 'admin'
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/journal" replace />;
  }
  return <Landing />;
}


function RequireRole({ role }: { role: "admin" | "user" }) {
  const { profile, loading } = useAppStore();
  const token = localStorage.getItem('authToken');

  if (loading) return <FullScreenSpinner />;

  if (!profile) {
    // Có token nhưng chưa hydrate xong -> chờ
    if (token) return <FullScreenSpinner />;
    return <Navigate to="/" replace />;
  }

  if (role === "admin" && profile.role !== "admin") return <Navigate to="/" replace />;
  if (role === "user" && profile.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
}


function RequireCompletedProfile() {
  const { profile, loading } = useAppStore();
  const token = localStorage.getItem('authToken');

  if (loading) return <FullScreenSpinner />;

  if (!profile) {
    if (token) return <FullScreenSpinner />; // chờ verify
    return <Navigate to="/" replace />;
  }
  if (profile.needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

function RequireOnboardingOnly() {
  const { profile, loading } = useAppStore();
  const token = localStorage.getItem('authToken');

  if (loading) return <FullScreenSpinner />;

  if (!profile) {
    if (token) return <FullScreenSpinner />;
    return <Navigate to="/" replace />;
  }
  if (!profile.needsOnboarding) return <Navigate to="/journal" replace />;
  return <Outlet />;
}


// --- App routes ---
export default function App() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Routes>
        {/* Landing - always accessible */}
        <Route path="/" element={<RootPage />} />

        {/* Public - only for non-auth users */}
        <Route element={<RequireNoAuth />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Route>

        {/* Authed common */}
        <Route element={<RequireAuth />}>
          {/* Onboarding flow */}
          <Route element={<RequireOnboardingOnly />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

          {/* Admin area */}
          <Route element={<RequireRole role="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* User app */}
          <Route element={<RequireRole role="user" />}>
            <Route element={<RequireCompletedProfile />}>
              <Route element={<Shell />}>
                <Route index element={<Navigate to="/journal" replace />} />
                <Route path="/journal" element={<Journal />}>
                  <Route index element={<Navigate to="/journal/meals" replace />} />
                  <Route path="meals" element={<Meals />} />
                  <Route path="workouts" element={<Workouts />} />
                </Route>
                <Route path="/ai" element={<Ai />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order" element={<Order />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
