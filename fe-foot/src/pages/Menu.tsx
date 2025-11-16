import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAppStore } from "../store/useAppStore";
import { currency } from "../lib/currency";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ApiClient } from "../lib/api/client";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  restaurantId: string;
  restaurantName?: string;
}

export default function Menu() {
  const { cart, addToCart, changeQty, cartTotal } = useAppStore();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ApiClient.get<MenuItem[]>("/catalog/products");
      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải menu");
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-2">
      <Card title="Menu">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Đang tải menu...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500">Không có món ăn nào</div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-gray-600">{currency(it.price)} — {it.calories} kcal · P{it.protein}/C{it.carbs}/F{it.fat}</div>
                </div>
                <Button onClick={() => addToCart(it)}>Thêm</Button>
              </li>
            ))}
          </ul>
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
