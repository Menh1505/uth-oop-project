import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useAppStore } from "../store/useAppStore";
import { currency } from "../lib/currency";
import { Link, useNavigate } from "react-router-dom";

export default function Checkout() {
  const { cart, cartTotal, startCheckout } = useAppStore();
  const navigate = useNavigate();

  const applePayAvailable = 'ApplePaySession' in window;
  const payApple = () => { alert("Apple Pay (mock)."); startCheckout(); navigate("/order"); };
  const payPayOS = () => { alert("PayOS (mock)."); startCheckout(); navigate("/order"); };

  return (
    <Card title="Checkout">
      {cart.length === 0 ? (
        <p className="text-sm text-gray-500">Giỏ hàng trống. <Link to="/menu" className="underline">Quay lại menu</Link></p>
      ) : (
        <>
          <ul className="space-y-2">
            {cart.map(ci => (
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
            <Button onClick={() => { startCheckout(); navigate("/order"); }}>Thanh toán thường (mock)</Button>
            <Button onClick={payPayOS}>PayOS (Android)</Button>
            <Button onClick={payApple} disabled={!applePayAvailable}> Apple Pay (iOS)</Button>
          </div>

          {!applePayAvailable && <p className="text-xs text-gray-500 mt-2">Apple Pay chưa khả dụng trên trình duyệt này.</p>}
        </>
      )}
    </Card>
  );
}
