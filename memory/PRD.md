# Instawear Partner Portal — PRD

## Problem Statement
Multi-tenant B2B SaaS for small/mid apparel vendors. Vendor-scoped product catalog with size/color variants, order fulfillment workflow, and a real-time analytics dashboard. Platform admin role for oversight.

**Stack**: React (CRA) + FastAPI + MongoDB. Auth: JWT (httpOnly cookies + Bearer fallback).

## User Personas
- **Vendor**: small apparel brand owner / warehouse staff. Registers, manages products, updates order statuses, monitors stock.
- **Admin**: platform operator. Oversees all vendors, can suspend/activate accounts, sees global KPIs.

## Core Requirements
- Multi-tenant data isolation by `vendor_id`
- Apparel variants as first-class (size × color × SKU × stock × price)
- Mobile-responsive (sidebar collapses, overlay menu, dense tables stack)
- Order lifecycle: pending → packed → shipped → delivered → cancelled
- Dashboard: revenue (14d), orders, stock value, low-stock alerts (≤5), sales trend, top products
- Admin: suspend/activate vendors; top vendors by revenue

## Implemented (2026-01-05)
- Auth: register/login/logout/me, JWT cookies + Bearer, bcrypt hashing, role checks
- Products: CRUD with variants matrix (size × color)
- Orders: list + status filter + status update
- Vendor dashboard: KPIs, 14-day sales trend (Recharts line), low-stock, top products, recent orders
- Admin panel: vendors table with product/order counts, suspend/activate toggle, platform KPIs, top vendors
- Landing page + split-screen login + split-screen register
- Mobile-responsive sidebar + overlay menu
- Currency: ₹ (INR) with `en-IN` locale formatting
- **No seeded demo data** — only admin account is seeded on startup
- All interactive elements have `data-testid`
- Tested: 18/18 backend pytest pass; full Playwright e2e covered

## Remaining (P1/P2 backlog)
- P1: Profile/settings page (edit business info, change password)
- P1: Forgot/reset password flow (endpoints scaffolded in playbook but not wired in UI)
- P1: Product image upload (currently URL only)
- P2: Bulk CSV import for products
- P2: Order creation UI (currently only status update — orders would be created by the parent e-commerce platform)
- P2: Predictive low-stock (AI)
- P2: CORS narrowed to specific origin for production; switch on lifespan handlers

## Next Tasks
- User creates their first vendor account and adds products
- Wire up password reset if needed
- Production hardening (cookies secure=True, samesite=none, CORS origin list)
