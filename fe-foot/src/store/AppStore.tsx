import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CartItem,
  CombinedProfile,
  DailySummary,
  MealLog,
  Order,
  OrderStatus,
  WorkoutLog,
} from "../types";
import { uid, nowISO } from "../lib/uid";
import { Ctx } from "./useAppStore";

export type Store = {
  // auth
  authed: boolean;
  loading: boolean;
  profile: CombinedProfile | null;
  signIn(): void;
  signOut(): void;
  completeOnboarding(p: CombinedProfile): void;
  updateProfile(updates: Partial<CombinedProfile>): Promise<void>;
  login(username: string, password: string): Promise<void>;
  adminLogin(username: string, password: string): Promise<void>;
  loginError: string | null;
  loginLoading: boolean;
  register(email: string, password: string, username?: string): Promise<void>;
  registerError: string | null;
  registerLoading: boolean;
  registerSuccess: string | null;

  // journal
  meals: MealLog[];
  workouts: WorkoutLog[];
  dailySummary: DailySummary | null;
  fetchMeals(date?: string): Promise<DailySummary | null>;
  addMeal(m: Omit<MealLog, "id" | "time"> & { time?: string }): void;
  addWorkout(w: Omit<WorkoutLog, "id" | "time"> & { time?: string }): void;

  // menu/cart
  cart: CartItem[];
  addToCart(item: CartItem["item"]): void;
  changeQty(id: string, qty: number): void;
  cartTotal: number;
  clearCart(): void;

  // order
  order: Order | null;
  startCheckout(): void;
  cancelOrder(): void;
};

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  // auth
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true); // Start loading to check auth
  const [profile, setProfile] = useState<CombinedProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  // journal
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);

  // menu/cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartTotal = useMemo(
    () => cart.reduce((s, ci) => s + ci.item.price * ci.qty, 0),
    [cart]
  );

  // order
  const [order, setOrder] = useState<Order | null>(null);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Ưu tiên authToken (giữ tương thích với flow cũ), fallback sang accessToken cho các lần đăng nhập mới
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Gọi /api/users/me để verify token và lấy profile cùng lúc
        // Nếu token valid → getMe sẽ trả profile
        // Nếu token invalid/expired → 401 → logout
        const meRes = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!meRes.ok) {
          // Token invalid hoặc expired
          localStorage.removeItem("authToken");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setLoading(false);
          return;
        }

        const profileData = await meRes.json();
        const claims = (profileData as any).user || {};

        setAuthed(true);
        setProfile({
          name: profileData.user?.name || claims.email || "User",
          goal: "maintain",
          diet: "balanced",
          budgetPerMeal: 50000,
          timePerWorkout: 60,
          username: profileData.user?.username || claims.email || "",
          avatar: profileData.user?.profile_picture_url || undefined,
          loginMethod: (localStorage.getItem("loginMethod") as any) || "email",
          role:
            (profileData.user?.role || claims.role || "user")
              .toString()
              .toLowerCase() === "admin"
              ? "admin"
              : "user",
          age: profileData.user?.age,
          weight: profileData.user?.weight,
          height: profileData.user?.height,
          bmi: profileData.user?.bmi ?? undefined,
          bmi_category: profileData.user?.bmi_category ?? undefined,
          needsOnboarding: profileData.needsOnboarding === true,
          needsSetup: false, // If we got here with complete profile, setup is done
        });
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = () => setAuthed(true);
  const signOut = async () => {
    // Đọc token từ cả hai khóa để đảm bảo hoạt động với mọi phiên đăng nhập
    const accessToken =
      localStorage.getItem("authToken") || localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken) {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
          credentials: "include", // Send cookies if any
        });

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ message: "Logout failed" }));
          console.warn("Logout API returned error:", error);
        } else {
          const result = await response.json();
          console.info("Logout successful", {
            sessionsDeleted: result.sessionsDeleted,
            tokensRevoked: result.tokensRevoked,
          });
        }
      } catch (error) {
        console.error("Logout API error:", error);
        // Continue with local cleanup even if API fails
      }
    }

    // Clear all local state and storage
    setAuthed(false);
    setProfile(null);
    setMeals([]);
    setWorkouts([]);
    setCart([]);
    setOrder(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userProfile");
  };
  const completeOnboarding = (p: CombinedProfile) => setProfile(p);

  const updateProfile = async (updates: Partial<CombinedProfile>) => {
    if (!profile) throw new Error("No profile to update");
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No auth token");

    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedData = await response.json();
      const updatedUser = (updatedData as any)?.user;
      setProfile((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        if (updatedUser) {
          next.age = updatedUser.age ?? next.age;
          next.weight = updatedUser.weight ?? next.weight;
          next.height = updatedUser.height ?? next.height;
          next.avatar =
            updatedUser.profile_picture_url ?? next.avatar ?? undefined;
          next.bmi = updatedUser.bmi ?? next.bmi;
          next.bmi_category = updatedUser.bmi_category ?? next.bmi_category;
          if (typeof updatedData.needsOnboarding === "boolean") {
            next.needsOnboarding = updatedData.needsOnboarding;
          }
        }
        return next;
      });
      return updatedData;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  const login = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();

        // Store tokens securely
        // Giữ cả hai khóa để tương thích với ApiClient (accessToken) và logic hiện tại (authToken)
        localStorage.setItem("authToken", data.access_token);
        localStorage.setItem("accessToken", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refreshToken", data.refresh_token);
        }
        setAuthed(true);

        // Now fetch user profile from /api/users/me
        try {
          const profileResponse = await fetch("/api/users/me", {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            // API returns { success, user, needsOnboarding }
            setProfile({
              name: profileData.user?.name || username,
              goal: "maintain",
              diet: "balanced",
              budgetPerMeal: 50000,
              timePerWorkout: 60,
              username,
              avatar: profileData.user?.profile_picture_url || undefined,
              role:
                (profileData.user?.role || "user").toString().toLowerCase() ===
                "admin"
                  ? "admin"
                  : "user",
              age: profileData.user?.age,
              weight: profileData.user?.weight,
              height: profileData.user?.height,
              bmi: profileData.user?.bmi ?? undefined,
              bmi_category: profileData.user?.bmi_category ?? undefined,
              needsOnboarding: profileData.needsOnboarding === true,
              needsSetup: false,
            });
          } else {
            // Profile endpoint failed, set default with onboarding
            setProfile({
              name: username,
              goal: "maintain",
              diet: "balanced",
              budgetPerMeal: 50000,
              timePerWorkout: 60,
              username,
              avatar: undefined,
              role: "user",
              needsOnboarding: true,
              needsSetup: false,
            });
          }
        } catch (profileError) {
          console.error("Profile fetch error:", profileError);
          // Still logged in, but needs onboarding
          setProfile({
            name: username,
            goal: "maintain",
            diet: "balanced",
            budgetPerMeal: 50000,
            timePerWorkout: 60,
            username,
            avatar: undefined,
            role: "user",
            needsOnboarding: true,
            needsSetup: false,
          });
        }
        setLoginError(null);
      } else {
        const errorData = await response.json();
        setLoginError(errorData.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Không thể kết nối đến máy chủ");
    } finally {
      setLoginLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        // Lưu cả hai khóa để mọi nơi có thể đọc được token
        localStorage.setItem("authToken", data.access_token);
        localStorage.setItem("accessToken", data.access_token);
        setAuthed(true);
        // Set admin profile (admins don't need onboarding)
        setProfile({
          name: username,
          goal: "maintain",
          diet: "balanced",
          budgetPerMeal: 50000,
          timePerWorkout: 60,
          username,
          role: "admin",
          needsOnboarding: false,
          needsSetup: false,
        });
        setLoginError(null);
      } else {
        const errorData = await response.json();
        setLoginError(errorData.message || "Đăng nhập admin thất bại");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setLoginError("Không thể kết nối đến máy chủ");
    } finally {
      setLoginLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    username?: string
  ) => {
    console.log("Register called with:", { email, password, username });
    setRegisterLoading(true);
    setRegisterError(null);
    try {
      console.log("Making fetch request to register endpoint");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, username }),
      });
      console.log("Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Register success:", data);
        setRegisterSuccess(data.message || "Đăng ký thành công!");
        setRegisterError(null);
        // Don't set authed or store token for option B
      } else {
        const errorData = await response.json();
        console.log("Register failed:", errorData);
        setRegisterError(errorData.message || "Đăng ký thất bại");
        setRegisterSuccess(null);
      }
    } catch (error) {
      console.error("Register error:", error);
      setRegisterError("Không thể kết nối đến máy chủ");
    } finally {
      setRegisterLoading(false);
    }
  };

  const fetchMeals = useCallback<Store["fetchMeals"]>(async (date) => {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("accessToken");
    if (!token) {
      setDailySummary(null);
      return null;
    }
    const targetDate = date || new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch(`/api/meals/me?date=${targetDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setDailySummary(null);
        return null;
      }
      const payload = await res.json();
      const body = payload?.data ?? payload;
      const items = Array.isArray(body?.meals) ? body.meals : [];
      const mapped: MealLog[] = items.map((m: any) => ({
        id: m.id || m._id || uid("meal"),
        name: m.ten_mon || m.loai_bua_an || "Bữa ăn",
        meal_name: m.ten_mon,
        meal_type: m.loai_bua_an,
        meal_date: m.ngay_an,
        meal_time: m.thoi_gian_an,
        calories: Math.round(m.luong_calories || 0),
        protein: 0,
        carbs: 0,
        fat: 0,
        time: m.ngay_an
          ? `${m.ngay_an}T${(m.thoi_gian_an || "00:00")
              .toString()
              .padStart(5, "0")}:00`
          : nowISO(),
      }));
      setMeals(mapped);
      const summary = (body?.summary || null) as DailySummary | null;
      setDailySummary(summary);
      return summary;
    } catch (e) {
      console.warn("fetchMeals failed, keep local state", e);
      setDailySummary(null);
      return null;
    }
  }, []);

  const addMeal: Store["addMeal"] = async (partial) => {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("accessToken");
    const now = new Date();
    const y = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const MI = String(now.getMinutes()).padStart(2, "0");

    const payload = {
      ten_mon: partial.name || "Bữa ăn nhanh",
      loai_bua_an: "Ăn vặt",
      luong_calories: Math.max(0, Math.round(partial.calories || 0)),
      khoi_luong: 100,
      ngay_an: `${y}-${mm}-${dd}`,
      thoi_gian_an: `${HH}:${MI}`,
      ghi_chu: "",
    };

    if (token) {
      try {
        const res = await fetch("/api/meals/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchMeals();
          return;
        }
      } catch (e) {
        console.warn("addMeal API failed, fallback to local add", e);
      }
    }

    setMeals((prev) => [
      { id: uid("meal"), time: partial.time ?? nowISO(), ...partial },
      ...prev,
    ]);
  };

  const addWorkout: Store["addWorkout"] = (partial) =>
    setWorkouts((prev) => [
      { id: uid("workout"), time: partial.time ?? nowISO(), ...partial },
      ...prev,
    ]);

  const addToCart: Store["addToCart"] = (item) => {
    setCart((prev) => {
      const i = prev.findIndex((x) => x.item.id === item.id);
      if (i >= 0) {
        const cp = [...prev];
        cp[i] = { ...cp[i], qty: cp[i].qty + 1 };
        return cp;
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const changeQty: Store["changeQty"] = (id, qty) =>
    setCart((prev) =>
      prev
        .map((ci) => (ci.item.id === id ? { ...ci, qty } : ci))
        .filter((ci) => ci.qty > 0)
    );

  const clearCart = () => setCart([]);

  const startCheckout = () => {
    if (!cart.length) return;
    const o: Order = {
      id: uid("order"),
      items: cart,
      total: cartTotal,
      status: "pending",
      createdAt: nowISO(),
    };
    setOrder(o);
    setCart([]);
  };

  const cancelOrder = () => {
    if (!order) return;
    if (["pending", "confirmed", "preparing"].includes(order.status)) {
      setOrder({ ...order, status: "cancelled" });
    }
  };

  // Simulate order progression
  useEffect(() => {
    if (!order) return;
    if (["completed", "cancelled"].includes(order.status)) return;
    const chain: OrderStatus[] = [
      "confirmed",
      "preparing",
      "delivering",
      "completed",
    ];
    let idx = 0;
    const t = setInterval(() => {
      setOrder((prev) => {
        if (!prev) return prev;
        if (idx >= chain.length) {
          clearInterval(t);
          return prev;
        }
        return { ...prev, status: chain[idx++] };
      });
    }, 2000);
    return () => clearInterval(t);
  }, [order?.id]);

  const value: Store = {
    authed,
    loading,
    profile,
    signIn,
    signOut,
    completeOnboarding,
    updateProfile,
    login,
    adminLogin,
    loginError,
    loginLoading,
    register,
    registerError,
    registerLoading,
    registerSuccess,
    meals,
    workouts,
    dailySummary,
      fetchMeals,
    addMeal,
    addWorkout,
    cart,
    addToCart,
    changeQty,
    cartTotal,
    clearCart,
    order,
    startCheckout,
    cancelOrder,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
