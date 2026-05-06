import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AlertTriangle, ArrowUpRight, TrendingUp } from "lucide-react";

const STATUS_STYLE = {
  pending: "bg-neutral-100 text-neutral-800 border-neutral-200",
  packed: "bg-blue-50 text-blue-800 border-blue-200",
  shipped: "bg-amber-50 text-amber-800 border-amber-200",
  delivered: "bg-green-50 text-green-800 border-green-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/dashboard/stats").then((r) => setStats(r.data)).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="p-10 text-[#E63946]">{err}</div>;
  if (!stats) return <div className="p-10 eyebrow animate-pulse">Loading dashboard…</div>;

  const k = stats.kpis;
  return (
    <div className="animate-fadeup" data-testid="dashboard-page">
      {/* Header */}
      <div className="px-6 md:px-10 pt-10 pb-6 border-b hairline">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <span className="eyebrow">Control room</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mt-2">
              Good to see you, {user?.contact_name?.split(" ")[0] || "partner"}.
            </h1>
            <p className="text-neutral-600 mt-2 max-w-xl">
              Here's what's moving across {user?.business_name}. Updated just now.
            </p>
          </div>
          <div className="eyebrow text-neutral-400 font-mono-alt">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b hairline">
        <Kpi label="Revenue (14d)" value={`₹${k.total_revenue.toLocaleString("en-IN")}`} accent />
        <Kpi label="Orders" value={k.order_count} sub={`${k.pending_count} pending`} />
        <Kpi label="Stock units" value={k.total_stock_units.toLocaleString("en-IN")} sub={`₹${k.stock_value.toLocaleString("en-IN")} value`} />
        <Kpi label="Low stock" value={k.low_stock_count} sub={`${k.product_count} SKUs tracked`} warn={k.low_stock_count > 0} />
      </div>

      {/* Chart + Low stock */}
      <div className="grid lg:grid-cols-3 border-b hairline">
        <div className="lg:col-span-2 p-6 md:p-10 border-r hairline">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="eyebrow">Sales trend · last 14 days</span>
              <div className="font-display text-2xl font-bold mt-1 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Revenue per day
              </div>
            </div>
          </div>
          <div className="h-64" data-testid="sales-trend-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.sales_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#F1F1F1" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#737373", fontSize: 10 }}
                  tickFormatter={(d) => d.slice(5)}
                  axisLine={{ stroke: "#E5E5E5" }}
                  tickLine={false}
                />
                <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 0, fontFamily: "Satoshi" }}
                  formatter={(v) => [`₹${Number(v).toFixed(2)}`, "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#0A0A0A" strokeWidth={2} dot={{ r: 3, fill: "#0A0A0A" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-[#E63946]" />
            <span className="eyebrow text-[#E63946]">Low stock (≤5)</span>
          </div>
          {stats.low_stock.length === 0 ? (
            <div className="text-sm text-neutral-600">All variants are healthy. Nice work.</div>
          ) : (
            <ul className="divide-y hairline" data-testid="low-stock-list">
              {stats.low_stock.map((x, i) => (
                <li key={i} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{x.product_name}</div>
                    <div className="text-xs font-mono-alt text-neutral-500 truncate">
                      {x.sku} · {x.size}/{x.color}
                    </div>
                  </div>
                  <div className={`font-display text-xl font-bold ${x.stock === 0 ? "text-[#E63946]" : ""}`}>
                    {x.stock}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Top products + recent orders */}
      <div className="grid lg:grid-cols-2">
        <div className="p-6 md:p-10 border-r hairline">
          <span className="eyebrow">Top products</span>
          <h2 className="font-display text-2xl font-bold mt-1">By revenue</h2>
          {stats.top_products.length === 0 ? (
            <div className="text-sm text-neutral-600 mt-6">No orders yet.</div>
          ) : (
            <table className="w-full mt-6" data-testid="top-products-table">
              <thead>
                <tr className="text-left">
                  <th className="eyebrow py-3 border-b hairline">Product</th>
                  <th className="eyebrow py-3 border-b hairline text-right">Units</th>
                  <th className="eyebrow py-3 border-b hairline text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_products.map((p) => (
                  <tr key={p.product_id} className="border-b hairline">
                    <td className="py-3 text-sm font-medium">{p.name}</td>
                    <td className="py-3 text-sm text-right font-mono-alt">{p.units}</td>
                    <td className="py-3 text-sm text-right font-mono-alt">₹{p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 md:p-10">
          <div className="flex items-center justify-between">
            <div>
              <span className="eyebrow">Recent orders</span>
              <h2 className="font-display text-2xl font-bold mt-1">Latest activity</h2>
            </div>
            <a
              href="/app/orders"
              data-testid="view-all-orders-link"
              className="text-sm font-medium flex items-center gap-1 hover:underline underline-offset-4"
            >
              View all <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <ul className="mt-6 divide-y hairline" data-testid="recent-orders-list">
            {stats.recent_orders.map((o) => (
              <li key={o.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono-alt text-xs text-neutral-500">{o.order_number}</div>
                  <div className="text-sm font-medium truncate">{o.customer_name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-alt text-sm">₹{o.total.toFixed(2)}</span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${STATUS_STYLE[o.status] || ""}`}>
                    {o.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent, warn }) {
  return (
    <div className={`p-6 md:p-8 border-r hairline last:border-r-0 ${accent ? "bg-black text-white" : ""}`}>
      <div className={`eyebrow ${accent ? "text-white/70" : ""} ${warn ? "text-[#E63946]" : ""}`}>{label}</div>
      <div className="font-display text-3xl md:text-4xl font-bold mt-2 tracking-tight">{value}</div>
      {sub && <div className={`text-xs mt-1 ${accent ? "text-white/60" : "text-neutral-500"}`}>{sub}</div>}
    </div>
  );
}
