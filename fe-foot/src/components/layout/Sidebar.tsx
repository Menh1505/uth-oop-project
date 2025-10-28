import { Link, useLocation } from "react-router-dom";

const mainNav = [
  { to: "/journal/meals", label: "Bữa ăn" },
  { to: "/journal/workouts", label: "Buổi tập" },
  { to: "/ai", label: "AI gợi ý" },
  { to: "/analytics", label: "Analytics" },
  { to: "/menu", label: "Menu" },
  { to: "/checkout", label: "Checkout" },
  { to: "/order", label: "Đơn hàng" },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <nav className="space-y-2">
        {mainNav.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`block px-3 py-2 rounded-md text-sm font-medium ${
              pathname === item.to
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
