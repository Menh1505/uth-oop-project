import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAppStore } from "../store/useAppStore";
import { currency } from "../lib/currency";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ApiClient } from "../lib/api/client";

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const applePayAvailable = "ApplePaySession" in window;

  const handleCreateOrder = async (paymentMethod: "standard" | "payos" | "apple") => {
    try {
      setLoading(true);
      setError("");

      if (cart.length === 0) {
        setError("Giỏ hàng trống");
        return;
      }

      const orderData = {
        items: cart.map((ci) => ({
          itemId: ci.item.id,
          qty: ci.qty,
          price: ci.item.price,
        })),
        total: cartTotal,
        paymentMethod: paymentMethod,
      };

      await ApiClient.post("/orders", orderData);
      clearCart();
      navigate("/order");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tạo đơn hàng");
      console.error("Error creating order:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Checkout">
      {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
      {cart.length === 0 ? (
        <p className="text-sm text-gray-500">Giỏ hàng trống. <Link to="/menu" className="underline">Quay lại menu</Link></p>
      ) : (
        <>
          <ul className="space-y-2">
            {cart.map((ci) => (
              <li key={ci.item.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                <span>{ci.item.name} × {ci.qty}</span>
                <b>{currency(ci.item.price * ci.qty)}</b>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm">Tổng thanh toán:</div>
            <div className="text-lg font-semibold">{currency(cartTotal)}</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => handleCreateOrder("standard")} disabled={loading}>
              {loading ? "Đang xử lý..." : "Thanh toán"}
            </Button>
            <Button onClick={() => handleCreateOrder("payos")} disabled={loading}>
              {loading ? "Đang xử lý..." : "PayOS (Android)"}
            </Button>
            <Button onClick={() => handleCreateOrder("apple")} disabled={!applePayAvailable || loading}>
              {loading ? "Đang xử lý..." : "Apple Pay (iOS)"}
            </Button>
          </div>

          {!applePayAvailable && <p className="text-xs text-gray-500 mt-2">Apple Pay chưa khả dụng trên trình duyệt này.</p>}
        </>
      )}
    </Card>
  );
}
