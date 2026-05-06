import React, { useEffect, useMemo, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { ChevronDown, Search } from "lucide-react";

const STATUSES = ["pending", "packed", "shipped", "delivered", "cancelled"];
const STATUS_STYLE = {
  pending: "bg-neutral-100 text-neutral-800 border-neutral-200",
  packed: "bg-blue-50 text-blue-800 border-blue-200",
  shipped: "bg-amber-50 text-amber-800 border-amber-200",
  delivered: "bg-green-50 text-green-800 border-green-200",
  cancelled: "bg-red-50 text-red-800 border-red-200",
};

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);

  async function load() {
    const { data } = await api.get("/orders");
    setOrders(data);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success(`Order marked ${status}`);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
  }

  const filtered = useMemo(() => {
    if (!orders) return null;
    let xs = orders;
    if (filter !== "all") xs = xs.filter((o) => o.status === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      xs = xs.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.items.some((i) => i.product_name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)),
      );
    }
    return xs;
  }, [orders, filter, query]);

  const counts = useMemo(() => {
    const base = { all: orders?.length || 0 };
    STATUSES.forEach((s) => (base[s] = 0));
    (orders || []).forEach((o) => (base[o.status] = (base[o.status] || 0) + 1));
    return base;
  }, [orders]);

  return (
    <div className="animate-fadeup" data-testid="orders-page">
      <div className="px-6 md:px-10 pt-10 pb-6 border-b hairline">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="eyebrow">Fulfillment</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mt-2">Orders</h1>
            <p className="text-neutral-600 mt-2">Ship on time. Update status as things move.</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, customer, SKU…"
              data-testid="orders-search-input"
              className="pl-9 pr-3 py-2 border hairline w-72 focus:outline-none focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-6 md:px-10 py-4 border-b hairline flex gap-2 overflow-x-auto scrollbar-thin">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            data-testid={`filter-${s}`}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors whitespace-nowrap ${
              filter === s ? "bg-black text-white border-black" : "bg-white text-neutral-700 hairline hover:bg-neutral-50"
            }`}
          >
            {s} <span className="ml-1 opacity-70 font-mono-alt">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {filtered === null ? (
        <div className="p-10 eyebrow animate-pulse">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center">
          <div className="eyebrow">Nothing here</div>
          <div className="font-display text-2xl font-bold mt-2">No orders match your filter</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="orders-table">
            <thead>
              <tr className="bg-[#F8F8F8]">
                <th className="eyebrow text-left py-3 px-6 md:px-10 border-b hairline">Order</th>
                <th className="eyebrow text-left py-3 px-4 border-b hairline hidden md:table-cell">Customer</th>
                <th className="eyebrow text-left py-3 px-4 border-b hairline hidden lg:table-cell">Date</th>
                <th className="eyebrow text-right py-3 px-4 border-b hairline">Total</th>
                <th className="eyebrow text-left py-3 px-4 border-b hairline">Status</th>
                <th className="eyebrow text-right py-3 px-6 md:px-10 border-b hairline"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const isOpen = expanded === o.id;
                return (
                  <React.Fragment key={o.id}>
                    <tr className="border-b hairline hover:bg-neutral-50 cursor-pointer" data-testid={`order-row-${o.id}`} onClick={() => setExpanded(isOpen ? null : o.id)}>
                      <td className="py-4 px-6 md:px-10">
                        <div className="font-mono-alt text-sm">{o.order_number}</div>
                        <div className="text-xs text-neutral-500 md:hidden">{o.customer_name}</div>
                      </td>
                      <td className="py-4 px-4 text-sm hidden md:table-cell">{o.customer_name}</td>
                      <td className="py-4 px-4 text-sm text-neutral-600 hidden lg:table-cell font-mono-alt">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm text-right font-mono-alt">₹{o.total.toFixed(2)}</td>
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          value={o.status}
                          onChange={(v) => updateStatus(o.id, v)}
                          testid={`status-select-${o.id}`}
                        />
                      </td>
                      <td className="py-4 px-6 md:px-10 text-right">
                        <ChevronDown className={`w-4 h-4 inline transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-[#F8F8F8] border-b hairline" data-testid={`order-expanded-${o.id}`}>
                        <td colSpan={6} className="px-6 md:px-10 py-4">
                          <div className="eyebrow mb-2">Line items</div>
                          <div className="grid gap-2">
                            {o.items.map((it, i) => (
                              <div key={i} className="flex items-center justify-between text-sm border-b hairline py-2 last:border-b-0">
                                <div>
                                  <div className="font-medium">{it.product_name}</div>
                                  <div className="text-xs font-mono-alt text-neutral-500">
                                    {it.sku} · {it.size}/{it.color}
                                  </div>
                                </div>
                                <div className="font-mono-alt">
                                  {it.quantity} × ₹{it.price.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusSelect({ value, onChange, testid }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className={`appearance-none text-[10px] font-semibold uppercase tracking-wider border pl-2.5 pr-7 py-1 rounded-full cursor-pointer ${STATUS_STYLE[value] || ""}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
