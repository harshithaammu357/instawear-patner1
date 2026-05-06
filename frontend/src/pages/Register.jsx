import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { formatApiError } from "@/lib/api";
import { Shirt, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      toast.success(`Welcome to Instawear, ${form.business_name}`);
      navigate("/app/dashboard", { replace: true });
    } catch (e) {
      setError(formatApiError(e.response?.data?.detail) || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white" data-testid="register-page">
      <div className="flex flex-col px-6 md:px-16 py-10 md:py-16 order-2 lg:order-1">
        <Link to="/" className="flex items-center gap-2 w-fit" data-testid="register-brand-link">
          <div className="w-7 h-7 bg-black flex items-center justify-center">
            <Shirt className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            instawear<span className="text-[#E63946]">.</span>
          </span>
        </Link>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <span className="eyebrow">New vendor</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mt-3">
            Claim your shelf.
          </h1>
          <p className="text-neutral-600 mt-2">
            Takes 30 seconds. No credit card, no onboarding call.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-6" data-testid="register-form">
            <div>
              <label className="eyebrow block mb-2">Business name</label>
              <input
                required
                minLength={2}
                value={form.business_name}
                onChange={(e) => set("business_name", e.target.value)}
                data-testid="register-business-input"
                className="w-full bg-transparent border-b border-neutral-300 py-2 focus:outline-none focus:border-black"
                placeholder="Northbound Apparel Co."
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Your name</label>
              <input
                required
                value={form.contact_name}
                onChange={(e) => set("contact_name", e.target.value)}
                data-testid="register-name-input"
                className="w-full bg-transparent border-b border-neutral-300 py-2 focus:outline-none focus:border-black"
                placeholder="Priya Sharma"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                data-testid="register-email-input"
                className="w-full bg-transparent border-b border-neutral-300 py-2 focus:outline-none focus:border-black"
                placeholder="you@brand.com"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                data-testid="register-password-input"
                className="w-full bg-transparent border-b border-neutral-300 py-2 focus:outline-none focus:border-black"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <div className="text-sm text-[#E63946] border border-[#E63946] px-3 py-2" data-testid="register-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              data-testid="register-submit-button"
              className="w-full bg-black text-white font-medium py-3 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? "Creating account…" : (<>Create account <ArrowUpRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <p className="mt-8 text-sm text-neutral-600">
            Already a partner?{" "}
            <Link to="/login" className="font-medium text-black underline underline-offset-4" data-testid="register-signin-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="relative bg-black text-white order-1 lg:order-2 overflow-hidden">
        <div className="absolute inset-0 grain" />
        <div className="relative h-full flex flex-col justify-between p-10 md:p-16">
          <div className="eyebrow text-white/60">The manifesto</div>
          <div>
            <div className="font-display text-4xl md:text-6xl font-bold tracking-tighter leading-[0.95]">
              Inventory that behaves
              <br />
              <span className="text-neutral-500">like a garment.</span>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6 max-w-md text-sm">
              <div>
                <div className="eyebrow text-white/60">Size × Color</div>
                <div className="mt-1 text-white/90">First-class schema. Not a workaround.</div>
              </div>
              <div>
                <div className="eyebrow text-white/60">Isolation</div>
                <div className="mt-1 text-white/90">Your data, only yours. JWT multi-tenant.</div>
              </div>
              <div>
                <div className="eyebrow text-white/60">Mobile-first</div>
                <div className="mt-1 text-white/90">Designed for the warehouse floor.</div>
              </div>
              <div>
                <div className="eyebrow text-white/60">Zero fluff</div>
                <div className="mt-1 text-white/90">Every pixel earns its keep.</div>
              </div>
            </div>
          </div>
          <div className="font-mono-alt text-xs text-white/50">v1.0 · multi-tenant · JWT</div>
        </div>
      </div>
    </div>
  );
}
