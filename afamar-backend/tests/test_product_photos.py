import io

from PIL import Image


class TestProductPhotosPublic:
    def test_latest_empty(self, client):
        r = client.get("/api/v1/product-photos/latest")
        assert r.status_code == 200
        assert r.json()["data"] == []

    def test_list_empty(self, client):
        r = client.get("/api/v1/product-photos")
        assert r.status_code == 200
        assert r.json()["data"] == []


class TestProductPhotosAuth:
    def _make_image(self, width=800, height=600, fmt="JPEG") -> bytes:
        buf = io.BytesIO()
        img = Image.new("RGB", (width, height), color="red")
        img.save(buf, fmt)
        return buf.getvalue()

    def test_upload_and_list(self, client):
        data = self._make_image()
        r = client.post("/api/v1/product-photos", files={"file": ("test.jpg", data, "image/jpeg")}, data={"title": "Test Foto"})
        assert r.status_code == 201
        photo = r.json()["data"]
        assert photo["title"] == "Test Foto"
        assert photo["file_path"].startswith("/uploads/product_photos/")
        assert photo["file_path"].endswith(".webp")

        r = client.get("/api/v1/product-photos/latest")
        assert len(r.json()["data"]) == 1

        r = client.get(f"/api/v1/product-photos/{photo['id']}")
        assert r.json()["data"]["title"] == "Test Foto"

    def test_upload_too_large(self, client):
        data = b"x" * (31 * 1024 * 1024)
        r = client.post("/api/v1/product-photos", files={"file": ("big.jpg", data, "image/jpeg")})
        assert r.status_code == 400
        assert "30MB" in r.json()["error"]

    def test_upload_wrong_format(self, client):
        data = b"fake-gif-content"
        r = client.post("/api/v1/product-photos", files={"file": ("test.gif", data, "image/gif")})
        assert r.status_code == 400
        assert "Formato no permitido" in r.json()["error"]

    def test_resize_large_image(self, client):
        data = self._make_image(width=4000, height=3000)
        r = client.post("/api/v1/product-photos", files={"file": ("large.jpg", data, "image/jpeg")})
        assert r.status_code == 201

    def test_update(self, client):
        data = self._make_image()
        r = client.post("/api/v1/product-photos", files={"file": ("test.jpg", data, "image/jpeg")}, data={"title": "Original"})
        pid = r.json()["data"]["id"]

        r = client.put(f"/api/v1/product-photos/{pid}", json={"title": "Editado", "description": "Nueva desc"})
        assert r.status_code == 200
        assert r.json()["data"]["title"] == "Editado"
        assert r.json()["data"]["description"] == "Nueva desc"

    def test_delete(self, client):
        data = self._make_image()
        r = client.post("/api/v1/product-photos", files={"file": ("test.jpg", data, "image/jpeg")})
        pid = r.json()["data"]["id"]

        r = client.delete(f"/api/v1/product-photos/{pid}")
        assert r.status_code == 204

        r = client.get("/api/v1/product-photos/latest")
        assert len(r.json()["data"]) == 0

    def test_404(self, client):
        r = client.get("/api/v1/product-photos/9999")
        assert r.status_code == 404

        r = client.put("/api/v1/product-photos/9999", json={"title": "x"})
        assert r.status_code == 404

        r = client.delete("/api/v1/product-photos/9999")
        assert r.status_code == 404
