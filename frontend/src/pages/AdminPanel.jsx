import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Shirt, LogOut, Shield, Pause, Play } from "lucide-react";

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState(null);
  const [stats, setStats] = useState(null);

  async function load() {
    const [v, s] = await Promise.all([
      api.get("/admin/vendors"),
      api.get("/admin/stats"),
    ]);
    setVendors(v.data);
    setStats(s.data);
  }

  useEffect(() => { load(); }, []);

  async function toggle(v) {
    const next = v.status === "active" ? "suspended" : "active";
    try {
      await api.put(`/admin/vendors/${v.vendor_id}/status`, { status: next });
      toast.success(`${v.business_name} → ${next}`);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
  }

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-white" data-testid="admin-panel">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b hairline">
        <div className="max-w-[1400px] mx-auto h-16 px-6 md:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="admin-brand-link">
            <div className="w-7 h-7 bg-black flex items-center justify-center">
              <Shirt className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              instawear<span className="text-[#E63946]">.</span>
            </span>
            <span className="eyebrow ml-2 hidden sm:flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-neutral-500">Signed in as</div>
              <div className="text-sm font-medium">{user?.email}</div>
            </div>
            <button
              onClick={onLogout}
              data-testid="admin-logout-button"
              className="flex items-center gap-2 text-sm border hairline px-3 py-2 hover:bg-neutral-100"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto">
        <div className="px-6 md:px-10 pt-10 pb-6 border-b hairline">
          <span className="eyebrow">Platform</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mt-2">Admin control</h1>
          <p className="text-neutral-600 mt-2">All vendors. All orders. Nothing hidden.</p>
        </div>

        {!stats ? (
          <div className="p-10 eyebrow animate-pulse">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 border-b hairline">
              <AdminKpi label="Vendors" value={stats.kpis.vendor_count} sub={`${stats.kpis.active_vendors} active`} />
              <AdminKpi label="Products" value={stats.kpis.product_count} />
              <AdminKpi label="Orders" value={stats.kpis.order_count} />
              <AdminKpi label="GMV" value={`₹${stats.kpis.total_revenue.toLocaleString("en-IN")}`} accent />
              <AdminKpi label="Role" value={(user?.role || "").toUpperCase()} sub={user?.email} />
            </div>

            <div className="grid lg:grid-cols-5 border-b hairline">
              <div className="lg:col-span-3 p-6 md:p-10 border-r hairline">
                <span className="eyebrow">All vendors</span>
                <h2 className="font-display text-2xl font-bold mt-1">Registered partners</h2>
                {!vendors ? (
                  <div className="mt-6 text-sm text-neutral-500 animate-pulse">Loading vendors…</div>
                ) : vendors.length === 0 ? (
                  <div className="mt-6 text-sm text-neutral-500">No vendors registered yet.</div>
                ) : (
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full" data-testid="admin-vendors-table">
                      <thead>
                        <tr className="bg-[#F8F8F8]">
                          <th className="eyebrow text-left py-2 px-3 border-b hairline">Business</th>
                          <th className="eyebrow text-left py-2 px-3 border-b hairline hidden sm:table-cell">Contact</th>
                          <th className="eyebrow text-right py-2 px-3 border-b hairline">Products</th>
                          <th className="eyebrow text-right py-2 px-3 border-b hairline">Orders</th>
                          <th className="eyebrow text-left py-2 px-3 border-b hairline">Status</th>
                          <th className="eyebrow text-right py-2 px-3 border-b hairline"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((v) => (
                          <tr key={v.vendor_id} className="border-b hairline" data-testid={`admin-vendor-row-${v.vendor_id}`}>
                            <td className="py-3 px-3">
                              <div className="font-medium text-sm">{v.business_name}</div>
                              <div className="text-xs text-neutral-500 font-mono-alt">{v.email}</div>
                            </td>
                            <td className="py-3 px-3 text-sm hidden sm:table-cell">{v.contact_name}</td>
                            <td className="py-3 px-3 text-right font-mono-alt text-sm">{v.product_count}</td>
                            <td className="py-3 px-3 text-right font-mono-alt text-sm">{v.order_count}</td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                                  v.status === "active"
                                    ? "bg-green-50 text-green-800 border-green-200"
                                    : "bg-red-50 text-red-800 border-red-200"
                                }`}
                              >
                                {v.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => toggle(v)}
                                data-testid={`toggle-vendor-${v.vendor_id}`}
                                className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 border transition-colors ${
                                  v.status === "active"
                                    ? "hover:bg-[#E63946] hover:text-white hover:border-[#E63946]"
                                    : "hover:bg-[#2A9D8F] hover:text-white hover:border-[#2A9D8F]"
                                } hairline`}
                              >
                                {v.status === "active" ? (<><Pause className="w-3 h-3" /> Suspend</>) : (<><Play className="w-3 h-3" /> Activate</>)}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 p-6 md:p-10">
                <span className="eyebrow">Top vendors</span>
                <h2 className="font-display text-2xl font-bold mt-1">By revenue</h2>
                {stats.top_vendors.length === 0 ? (
                  <div className="mt-6 text-sm text-neutral-500">No sales yet.</div>
                ) : (
                  <ul className="mt-6 divide-y hairline" data-testid="admin-top-vendors">
                    {stats.top_vendors.map((v, i) => (
                      <li key={v.vendor_id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono-alt text-xs text-neutral-400 w-5">{String(i + 1).padStart(2, "0")}</span>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{v.business_name}</div>
                            <div className="text-xs text-neutral-500 font-mono-alt">{v.orders} orders</div>
                          </div>
                        </div>
                        <div className="font-mono-alt text-sm">₹{v.revenue.toLocaleString("en-IN")}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AdminKpi({ label, value, sub, accent }) {
  return (
    <div className={`p-6 md:p-8 border-r hairline last:border-r-0 ${accent ? "bg-black text-white" : ""}`}>
      <div className={`eyebrow ${accent ? "text-white/70" : ""}`}>{label}</div>
      <div className="font-display text-2xl md:text-3xl font-bold mt-2 tracking-tight break-all">{value}</div>
      {sub && <div className={`text-xs mt-1 ${accent ? "text-white/60" : "text-neutral-500"} truncate`}>{sub}</div>}
    </div>
  );
}
