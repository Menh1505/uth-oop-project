import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Steps } from "../components/ui/Steps";
import { useAppStore } from "../store/useAppStore";
import { currency } from "../lib/currency";

const labels = ["Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn tất"];

export default function Order() {
  const { order, cancelOrder } = useAppStore();

  if (!order) {
    return (
      <Card title="Đơn hàng">
        <p className="text-sm text-gray-500">Chưa có đơn nào.</p>
      </Card>
    );
  }

  const idx = ["pending","confirmed","preparing","delivering","completed"].indexOf(order.status);

  return (
    <Card title={`Đơn #${order.id}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Tạo lúc {new Date(order.createdAt).toLocaleString()}</div>
        <div className="text-sm font-medium">Tổng: {currency(order.total)}</div>
      </div>

      <div className="mt-4">
        <Steps items={labels} activeIndex={idx} />
      </div>

      <div className="mt-4">
        {["pending","confirmed","preparing"].includes(order.status) && (
          <Button variant="danger" onClick={cancelOrder}>Hủy đơn</Button>
        )}
        {order.status === "completed" && <div className="text-green-700">✅ Hoàn tất! Chúc ngon miệng.</div>}
        {order.status === "cancelled" && <div className="text-red-600">Đơn đã hủy.</div>}
      </div>
    </Card>
  );
}
