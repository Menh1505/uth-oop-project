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
      const token = localStorage.getItem('authToken');
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
          setAuthed(true); // <-- thay vì setAuthed(data.authed)
          setProfile({
            name: data.user.emai,
            goal: 'maintain',
            diet: 'balanced',
            budgetPerMeal: 50000,
            timePerWorkout: 60,
            username: data.user.email,
            role: data.user.role,
            needsOnboarding: data.user.role !== 'admin'
          });
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = () => setAuthed(true);
  const signOut = async () => {
    const token = localStorage.getItem('authToken');
    console.log('Bắt đầu logout , xóa token : ' + token);
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout API error:', error);
        // Still proceed with local logout even if API fails
      }
    }
    console.log('Logout API thành công');
    setAuthed(false);
    setProfile(null);
    localStorage.removeItem('authToken');
    setMeals([]);
    setWorkouts([]);
    setCart([]);
    setOrder(null);
  };
  const completeOnboarding = (p: UserProfile) => setProfile(p);

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
        localStorage.setItem('authToken', data.token);
        setAuthed(true);
        // Set basic profile - in production, fetch from /api/user/profile
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
        localStorage.setItem('authToken', data.token);
        setAuthed(true);
        // Set admin profile
        setProfile({
          name: username,
          goal: 'maintain',
          diet: 'balanced',
          budgetPerMeal: 50000,
          timePerWorkout: 60,
          username,
          role: 'admin',
          needsOnboarding: false // Admins don't need onboarding
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
    authed, loading, profile, signIn, signOut, completeOnboarding, login, adminLogin, loginError, loginLoading, register, registerError, registerLoading, registerSuccess,
    meals, workouts, addMeal, addWorkout,
    cart, addToCart, changeQty, cartTotal, clearCart,
    order, startCheckout, cancelOrder,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
