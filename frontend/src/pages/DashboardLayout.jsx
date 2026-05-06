import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LayoutGrid, Package, ShoppingBag, Shirt, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function onLogout() {
    await logout();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  }

  const nav = [
    { to: "/app/dashboard", label: "Dashboard", icon: LayoutGrid, testid: "nav-dashboard" },
    { to: "/app/products", label: "Products", icon: Package, testid: "nav-products" },
    { to: "/app/orders", label: "Orders", icon: ShoppingBag, testid: "nav-orders" },
  ];

  return (
    <div className="min-h-screen bg-white flex" data-testid="dashboard-shell">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 border-r hairline bg-[#F8F8F8] flex-col sticky top-0 h-screen">
        <div className="h-16 px-6 flex items-center border-b hairline">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black flex items-center justify-center">
              <Shirt className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              instawear<span className="text-[#E63946]">.</span>
            </span>
          </div>
        </div>
        <div className="px-4 py-6 flex-1">
          <div className="eyebrow mb-3 px-2">Workspace</div>
          <nav className="flex flex-col gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.testid}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-neutral-700 hover:bg-neutral-200/50"
                  }`
                }
              >
                <n.icon className="w-4 h-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t hairline">
          <div className="text-xs text-neutral-500 mb-1">Signed in as</div>
          <div className="font-medium text-sm truncate" data-testid="sidebar-business-name">
            {user?.business_name}
          </div>
          <div className="text-xs text-neutral-500 truncate">{user?.email}</div>
          <button
            onClick={onLogout}
            data-testid="sidebar-logout-button"
            className="mt-4 w-full flex items-center gap-2 text-sm border hairline px-3 py-2 hover:bg-neutral-100 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b hairline flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black flex items-center justify-center">
            <Shirt className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">instawear.</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          data-testid="mobile-menu-toggle"
          className="p-2"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-30 bg-white">
          <div className="p-4">
            <div className="eyebrow mb-3">Workspace</div>
            <nav className="flex flex-col gap-1">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  data-testid={`mobile-${n.testid}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 text-base font-medium transition-colors ${
                      isActive ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"
                    }`
                  }
                >
                  <n.icon className="w-5 h-5" />
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-8 border-t hairline pt-4">
              <div className="text-xs text-neutral-500 mb-1">Signed in as</div>
              <div className="font-medium">{user?.business_name}</div>
              <div className="text-xs text-neutral-500">{user?.email}</div>
              <button
                onClick={onLogout}
                data-testid="mobile-logout-button"
                className="mt-4 w-full flex items-center gap-2 justify-center text-sm border hairline px-3 py-2 hover:bg-neutral-100"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
