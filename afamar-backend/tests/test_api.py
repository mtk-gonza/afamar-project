class TestHealth:
    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestClients:
    def test_create_and_list(self, client):
        r = client.post("/api/v1/clients", json={"name": "Test Client", "phone": "123"})
        assert r.status_code == 201
        data = r.json()
        assert data["success"] is True
        assert data["data"]["name"] == "Test Client"

        r = client.get("/api/v1/clients")
        assert r.status_code == 200
        assert len(r.json()["data"]) == 1

    def test_delete(self, client):
        r = client.post("/api/v1/clients", json={"name": "To Delete"})
        cid = r.json()["data"]["id"]
        r = client.delete(f"/api/v1/clients/{cid}")
        assert r.status_code == 204

        r = client.get("/api/v1/clients")
        assert len(r.json()["data"]) == 0


class TestMaterials:
    def test_categories(self, client, seed_db):
        r = client.get("/api/v1/materials/categories")
        assert r.status_code == 200
        assert len(r.json()["data"]) == 2

    def test_colors_thicknesses(self, client, seed_db):
        r = client.get("/api/v1/materials/colors")
        assert len(r.json()["data"]) == 2
        r = client.get("/api/v1/materials/thicknesses")
        assert len(r.json()["data"]) == 2

    def test_create_material_with_price(self, client, seed_db):
        r = client.post("/api/v1/materials", json={
            "name": "Granito Negro",
            "category_id": 1,
            "color": "Negro",
            "available_thickness": "2cm",
            "base_price": 45.0,
        })
        assert r.status_code == 201
        d = r.json()["data"]
        assert d["name"] == "Granito Negro"
        assert d["base_price"] == 45.0

        r = client.get(f"/api/v1/materials/{d['id']}")
        assert r.json()["data"]["base_price"] == 45.0


class TestBudgets:
    def test_create(self, client, seed_db):
        client.post("/api/v1/clients", json={"name": "Client A"})
        r = client.post("/api/v1/budgets", json={
            "client_id": 1,
            "material": "Granito",
            "items": [{"description": "Mesada", "quantity": 1, "unit_price": 100, "total": 100}],
            "subtotal": 100,
            "total": 100,
        })
        assert r.status_code == 201
        d = r.json()["data"]
        assert d["number"].startswith("P-")

    def test_approval_flow(self, client, seed_db):
        client.post("/api/v1/clients", json={"name": "Client B"})
        client.post("/api/v1/budgets", json={
            "client_id": 1,
            "items": [{"description": "Test", "quantity": 1, "unit_price": 50, "total": 50}],
            "subtotal": 50,
            "total": 50,
        })
        r = client.put("/api/v1/budgets/1", json={"status": "approved"})
        assert r.status_code == 200
        assert r.json()["data"]["status"] == "approved"


class TestWorkOrders:
    def test_create_from_budget(self, client, seed_db):
        client.post("/api/v1/clients", json={"name": "Client C"})
        client.post("/api/v1/budgets", json={
            "client_id": 1,
            "items": [{"description": "Item", "quantity": 1, "unit_price": 100, "total": 100}],
            "subtotal": 100,
            "total": 100,
        })
        client.put("/api/v1/budgets/1", json={"status": "approved"})
        r = client.post("/api/v1/work-orders/from-budget/1")
        assert r.status_code == 201
        assert r.json()["data"]["number"].startswith("A-")


class TestSettings:
    def test_get_defaults(self, client):
        r = client.get("/api/v1/settings")
        assert r.status_code == 200
        d = r.json()["data"]
        assert d["company_name"] == "AFAMAR"

    def test_update(self, client, seed_db):
        r = client.put("/api/v1/settings", json={"company_name": "Test Corp"})
        assert r.status_code == 200
        assert r.json()["data"]["company_name"] == "Test Corp"


class TestCash:
    def test_get_or_create_daily(self, client):
        r = client.get("/api/v1/cash/daily", params={"query_date": "2026-06-23"})
        assert r.status_code == 200
        d = r.json()
        assert d["date"] == "2026-06-23"
        assert d["total_income"] == 0
        assert d["is_closed"] is False

    def test_create_movement(self, client):
        client.get("/api/v1/cash/daily", params={"query_date": "2026-06-23"})

        r = client.post("/api/v1/cash/movements", json={
            "date": "2026-06-23",
            "type": "INCOME",
            "amount": 5000,
            "description": "Test income",
            "payment_method": "Efectivo",
        })
        assert r.status_code == 200
        assert r.json()["amount"] == 5000

        r = client.get("/api/v1/cash/daily", params={"query_date": "2026-06-23"})
        assert r.json()["total_income"] == 5000
        assert r.json()["current_balance"] == 5000

    def test_close_daily_cash(self, client):
        client.post("/api/v1/cash/movements", json={
            "date": "2026-06-23",
            "type": "INCOME",
            "amount": 1000,
            "description": "Close test",
        })
        r = client.post("/api/v1/cash/daily/close", json={"date": "2026-06-23"})
        assert r.status_code == 200
        assert r.json()["is_closed"] is True


class TestWhatsAppWorkOrder:
    def test_send_work_order_whatsapp_no_phone(self, client, seed_db):
        client.post("/api/v1/clients", json={"name": "WO WA Client"})
        client.post("/api/v1/budgets", json={
            "client_id": 1,
            "items": [{"description": "Item", "quantity": 1, "unit_price": 100, "total": 100}],
            "subtotal": 100,
            "total": 100,
        })
        client.put("/api/v1/budgets/1", json={"status": "approved"})
        r = client.post("/api/v1/work-orders/from-budget/1")
        wo_id = r.json()["data"]["id"]

        r = client.post(f"/api/v1/whatsapp/send-work-order/{wo_id}", json={"phone": None})
        assert r.status_code == 400
        assert "no se pudo" in r.json()["error"].lower()
