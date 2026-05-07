import React, { useEffect, useMemo, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const DEFAULT_COLORS = ["Black", "White"];

export default function Products() {
  const [products, setProducts] = useState(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // product object or "new"

  async function load() {
    const { data } = await api.get("/products");
    setProducts(data);
  }

  useEffect(() => { load(); }, []);

  async function onDelete(p) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success("Product deleted");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    }
  }

  const filtered = useMemo(() => {
    if (!products) return null;
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.variants?.some((v) => v.sku.toLowerCase().includes(q)),
    );
  }, [products, query]);

  return (
    <div className="animate-fadeup" data-testid="products-page">
      <div className="px-6 md:px-10 pt-10 pb-6 border-b hairline flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mt-2">Products</h1>
          <p className="text-neutral-600 mt-2">Manage every SKU — size, color, stock, price.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, SKU…"
              data-testid="products-search-input"
              className="pl-9 pr-3 py-2 border hairline w-64 focus:outline-none focus:border-black"
            />
          </div>
          <button
            onClick={() => setEditing("new")}
            data-testid="new-product-button"
            className="flex items-center gap-2 bg-black text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" /> New product
          </button>
        </div>
      </div>

      {filtered === null ? (
        <div className="p-10 eyebrow animate-pulse">Loading products…</div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center">
          <div className="eyebrow">Nothing yet</div>
          <div className="font-display text-2xl font-bold mt-2">Add your first product</div>
          <button
            onClick={() => setEditing("new")}
            data-testid="empty-new-product-button"
            className="mt-4 inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New product
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="products-table">
            <thead>
              <tr className="bg-[#F8F8F8]">
                <th className="eyebrow text-left py-3 px-6 md:px-10 border-b hairline">Product</th>
                <th className="eyebrow text-left py-3 px-4 border-b hairline hidden md:table-cell">Category</th>
                <th className="eyebrow text-right py-3 px-4 border-b hairline">Variants</th>
                <th className="eyebrow text-right py-3 px-4 border-b hairline">Total stock</th>
                <th className="eyebrow text-right py-3 px-4 border-b hairline hidden sm:table-cell">Base</th>
                <th className="eyebrow text-right py-3 px-6 md:px-10 border-b hairline">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const totalStock = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
                return (
                  <tr key={p.id} className="border-b hairline hover:bg-neutral-50" data-testid={`product-row-${p.id}`}>
                    <td className="py-4 px-6 md:px-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-100 border hairline overflow-hidden flex-shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-neutral-500 truncate">{p.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-neutral-600 hidden md:table-cell">{p.category}</td>
                    <td className="py-4 px-4 text-right font-mono-alt text-sm">{p.variants?.length || 0}</td>
                    <td className="py-4 px-4 text-right font-mono-alt text-sm">
                      <span className={totalStock <= 5 ? "text-[#E63946] font-semibold" : ""}>{totalStock}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono-alt text-sm hidden sm:table-cell">
                      ₹{p.base_price?.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 md:px-10 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          data-testid={`edit-product-${p.id}`}
                          className="p-2 border hairline hover:bg-neutral-100"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(p)}
                          data-testid={`delete-product-${p.id}`}
                          className="p-2 border hairline hover:bg-[#E63946] hover:text-white hover:border-[#E63946]"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductModal
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }) {
  const isNew = !product;
  const [form, setForm] = useState(() => ({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "T-Shirts",
    base_price: product?.base_price ?? 0,
    image_url: product?.image_url || "",
    variants: product?.variants?.length ? product.variants : generateMatrix(DEFAULT_SIZES, DEFAULT_COLORS, 0),
  }));
  const [sizes, setSizes] = useState(() =>
    Array.from(new Set((product?.variants || []).map((v) => v.size))) .length
      ? Array.from(new Set(product.variants.map((v) => v.size)))
      : DEFAULT_SIZES,
  );
  const [colors, setColors] = useState(() =>
    Array.from(new Set((product?.variants || []).map((v) => v.color))).length
      ? Array.from(new Set(product.variants.map((v) => v.color)))
      : DEFAULT_COLORS,
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function findVariant(size, color) {
    return form.variants.find((v) => v.size === size && v.color === color);
  }

  function updateVariant(size, color, patch) {
    setForm((f) => {
      const existing = f.variants.find((v) => v.size === size && v.color === color);
      if (existing) {
        return {
          ...f,
          variants: f.variants.map((v) =>
            v.size === size && v.color === color ? { ...v, ...patch } : v,
          ),
        };
      }
      return {
        ...f,
        variants: [
          ...f.variants,
          {
            size,
            color,
            sku: `${(form.name || "PRD").slice(0, 3).toUpperCase()}-${size}-${color.slice(0, 3).toUpperCase()}`,
            stock: 0,
            price: form.base_price,
            ...patch,
          },
        ],
      };
    });
  }

  function rebuildMatrix(newSizes, newColors) {
    // preserve any existing data
    const next = [];
    newSizes.forEach((s) =>
      newColors.forEach((c) => {
        const existing = findVariant(s, c);
        next.push(
          existing || {
            size: s,
            color: c,
            sku: `${(form.name || "PRD").slice(0, 3).toUpperCase()}-${s}-${c.slice(0, 3).toUpperCase()}`,
            stock: 0,
            price: form.base_price,
          },
        );
      }),
    );
    setForm((f) => ({ ...f, variants: next }));
  }

  function addSize(s) {
    if (!s.trim() || sizes.includes(s)) return;
    const next = [...sizes, s.trim()];
    setSizes(next);
    rebuildMatrix(next, colors);
  }

  function removeSize(s) {
    const next = sizes.filter((x) => x !== s);
    setSizes(next);
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.size !== s) }));
  }

  function addColor(c) {
    if (!c.trim() || colors.includes(c)) return;
    const next = [...colors, c.trim()];
    setColors(next);
    rebuildMatrix(sizes, next);
  }

  function removeColor(c) {
    const next = colors.filter((x) => x !== c);
    setColors(next);
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.color !== c) }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      // only keep variants for current size × color combos
      const keep = new Set(sizes.flatMap((s) => colors.map((c) => `${s}|${c}`)));
      const payload = {
        ...form,
        base_price: Number(form.base_price) || 0,
        variants: form.variants
          .filter((v) => keep.has(`${v.size}|${v.color}`))
          .map((v) => ({
            size: v.size,
            color: v.color,
            sku: v.sku || `${form.name.slice(0, 3).toUpperCase()}-${v.size}-${v.color.slice(0, 3).toUpperCase()}`,
            stock: Number(v.stock) || 0,
            price: Number(v.price) || 0,
          })),
      };
      if (isNew) await api.post("/products", payload);
      else await api.put(`/products/${product.id}`, payload);
      toast.success(isNew ? "Product created" : "Product updated");
      onSaved();
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-md flex items-start justify-center p-4 py-12 overflow-y-auto" data-testid="product-modal">
      <div className="bg-white border hairline w-full max-w-4xl my-8 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b hairline">
          <div>
            <span className="eyebrow">{isNew ? "New product" : "Edit product"}</span>
            <h2 className="font-display text-2xl font-bold mt-1">
              {isNew ? "Create a product" : form.name || "Edit product"}
            </h2>
          </div>
          <button onClick={onClose} data-testid="product-modal-close" className="p-2 hover:bg-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="eyebrow block mb-2">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                data-testid="product-name-input"
                className="w-full border hairline px-3 py-2 focus:outline-none focus:border-black"
                placeholder="Everyday Cotton Tee"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Category</label>
              <input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                data-testid="product-category-input"
                className="w-full border hairline px-3 py-2 focus:outline-none focus:border-black"
              />
            </div>
            <div>
                <label className="eyebrow block mb-2">Base price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.base_price}
                onChange={(e) => set("base_price", e.target.value)}
                data-testid="product-base-price-input"
                className="w-full border hairline px-3 py-2 focus:outline-none focus:border-black font-mono-alt"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Image</label>
              <ImagePicker value={form.image_url} onChange={(v) => set("image_url", v)} />
            </div>
            <div className="md:col-span-2">
              <label className="eyebrow block mb-2">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                data-testid="product-description-input"
                className="w-full border hairline px-3 py-2 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Size/Color chips */}
          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t hairline">
            <ChipEditor label="Sizes" items={sizes} onAdd={addSize} onRemove={removeSize} testid="sizes" />
            <ChipEditor label="Colors" items={colors} onAdd={addColor} onRemove={removeColor} testid="colors" />
          </div>

          {/* Variant matrix */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="eyebrow">Variants matrix</span>
                <div className="font-display text-xl font-bold mt-1">{sizes.length} × {colors.length} = {sizes.length * colors.length} SKUs</div>
              </div>
            </div>

            {sizes.length === 0 || colors.length === 0 ? (
              <div className="text-sm text-neutral-500 border hairline p-4">Add at least one size and one color to configure SKUs.</div>
            ) : (
              <div className="overflow-x-auto border hairline">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8F8F8]">
                      <th className="eyebrow text-left px-3 py-2 border-b hairline">Size \ Color</th>
                      {colors.map((c) => (
                        <th key={c} className="eyebrow text-left px-3 py-2 border-b border-l hairline">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((s) => (
                      <tr key={s} className="border-b hairline">
                        <td className="px-3 py-2 font-medium bg-[#F8F8F8]">{s}</td>
                        {colors.map((c) => {
                          const v = findVariant(s, c) || { sku: "", stock: 0, price: form.base_price };
                          return (
                            <td key={c} className="px-2 py-2 border-l hairline align-top" data-testid={`variant-cell-${s}-${c}`}>
                              <input
                                placeholder="SKU"
                                value={v.sku}
                                onChange={(e) => updateVariant(s, c, { sku: e.target.value })}
                                className="w-full text-xs font-mono-alt border-b hairline mb-1 py-1 focus:outline-none focus:border-black"
                                data-testid={`variant-sku-${s}-${c}`}
                              />
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Stock"
                                  value={v.stock}
                                  onChange={(e) => updateVariant(s, c, { stock: e.target.value })}
                                  className="w-full text-xs font-mono-alt border hairline py-1 px-1 focus:outline-none focus:border-black"
                                  data-testid={`variant-stock-${s}-${c}`}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="₹"
                                  value={v.price}
                                  onChange={(e) => updateVariant(s, c, { price: e.target.value })}
                                  className="w-full text-xs font-mono-alt border hairline py-1 px-1 focus:outline-none focus:border-black"
                                  data-testid={`variant-price-${s}-${c}`}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {err && <div className="text-sm text-[#E63946] border border-[#E63946] px-3 py-2" data-testid="product-modal-error">{err}</div>}

          <div className="flex items-center justify-end gap-2 pt-4 border-t hairline">
            <button type="button" onClick={onClose} className="px-4 py-2 border hairline text-sm hover:bg-neutral-100" data-testid="product-modal-cancel">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              data-testid="product-modal-save"
              className="px-6 py-2 bg-black text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChipEditor({ label, items, onAdd, onRemove, testid }) {
  const [v, setV] = useState("");
  function commit() {
    if (!v.trim()) return;
    onAdd(v);
    setV("");
  }
  return (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border hairline bg-neutral-50" data-testid={`chip-${testid}-${i}`}>
            {i}
            <button type="button" onClick={() => onRemove(i)} className="text-neutral-500 hover:text-[#E63946]" data-testid={`chip-remove-${testid}-${i}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={`+ ${label.slice(0, -1)}`}
          data-testid={`chip-input-${testid}`}
          className="text-xs border hairline px-2 py-1 w-24 focus:outline-none focus:border-black"
        />
      </div>
    </div>
  );
}

function generateMatrix(sizes, colors, basePrice) {
  const out = [];
  sizes.forEach((s) => colors.forEach((c) => out.push({ size: s, color: c, sku: `PRD-${s}-${c.slice(0, 3).toUpperCase()}`, stock: 0, price: basePrice })));
  return out;
}

const MAX_IMAGE_BYTES = 600 * 1024; // 600 KB cap after compression
const MAX_IMAGE_DIMENSION = 1024;

function fileToCompressedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        // step quality down until under MAX_IMAGE_BYTES
        let quality = 0.9;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > MAX_IMAGE_BYTES * 1.37 && quality > 0.4) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ImagePicker({ value, onChange }) {
  const [mode, setMode] = useState(value && value.startsWith("data:") ? "upload" : "url");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = React.useRef(null);

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr("");
    if (!f.type.startsWith("image/")) {
      setErr("Please choose an image file");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setErr("Max 8 MB. Try a smaller image.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(f);
      onChange(dataUrl);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="product-image-picker">
      <div className="inline-flex border hairline mb-3" role="tablist">
        <button
          type="button"
          onClick={() => setMode("url")}
          data-testid="image-mode-url"
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mode === "url" ? "bg-black text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          data-testid="image-mode-upload"
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border-l hairline ${
            mode === "upload" ? "bg-black text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          Upload
        </button>
      </div>

      {mode === "url" ? (
        <input
          value={value && value.startsWith("data:") ? "" : value || ""}
          onChange={(e) => onChange(e.target.value)}
          data-testid="product-image-input"
          className="w-full border hairline px-3 py-2 focus:outline-none focus:border-black"
          placeholder="https://…"
        />
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            data-testid="product-image-file-input"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            data-testid="product-image-browse-button"
            disabled={busy}
            className="w-full border hairline px-3 py-2 text-sm hover:bg-neutral-50 transition-colors disabled:opacity-60 flex items-center justify-between"
          >
            <span className="truncate">
              {busy ? "Processing…" : value && value.startsWith("data:") ? "Replace image" : "Choose file from your device"}
            </span>
            <span className="eyebrow">Browse</span>
          </button>
          <p className="text-[11px] text-neutral-500 mt-1.5">
            JPG/PNG up to 8 MB. Auto-compressed to ~600 KB, resized to 1024 px max.
          </p>
        </div>
      )}

      {err && (
        <div className="text-xs text-[#E63946] mt-2" data-testid="product-image-error">
          {err}
        </div>
      )}

      {value && (
        <div className="mt-3 flex items-center gap-3" data-testid="product-image-preview">
          <div className="w-20 h-20 border hairline overflow-hidden bg-neutral-50 flex-shrink-0">
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            data-testid="product-image-clear"
            className="text-xs text-neutral-500 hover:text-[#E63946] underline underline-offset-4"
          >
            Remove image
          </button>
        </div>
      )}
    </div>
  );
}
