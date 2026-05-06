import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { formatApiError } from "@/lib/api";
import { Shirt, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const HERO_IMG =
  "https://images.unsplash.com/photo-1759572095317-3a96f9a98e2b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwYXBwYXJlbCUyMGZsYXRsYXl8ZW58MHx8fHwxNzc3OTU0MDA4fDA&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.contact_name || u.business_name || "partner"}`);
      navigate(u.role === "admin" ? "/admin" : "/app/dashboard", { replace: true });
    } catch (e) {
      setError(formatApiError(e.response?.data?.detail) || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white" data-testid="login-page">
      {/* Left — form */}
      <div className="flex flex-col px-6 md:px-16 py-10 md:py-16">
        <Link to="/" className="flex items-center gap-2 w-fit" data-testid="login-brand-link">
          <div className="w-7 h-7 bg-black flex items-center justify-center">
            <Shirt className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            instawear<span className="text-[#E63946]">.</span>
          </span>
        </Link>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <span className="eyebrow" data-testid="login-eyebrow">Partner access</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mt-3">
            Sign in.
          </h1>
          <p className="text-neutral-600 mt-2">
            Enter your credentials to access your vendor portal.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-6" data-testid="login-form">
            <div>
              <label className="eyebrow block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                className="w-full bg-transparent border-b border-neutral-300 py-2 focus:outline-none focus:border-black transition-colors"
                placeholder="you@brand.com"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input"
                className="w-full bg-transparent border-b border-neutral-300 py-2 focus:outline-none focus:border-black transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="text-sm text-[#E63946] border border-[#E63946] px-3 py-2"
                data-testid="login-error"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              data-testid="login-submit-button"
              className="w-full bg-black text-white font-medium py-3 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : (<>Sign in <ArrowUpRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <div className="mt-8 border hairline p-4 bg-neutral-50">
            <div className="eyebrow mb-1">First time here?</div>
            <p className="text-sm text-neutral-600">
              Instawear Partner Portal is invite-free for now — create a vendor account and start listing in seconds.
            </p>
          </div>

          <p className="mt-8 text-sm text-neutral-600">
            New vendor?{" "}
            <Link to="/register" className="font-medium text-black underline underline-offset-4" data-testid="login-register-link">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Right — imagery */}
      <div className="hidden lg:block relative">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <div className="eyebrow text-white/70">Built for apparel</div>
          <div className="font-display text-4xl font-bold tracking-tighter mt-2 max-w-md leading-tight">
            Every size, every color — finally in one place.
          </div>
        </div>
      </div>
    </div>
  );
}
