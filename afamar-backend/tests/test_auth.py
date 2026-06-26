class TestAuth:
    def test_register_and_login(self, public_client):
        r = public_client.post("/api/v1/auth/register", json={
            "username": "testuser",
            "email": "test@test.com",
            "password": "test123",
            "full_name": "Test User",
        })
        assert r.status_code == 200
        assert r.json()["data"]["username"] == "testuser"

        r = public_client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "test123",
        })
        assert r.status_code == 200
        body = r.json()["data"]
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password(self, public_client):
        public_client.post("/api/v1/auth/register", json={
            "username": "user2", "email": "u2@t.com", "password": "pass",
        })
        r = public_client.post("/api/v1/auth/login", json={
            "username": "user2", "password": "wrong",
        })
        assert r.status_code == 401

    def test_login_nonexistent_user(self, public_client):
        r = public_client.post("/api/v1/auth/login", json={
            "username": "nobody", "password": "x",
        })
        assert r.status_code == 401

    def test_me_with_valid_token(self, public_client):
        public_client.post("/api/v1/auth/register", json={
            "username": "meuser", "email": "me@t.com", "password": "pass",
        })
        r = public_client.post("/api/v1/auth/login", json={
            "username": "meuser", "password": "pass",
        })
        token = r.json()["data"]["access_token"]

        r = public_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["data"]["username"] == "meuser"

    def test_me_without_token(self, public_client):
        r = public_client.get("/api/v1/auth/me")
        assert r.status_code == 401

    def test_me_with_invalid_token(self, public_client):
        r = public_client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalidtoken"})
        assert r.status_code == 401

    def test_protected_endpoint_without_token(self, public_client):
        r = public_client.get("/api/v1/budgets")
        assert r.status_code == 401

    def test_protected_endpoint_with_invalid_token(self, public_client):
        r = public_client.get("/api/v1/budgets", headers={"Authorization": "Bearer badtoken"})
        assert r.status_code == 401

    def test_public_endpoint_no_auth_needed(self, public_client):
        """references GET is public — no token required"""
        r = public_client.get("/api/v1/references/budget-statuses")
        assert r.status_code == 200

    def test_register_duplicate_username(self, public_client):
        public_client.post("/api/v1/auth/register", json={
            "username": "dup", "email": "d1@t.com", "password": "pass",
        })
        r = public_client.post("/api/v1/auth/register", json={
            "username": "dup", "email": "d2@t.com", "password": "pass",
        })
        assert r.status_code == 409
