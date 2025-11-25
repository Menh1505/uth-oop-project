import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAppStore } from "../store/useAppStore";
import { currency } from "../lib/currency";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { ApiClient } from "../lib/api/client";
import type { MenuItem } from "../types";

export default function Menu() {
  const { cart, addToCart, changeQty, cartTotal } = useAppStore();
  const [meals, setMeals] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [addingMealId, setAddingMealId] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ApiClient.get<MenuItem[]>("/meals");
      setMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching meals:", err);
      setError(err instanceof Error ? err.message : "Lỗi tải menu");
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleAddToCart = async (meal: MenuItem) => {
    if (addingMealId) return;
    setAddingMealId(meal.id);
    setNotice(null);
    try {
      await ApiClient.post(`/meals/${meal.id}/add-to-cart`, { quantity: 1 });
      addToCart(meal);
      setNotice({ type: "success", message: "Đã thêm vào giỏ hàng" });
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setNotice({ type: "error", message: "Không thể thêm vào giỏ hàng" });
    } finally {
      setAddingMealId(null);
    }
  };

  return (
    <div className="grid-2">
      <Card title="Menu">
        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && (
          <div
            className={`mb-4 rounded p-3 text-sm ${
              notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {notice.message}
          </div>
        )}
        {loading ? (
          <div className="text-center text-gray-500">Đang tải menu...</div>
        ) : meals.length === 0 ? (
          <div className="text-center text-gray-500">Không có món ăn nào</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="flex flex-col rounded-lg border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
              >
                {meal.image_url ? (
                  <img
                    src={meal.image_url}
                    alt={meal.name}
                    className="h-40 w-full rounded-t-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-t-lg bg-slate-100 text-slate-400">
                    Không có ảnh
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">{meal.name}</h3>
                      {meal.meal_type && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {meal.meal_type}
                        </span>
                      )}
                    </div>
                    {meal.description && <p className="mt-1 text-sm text-slate-600">{meal.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-900">{meal.calories}</span> kcal
                    </div>
                    <div className="text-right font-semibold text-slate-900">{currency(meal.price)}</div>
                    <div>P: <span className="font-semibold text-slate-900">{meal.protein}</span> g</div>
                    <div className="text-right">
                      C: <span className="font-semibold text-slate-900">{meal.carbs}</span> g
                    </div>
                    <div>F: <span className="font-semibold text-slate-900">{meal.fat}</span> g</div>
                  </div>
                  <Button
                    onClick={() => handleAddToCart(meal)}
                    disabled={addingMealId === meal.id}
                    className="w-full"
                  >
                    {addingMealId === meal.id ? "Đang thêm..." : "Mua / Thêm vào giỏ"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Cart" footer={<div className="flex items-center justify-between">
        <div className="text-sm">Tổng: <b>{currency(cartTotal)}</b></div>
        <Link to="/checkout"><Button>Thanh toán</Button></Link>
      </div>}>
        {cart.length === 0 ? <p className="text-sm text-gray-500">Giỏ hàng trống.</p> : (
          <ul className="space-y-2">
            {cart.map((ci) => (
              <li key={ci.item.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                <div className="flex-1">
                  <div className="font-medium">{ci.item.name}</div>
                  <div className="text-sm text-gray-600">{currency(ci.item.price)}</div>
                </div>
                <input
                  type="number"
                  min={1}
                  value={ci.qty}
                  onChange={(e) => changeQty(ci.item.id, Number(e.target.value))}
                  className="input w-20"
                />
                <div className="w-24 text-right font-medium">{currency(ci.item.price * ci.qty)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
