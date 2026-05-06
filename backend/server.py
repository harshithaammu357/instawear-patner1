from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

app = FastAPI(title="Instawear Partner Portal API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("instawear")


# -----------------------------------------------------------------------------
# Auth helpers
# -----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=False,
                        samesite="lax", max_age=12 * 3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False,
                        samesite="lax", max_age=7 * 24 * 3600, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_vendor(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "vendor":
        raise HTTPException(status_code=403, detail="Vendor access required")
    return user


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    business_name: str = Field(min_length=2)
    contact_name: str = Field(min_length=2)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: str
    role: str
    business_name: Optional[str] = None
    contact_name: Optional[str] = None
    vendor_id: Optional[str] = None
    status: Optional[str] = "active"
    created_at: Optional[str] = None


class Variant(BaseModel):
    size: str
    color: str
    sku: str
    stock: int = 0
    price: float = 0.0


class ProductIn(BaseModel):
    name: str
    description: Optional[str] = ""
    category: str = "Apparel"
    base_price: float = 0.0
    image_url: Optional[str] = ""
    variants: List[Variant] = []


class Product(ProductIn):
    model_config = ConfigDict(extra="ignore")
    id: str
    vendor_id: str
    created_at: str
    updated_at: str


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    sku: str
    size: str
    color: str
    quantity: int
    price: float


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "packed", "shipped", "delivered", "cancelled"]


# -----------------------------------------------------------------------------
# Auth Routes
# -----------------------------------------------------------------------------
@api.post("/auth/register")
async def register(body: RegisterRequest, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "role": "vendor",
        "vendor_id": user_id,  # vendor_id == user id for vendors (simple multi-tenancy)
        "business_name": body.business_name,
        "contact_name": body.contact_name,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)

    access = create_access_token(user_id, email, "vendor")
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)

    doc.pop("password_hash", None)
    doc.pop("_id", None)
    return doc


