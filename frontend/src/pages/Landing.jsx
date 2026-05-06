import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Shirt, Package, LineChart, Shield } from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1765009433753-c7462637d21f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjbG90aGluZyUyMHN0b3JlJTIwcmFja3xlbnwwfHx8fDE3Nzc5NTQwMjZ8MA&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-950" data-testid="landing-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b hairline">
        <div className="max-w-[1400px] mx-auto h-16 px-6 md:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-link">
            <div className="w-7 h-7 bg-black flex items-center justify-center">
              <Shirt className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              instawear<span className="text-[#E63946]">.</span>
            </span>
            <span className="eyebrow ml-2 hidden sm:inline">Partner Portal</span>
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            <Link
              to="/login"
              data-testid="header-signin-link"
              className="text-sm font-medium px-3 py-2 hover:bg-neutral-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              data-testid="header-getstarted-link"
              className="text-sm font-medium px-4 py-2 bg-black text-white hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              Get started <ArrowUpRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b hairline overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 px-6 md:px-10 py-16 md:py-28 gap-12">
          <div className="lg:col-span-7 flex flex-col justify-center animate-fadeup">
            <span className="eyebrow mb-6" data-testid="hero-eyebrow">
              B2B · Apparel Inventory · v1.0
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95]">
              Your shelf,
              <br />
              under control.
              <br />
              <span className="text-neutral-400">Every size. Every color.</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-neutral-600 max-w-2xl leading-relaxed">
              Instawear Partner is the operating layer for independent apparel brands —
              size/color variants, real-time stock, orders, and a dashboard that tells
              the truth. Built for the warehouse floor and the spreadsheet.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/register"
                data-testid="hero-cta-register"
                className="px-6 py-3 bg-black text-white font-medium hover:bg-neutral-800 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                Create vendor account <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                data-testid="hero-cta-login"
                className="px-6 py-3 border border-neutral-300 font-medium hover:bg-neutral-50 transition-colors"
              >
                Sign in
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-xl">
              <Stat k="Size × Color" v="first-class variants" />
              <Stat k="Real-time" v="stock updates" />
              <Stat k="100%" v="vendor data isolation" />
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] overflow-hidden border hairline">
              <img src={HERO_IMG} alt="Apparel rack" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-transparent" />
              <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                <div className="bg-white px-3 py-1.5">
                  <span className="eyebrow">SKU-TEE-M-BLK</span>
                </div>
                <div className="bg-[#2A9D8F] text-white px-3 py-1.5 text-xs font-semibold tracking-wider uppercase">
                  Ready to list
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="eyebrow">Live stock</div>
                    <div className="font-display text-3xl font-bold mt-1">Everyday Tee</div>
                  </div>
                  <div className="text-right">
                    <div className="eyebrow">MRP</div>
                    <div className="font-display text-2xl font-bold mt-1">₹499</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-1 text-[10px] font-mono-alt">
                  {["S:—", "M:—", "L:—", "XL:—"].map((x) => (
                    <div key={x} className="bg-neutral-100 px-2 py-1 text-center">{x}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b hairline">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20">
          <span className="eyebrow">Why Instawear</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mt-3 max-w-3xl">
            Generic ERPs weren't built for clothing.
            <span className="text-neutral-400"> We were.</span>
          </h2>
          <div className="mt-14 grid md:grid-cols-3 gap-0 border-l border-t hairline">
            <Feature
              icon={<Package className="w-6 h-6" />}
              title="Variant-first inventory"
              body="Size × color matrix inputs. Per-variant SKUs, stock, price. Designed for warehouse staff on a phone."
            />
            <Feature
              icon={<LineChart className="w-6 h-6" />}
              title="A dashboard you'll actually open"
              body="Live revenue, 14-day sales trend, low-stock alerts, and top-moving pieces — no data lake required."
            />
            <Feature
              icon={<Shield className="w-6 h-6" />}
              title="Multi-tenant by default"
              body="JWT auth with strict vendor isolation. Every product and order is scoped — no cross-vendor bleed."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20 flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter max-w-2xl leading-[0.95]">
            Ship faster.
            <br />
            Stock smarter.
          </h2>
          <div className="flex flex-col md:items-end gap-4">
            <div className="eyebrow text-neutral-400">Free while in beta</div>
            <p className="text-sm text-neutral-300 max-w-xs md:text-right">
              Create your vendor workspace and start listing in under a minute. No credit card, no onboarding call.
            </p>
            <Link
              to="/register"
              data-testid="cta-register-link"
              className="px-6 py-3 bg-white text-black font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 w-fit"
            >
              Create vendor account <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-900 bg-black text-neutral-500">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row gap-2 justify-between text-xs">
          <span>© {new Date().getFullYear()} Instawear Labs</span>
          <span className="font-mono-alt">v1.0 · Multi-tenant B2B SaaS</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ k, v }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold">{k}</div>
      <div className="eyebrow mt-1">{v}</div>
    </div>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div className="p-8 border-r border-b hairline group hover:bg-neutral-50 transition-colors">
      <div className="w-10 h-10 bg-black text-white flex items-center justify-center">{icon}</div>
      <h3 className="font-display text-2xl font-bold mt-6 tracking-tight">{title}</h3>
      <p className="mt-3 text-neutral-600 leading-relaxed">{body}</p>
    </div>
  );
}
