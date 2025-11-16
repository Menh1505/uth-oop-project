import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Steps } from "../components/ui/Steps";
import { currency } from "../lib/currency";
import { useState, useEffect } from "react";
import { ApiClient } from "../lib/api/client";

const labels = ["Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn tất"];

interface OrderData {
  id: string;
  status: string;
  createdAt: string;
  total: number;
  items: Array<{ name: string; qty: number; price: number }>;
}

export default function Order() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ApiClient.get<OrderData[]>("/orders");
      setOrders(data || []);
      if (data && data.length > 0) {
        setSelectedOrderId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await ApiClient.post(`/orders/${orderId}/cancel`, {});
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi hủy đơn");
    }
  };

  const order = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) : null;

  if (loading) {
    return (
      <Card title="Đơn hàng">
        <div className="text-center text-gray-500">Đang tải...</div>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card title="Đơn hàng">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        <p className="text-sm text-gray-500">Chưa có đơn nào.</p>
      </Card>
    );
  }

  const statusOrder = ["pending", "confirmed", "preparing", "delivering", "completed"];
  const idx = statusOrder.indexOf(order.status);

  return (
    <Card title={`Đơn #${order.id}`}>
      {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

      {orders.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedOrderId || ""}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="select select-bordered w-full"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                Đơn #{o.id} - {o.status} - {currency(o.total)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Tạo lúc {new Date(order.createdAt).toLocaleString()}</div>
        <div className="text-sm font-medium">Tổng: {currency(order.total)}</div>
      </div>

      <div className="mt-4">
        <Steps items={labels} activeIndex={idx} />
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium mb-2">Chi tiết:</h3>
          <ul className="text-sm space-y-1">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {item.name} x{item.qty}
                </span>
                <span>{currency(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        {["pending", "confirmed", "preparing"].includes(order.status) && (
          <Button variant="danger" onClick={() => handleCancelOrder(order.id)}>
            Hủy đơn
          </Button>
        )}
        {order.status === "completed" && <div className="text-green-700">✅ Hoàn tất! Chúc ngon miệng.</div>}
        {order.status === "cancelled" && <div className="text-red-600">Đơn đã hủy.</div>}
      </div>
    </Card>
  );
}
