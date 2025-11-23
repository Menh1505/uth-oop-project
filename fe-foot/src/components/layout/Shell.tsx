
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

export default function Shell() {
  const { authed, profile } = useAppStore();

  return (
    <div className="min-h-dvh bg-[radial-gradient(75%_75%_at_50%_0%,#ffffff_0%,#f8fafc_100%)]">
      <Header />
      <div className="flex">
        {authed && profile && <Sidebar />}
        <main className="flex-1 container-app py-6"><Outlet /></main>
      </div>
    </div>
  );
}