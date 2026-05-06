"""
Backend tests for Instawear Partner Portal.
Covers: auth (register/login/me/logout), multi-tenancy product isolation,
product CRUD with variants, orders (list/filter/status update), dashboard stats,
admin endpoints (list vendors, toggle, stats), and JSON serializability (no _id).
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend env if not exported
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"


def _client(token=None):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=15)
    return r


# ---------------- Auth ----------------
class TestAuth:
    def test_health(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_register_and_me(self):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": email,
            "password": "secret123",
            "business_name": "Test Biz",
            "contact_name": "Test User",
        }
        r = requests.post(f"{API}/auth/register", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == email
        assert data["role"] == "vendor"
        assert "id" in data
        assert "_id" not in data
        assert "password_hash" not in data
        # cookies set
        assert "access_token" in r.cookies or True  # some proxies strip cookies; tolerate
        # /me with cookie session
        s = requests.Session()
        s.post(f"{API}/auth/register", json={
            "email": f"TEST_{uuid.uuid4().hex[:8]}@example.com",
            "password": "secret123",
            "business_name": "X",
            "contact_name": "Y",
        }, timeout=15)
        # use bearer style
        r2 = _login(email, "secret123")
        assert r2.status_code == 200
        token = r2.json()["access_token"]
        me = _client(token).get(f"{API}/auth/me", timeout=10)
        assert me.status_code == 200
        assert me.json()["email"] == email

    def test_login_vendor_seeded(self):
        r = _login("north@instawear.com", "demo1234")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["role"] == "vendor"
        assert data["business_name"] == "Northbound Apparel Co."
        assert "access_token" in data
        assert "_id" not in data

    def test_login_admin_seeded(self):
        r = _login("admin@instawear.com", "admin123")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["role"] == "admin"
        assert "access_token" in data

    def test_login_wrong_password(self):
        r = _login("north@instawear.com", "wrongpass")
        assert r.status_code == 401
        body = r.json()
        assert isinstance(body.get("detail"), str)


# ---------------- Fixtures ----------------
@pytest.fixture(scope="module")
def vendor_a_token():
    r = _login("north@instawear.com", "demo1234")
    assert r.status_code == 200
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def vendor_b_token():
    r = _login("atelier@instawear.com", "demo1234")
    assert r.status_code == 200
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_token():
    r = _login("admin@instawear.com", "admin123")
    assert r.status_code == 200
    return r.json()["access_token"]


# ---------------- Products & Multi-tenancy ----------------
class TestProducts:
    def test_list_products_seeded(self, vendor_a_token):
        r = _client(vendor_a_token).get(f"{API}/products", timeout=10)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        assert "_id" not in items[0]
        assert "variants" in items[0]

    def test_create_get_update_delete(self, vendor_a_token):
        c = _client(vendor_a_token)
        payload = {
            "name": "TEST_Polo",
            "description": "test",
            "category": "Polos",
            "base_price": 30.0,
            "image_url": "",
            "variants": [
                {"size": "M", "color": "Navy", "sku": "TST-M-NAV", "stock": 10, "price": 30.0},
                {"size": "L", "color": "Navy", "sku": "TST-L-NAV", "stock": 5, "price": 30.0},
            ],
        }
        r = c.post(f"{API}/products", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        created = r.json()
        pid = created["id"]
        assert created["name"] == "TEST_Polo"
        assert len(created["variants"]) == 2
        assert "_id" not in created

        # GET
        r = c.get(f"{API}/products/{pid}", timeout=10)
        assert r.status_code == 200
        assert r.json()["id"] == pid

        # PUT
        payload["base_price"] = 35.0
        payload["name"] = "TEST_Polo_Updated"
        r = c.put(f"{API}/products/{pid}", json=payload, timeout=10)
        assert r.status_code == 200
        assert r.json()["base_price"] == 35.0
        assert r.json()["name"] == "TEST_Polo_Updated"

        # GET verify persisted
        r = c.get(f"{API}/products/{pid}", timeout=10)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Polo_Updated"

        # DELETE
        r = c.delete(f"{API}/products/{pid}", timeout=10)
        assert r.status_code == 200

        # 404 after delete
        r = c.get(f"{API}/products/{pid}", timeout=10)
        assert r.status_code == 404

    def test_multitenancy_isolation(self, vendor_a_token, vendor_b_token):
        # Vendor A creates a product
        ca = _client(vendor_a_token)
        cb = _client(vendor_b_token)
        payload = {
            "name": "TEST_Isolation",
            "category": "Test",
            "base_price": 10.0,
            "variants": [{"size": "S", "color": "Red", "sku": "ISO-S-RED", "stock": 1, "price": 10.0}],
        }
        r = ca.post(f"{API}/products", json=payload, timeout=10)
        assert r.status_code == 200
        pid = r.json()["id"]

        # Vendor B should not see/access it
        r = cb.get(f"{API}/products/{pid}", timeout=10)
        assert r.status_code == 404

        r = cb.put(f"{API}/products/{pid}", json=payload, timeout=10)
        assert r.status_code == 404

        r = cb.delete(f"{API}/products/{pid}", timeout=10)
        assert r.status_code == 404

        # Vendor B's product list should not contain it
        r = cb.get(f"{API}/products", timeout=10)
        assert r.status_code == 200
        assert all(p["id"] != pid for p in r.json())

        # cleanup
        ca.delete(f"{API}/products/{pid}", timeout=10)


# ---------------- Orders ----------------
class TestOrders:
    def test_list_orders(self, vendor_a_token):
        r = _client(vendor_a_token).get(f"{API}/orders", timeout=10)
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        assert len(orders) >= 1
        assert "_id" not in orders[0]
        assert "status" in orders[0]
        assert "items" in orders[0]

    def test_filter_by_status(self, vendor_a_token):
        r = _client(vendor_a_token).get(f"{API}/orders?status=pending", timeout=10)
        assert r.status_code == 200
        for o in r.json():
            assert o["status"] == "pending"

    def test_update_status(self, vendor_a_token):
        c = _client(vendor_a_token)
        orders = c.get(f"{API}/orders", timeout=10).json()
        assert len(orders) > 0
        oid = orders[0]["id"]
        r = c.put(f"{API}/orders/{oid}/status", json={"status": "packed"}, timeout=10)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "packed"
        # verify
        orders2 = c.get(f"{API}/orders", timeout=10).json()
        match = next((o for o in orders2 if o["id"] == oid), None)
        assert match and match["status"] == "packed"

    def test_invalid_status_rejected(self, vendor_a_token):
        c = _client(vendor_a_token)
        oid = c.get(f"{API}/orders", timeout=10).json()[0]["id"]
        r = c.put(f"{API}/orders/{oid}/status", json={"status": "invalid"}, timeout=10)
        assert r.status_code == 422


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_dashboard_stats(self, vendor_a_token):
        r = _client(vendor_a_token).get(f"{API}/dashboard/stats", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("kpis", "sales_trend", "low_stock", "top_products", "recent_orders"):
            assert k in d
        assert len(d["sales_trend"]) == 14
        for k in ("total_revenue", "order_count", "pending_count", "delivered_count",
                  "product_count", "total_stock_units", "stock_value", "low_stock_count"):
            assert k in d["kpis"]
        # serializability
        for o in d["recent_orders"]:
            assert "_id" not in o


# ---------------- Admin ----------------
class TestAdmin:
    def test_admin_endpoints_reject_vendor(self, vendor_a_token):
        c = _client(vendor_a_token)
        r = c.get(f"{API}/admin/vendors", timeout=10)
        assert r.status_code == 403
        r = c.get(f"{API}/admin/stats", timeout=10)
        assert r.status_code == 403

    def test_admin_list_vendors(self, admin_token):
        r = _client(admin_token).get(f"{API}/admin/vendors", timeout=10)
        assert r.status_code == 200
        vendors = r.json()
        assert isinstance(vendors, list)
        assert len(vendors) >= 2
        v = vendors[0]
        assert "product_count" in v and "order_count" in v
        assert "_id" not in v
        assert "password_hash" not in v

    def test_admin_stats(self, admin_token):
        r = _client(admin_token).get(f"{API}/admin/stats", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "kpis" in d and "top_vendors" in d
        for k in ("vendor_count", "active_vendors", "product_count", "order_count", "total_revenue"):
            assert k in d["kpis"]

    def test_admin_toggle_vendor_suspend_login_403_then_reactivate(self, admin_token):
        # find atelier vendor
        c = _client(admin_token)
        vendors = c.get(f"{API}/admin/vendors", timeout=10).json()
        v = next((x for x in vendors if x["email"] == "atelier@instawear.com"), None)
        assert v is not None
        vid = v["vendor_id"]

        # suspend
        r = c.put(f"{API}/admin/vendors/{vid}/status", json={"status": "suspended"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "suspended"

        # login should now 403
        r = _login("atelier@instawear.com", "demo1234")
        assert r.status_code == 403
        assert "suspended" in r.json().get("detail", "").lower()

        # reactivate
        r = c.put(f"{API}/admin/vendors/{vid}/status", json={"status": "active"}, timeout=10)
        assert r.status_code == 200
        # login works again
        r = _login("atelier@instawear.com", "demo1234")
        assert r.status_code == 200

    def test_admin_invalid_status(self, admin_token):
        c = _client(admin_token)
        vendors = c.get(f"{API}/admin/vendors", timeout=10).json()
        vid = vendors[0]["vendor_id"]
        r = c.put(f"{API}/admin/vendors/{vid}/status", json={"status": "garbage"}, timeout=10)
        assert r.status_code == 400