@api.post("/auth/login")
async def login(body: LoginRequest, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended. Contact support.")

    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)

    user.pop("password_hash", None)
    user.pop("_id", None)
    return {**user, "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# -----------------------------------------------------------------------------
# Products (vendor-scoped)
# -----------------------------------------------------------------------------
@api.get("/products")
async def list_products(user: dict = Depends(require_vendor)):
    products = await db.products.find({"vendor_id": user["vendor_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return products


@api.post("/products")
async def create_product(body: ProductIn, user: dict = Depends(require_vendor)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "vendor_id": user["vendor_id"],
        **body.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/products/{product_id}")
async def get_product(product_id: str, user: dict = Depends(require_vendor)):
    p = await db.products.find_one({"id": product_id, "vendor_id": user["vendor_id"]}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@api.put("/products/{product_id}")
async def update_product(product_id: str, body: ProductIn, user: dict = Depends(require_vendor)):
    update = body.model_dump()
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.products.update_one(
        {"id": product_id, "vendor_id": user["vendor_id"]},
        {"$set": update},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc


@api.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(require_vendor)):
    res = await db.products.delete_one({"id": product_id, "vendor_id": user["vendor_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


# -----------------------------------------------------------------------------
# Orders (vendor-scoped)
# -----------------------------------------------------------------------------
@api.get("/orders")
async def list_orders(
    status: Optional[str] = None,
    user: dict = Depends(require_vendor),
):
    q = {"vendor_id": user["vendor_id"]}
    if status:
        q["status"] = status
    orders = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return orders


@api.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: OrderStatusUpdate, user: dict = Depends(require_vendor)):
    res = await db.orders.update_one(
        {"id": order_id, "vendor_id": user["vendor_id"]},
        {"$set": {"status": body.status, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return doc


# -----------------------------------------------------------------------------
# Dashboard (vendor)
# -----------------------------------------------------------------------------
@api.get("/dashboard/stats")
async def dashboard_stats(user: dict = Depends(require_vendor)):
    vendor_id = user["vendor_id"]
    orders = await db.orders.find({"vendor_id": vendor_id}, {"_id": 0}).to_list(5000)
    products = await db.products.find({"vendor_id": vendor_id}, {"_id": 0}).to_list(5000)

    total_revenue = sum(o.get("total", 0) for o in orders if o.get("status") != "cancelled")
    order_count = len(orders)
    pending_count = sum(1 for o in orders if o.get("status") == "pending")
    delivered_count = sum(1 for o in orders if o.get("status") == "delivered")

    # stock
    total_stock_units = 0
    stock_value = 0.0
    low_stock = []
    for p in products:
        for v in p.get("variants", []):
            total_stock_units += v.get("stock", 0)
            stock_value += v.get("stock", 0) * v.get("price", 0)
            if v.get("stock", 0) <= 5:
                low_stock.append({
                    "product_id": p["id"],
                    "product_name": p["name"],
                    "sku": v.get("sku"),
                    "size": v.get("size"),
                    "color": v.get("color"),
                    "stock": v.get("stock", 0),
                })

    # sales trend — last 14 days
    today = datetime.now(timezone.utc).date()
    buckets = {(today - timedelta(days=i)).isoformat(): 0.0 for i in range(13, -1, -1)}
    for o in orders:
        if o.get("status") == "cancelled":
            continue
        try:
            d = datetime.fromisoformat(o["created_at"]).date().isoformat()
            if d in buckets:
                buckets[d] += o.get("total", 0)
        except Exception:
            pass
    sales_trend = [{"date": k, "revenue": round(v, 2)} for k, v in buckets.items()]

    # top products by revenue
    revenue_by_product = {}
    for o in orders:
        if o.get("status") == "cancelled":
            continue
        for item in o.get("items", []):
            key = item["product_id"]
            revenue_by_product.setdefault(key, {"product_id": key, "name": item["product_name"], "units": 0, "revenue": 0.0})
            revenue_by_product[key]["units"] += item.get("quantity", 0)
            revenue_by_product[key]["revenue"] += item.get("quantity", 0) * item.get("price", 0)
    top_products = sorted(revenue_by_product.values(), key=lambda x: x["revenue"], reverse=True)[:5]

    recent_orders = sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:8]

    return {
        "kpis": {
            "total_revenue": round(total_revenue, 2),
            "order_count": order_count,
            "pending_count": pending_count,
            "delivered_count": delivered_count,
            "product_count": len(products),
            "total_stock_units": total_stock_units,
            "stock_value": round(stock_value, 2),
            "low_stock_count": len(low_stock),
        },
        "sales_trend": sales_trend,
        "low_stock": low_stock[:10],
        "top_products": top_products,
        "recent_orders": recent_orders,
    }


# -----------------------------------------------------------------------------
# Admin
# -----------------------------------------------------------------------------
@api.get("/admin/vendors")
async def admin_list_vendors(_admin: dict = Depends(require_admin)):
    vendors = await db.users.find({"role": "vendor"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(2000)
    # enrich with counts
    for v in vendors:
        v["product_count"] = await db.products.count_documents({"vendor_id": v["vendor_id"]})
        v["order_count"] = await db.orders.count_documents({"vendor_id": v["vendor_id"]})
    return vendors


@api.put("/admin/vendors/{vendor_id}/status")
async def admin_toggle_vendor(vendor_id: str, body: dict, _admin: dict = Depends(require_admin)):
    new_status = body.get("status")
    if new_status not in ("active", "suspended"):
        raise HTTPException(status_code=400, detail="status must be active or suspended")
    res = await db.users.update_one({"vendor_id": vendor_id, "role": "vendor"}, {"$set": {"status": new_status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"ok": True, "status": new_status}


@api.get("/admin/stats")
async def admin_stats(_admin: dict = Depends(require_admin)):
    vendor_count = await db.users.count_documents({"role": "vendor"})
    active_vendors = await db.users.count_documents({"role": "vendor", "status": "active"})
    product_count = await db.products.count_documents({})
    order_count = await db.orders.count_documents({})
    orders = await db.orders.find({}, {"_id": 0, "total": 1, "status": 1, "created_at": 1}).to_list(10000)
    total_revenue = sum(o.get("total", 0) for o in orders if o.get("status") != "cancelled")

    # revenue by vendor
    agg = await db.orders.aggregate([
        {"$match": {"status": {"$ne": "cancelled"}}},
        {"$group": {"_id": "$vendor_id", "revenue": {"$sum": "$total"}, "orders": {"$sum": 1}}},
        {"$sort": {"revenue": -1}},
        {"$limit": 10},
    ]).to_list(10)

    # resolve vendor names
    out = []
    for row in agg:
        v = await db.users.find_one({"vendor_id": row["_id"]}, {"_id": 0, "business_name": 1})
        out.append({
            "vendor_id": row["_id"],
            "business_name": v.get("business_name") if v else "Unknown",
            "revenue": round(row["revenue"], 2),
            "orders": row["orders"],
        })

    return {
        "kpis": {
            "vendor_count": vendor_count,
            "active_vendors": active_vendors,
            "product_count": product_count,
            "order_count": order_count,
            "total_revenue": round(total_revenue, 2),
        },
        "top_vendors": out,
    }


# -----------------------------------------------------------------------------
# Seed data
# -----------------------------------------------------------------------------
async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "vendor_id": None,
            "business_name": "Instawear HQ",
            "contact_name": "Platform Admin",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin: %s", ADMIN_EMAIL)
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
        logger.info("Updated admin password")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index([("vendor_id", 1), ("created_at", -1)])
    await db.orders.create_index([("vendor_id", 1), ("created_at", -1)])
    await db.orders.create_index([("vendor_id", 1), ("status", 1)])
    await seed_admin()


@app.on_event("shutdown")
async def shutdown():
    client.close()


@api.get("/")
async def root():
    return {"service": "Instawear Partner Portal API", "status": "ok"}


app.include_router(api)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
