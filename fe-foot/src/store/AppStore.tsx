
import React, { useEffect, useMemo, useState } from "react";
import type { CartItem, MealLog, Order, OrderStatus, UserProfile, WorkoutLog } from "../types";
import { uid, nowISO } from "../lib/uid";
import { Ctx } from "./useAppStore";

export type Store = {
  // auth
  authed: boolean;
  loading: boolean;
  profile: UserProfile | null;
  signIn(): void;
  signOut(): void;
  completeOnboarding(p: UserProfile): void;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  // journal
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);

  // menu/cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartTotal = useMemo(() => cart.reduce((s, ci) => s + ci.item.price * ci.qty, 0), [cart]);

  // order
  const [order, setOrder] = useState<Order | null>(null);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Ưu tiên authToken (giữ tương thích với flow cũ), fallback sang accessToken cho các lần đăng nhập mới
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          // Backend currently returns { valid, claims: { id, email, role } }
          const claims = (data as any).user || (data as any).claims;
          if (!claims) {
            throw new Error('Missing auth claims');
          }
          setAuthed(true);
          setProfile({
            name: claims.email,
            goal: 'maintain',
            diet: 'balanced',
            budgetPerMeal: 50000,
            timePerWorkout: 60,
            username: claims.email,
            role: claims.role === 'admin' ? 'admin' : 'user',
            needsOnboarding: claims.role !== 'admin'
          });
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = () => setAuthed(true);
  const signOut = async () => {
    // Đọc token từ cả hai khóa để đảm bảo hoạt động với mọi phiên đăng nhập
    const accessToken = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken) {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken
          }),
          credentials: 'include' // Send cookies if any
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Logout failed' }));
          console.warn('Logout API returned error:', error);
        } else {
          const result = await response.json();
          console.info('Logout successful', {
            sessionsDeleted: result.sessionsDeleted,
            tokensRevoked: result.tokensRevoked
          });
        }
      } catch (error) {
        console.error('Logout API error:', error);
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
  };
  const completeOnboarding = (p: UserProfile) => setProfile(p);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) throw new Error('No profile to update');
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No auth token');

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedData = await response.json();
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return updatedData;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const login = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        
        // Store tokens securely
        // Giữ cả hai khóa để tương thích với ApiClient (accessToken) và logic hiện tại (authToken)
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('accessToken', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
        setAuthed(true);
        
        // Now fetch user profile from /api/users/me
        try {
          const profileResponse = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            // API returns { success, user, needsOnboarding }
            setProfile({
              name: profileData.user?.name || username,
              goal: 'maintain',
              diet: 'balanced',
              budgetPerMeal: 50000,
              timePerWorkout: 60,
              username,
              role: (profileData.user?.role || 'user').toString().toLowerCase() === 'admin' ? 'admin' : 'user',
              needsOnboarding: profileData.needsOnboarding === true
            });
          } else {
            // Profile endpoint failed, set default with onboarding
            setProfile({
              name: username,
              goal: 'maintain',
              diet: 'balanced',
              budgetPerMeal: 50000,
              timePerWorkout: 60,
              username,
              role: 'user',
              needsOnboarding: true
            });
          }
        } catch (profileError) {
          console.error('Profile fetch error:', profileError);
          // Still logged in, but needs onboarding
          setProfile({
            name: username,
            goal: 'maintain',
            diet: 'balanced',
            budgetPerMeal: 50000,
            timePerWorkout: 60,
            username,
            role: 'user',
            needsOnboarding: true
          });
        }
        setLoginError(null);
      } else {
        const errorData = await response.json();
        setLoginError(errorData.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Không thể kết nối đến máy chủ');
    } finally {
      setLoginLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        // Lưu cả hai khóa để mọi nơi có thể đọc được token
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('accessToken', data.access_token);
        setAuthed(true);
        // Set admin profile (admins don't need onboarding)
        setProfile({
          name: username,
          goal: 'maintain',
          diet: 'balanced',
          budgetPerMeal: 50000,
          timePerWorkout: 60,
          username,
          role: 'admin',
          needsOnboarding: false
        });
        setLoginError(null);
      } else {
        const errorData = await response.json();
        setLoginError(errorData.message || 'Đăng nhập admin thất bại');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setLoginError('Không thể kết nối đến máy chủ');
    } finally {
      setLoginLoading(false);
    }
  };

  const register = async (email: string, password: string, username?: string) => {
    console.log('Register called with:', { email, password, username });
    setRegisterLoading(true);
    setRegisterError(null);
    try {
      console.log('Making fetch request to register endpoint');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Register success:', data);
        setRegisterSuccess(data.message || 'Đăng ký thành công!');
        setRegisterError(null);
        // Don't set authed or store token for option B
      } else {
        const errorData = await response.json();
        console.log('Register failed:', errorData);
        setRegisterError(errorData.message || 'Đăng ký thất bại');
        setRegisterSuccess(null);
      }
    } catch (error) {
      console.error('Register error:', error);
      setRegisterError('Không thể kết nối đến máy chủ');
    } finally {
      setRegisterLoading(false);
    }
  };

  const addMeal: Store["addMeal"] = (partial) =>
    setMeals((prev) => [{ id: uid("meal"), time: partial.time ?? nowISO(), ...partial }, ...prev]);

  const addWorkout: Store["addWorkout"] = (partial) =>
    setWorkouts((prev) => [{ id: uid("workout"), time: partial.time ?? nowISO(), ...partial }, ...prev]);

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
    setCart((prev) => prev.map((ci) => (ci.item.id === id ? { ...ci, qty } : ci)).filter((ci) => ci.qty > 0));

  const clearCart = () => setCart([]);

  const startCheckout = () => {
    if (!cart.length) return;
    const o: Order = { id: uid("order"), items: cart, total: cartTotal, status: "pending", createdAt: nowISO() };
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
    const chain: OrderStatus[] = ["confirmed", "preparing", "delivering", "completed"];
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
    authed, loading, profile, signIn, signOut, completeOnboarding, updateProfile, login, adminLogin, loginError, loginLoading, register, registerError, registerLoading, registerSuccess,
    meals, workouts, addMeal, addWorkout,
    cart, addToCart, changeQty, cartTotal, clearCart,
    order, startCheckout, cancelOrder,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
