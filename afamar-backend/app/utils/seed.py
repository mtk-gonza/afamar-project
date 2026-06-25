import logging
import shutil
from pathlib import Path
from uuid import uuid4

from app.core.database import SessionLocal
from app.models.material import Material, MaterialCategory, MaterialColor, MaterialThickness
from app.models.options import AppOption
from app.models.price_history import PriceHistory
from app.models.product_photo import ProductPhoto
from app.models.setting import Setting
from app.models.user import User
from app.services.auth import hash_password

logger = logging.getLogger(__name__)


def seed_default_data():
    db = SessionLocal()
    try:
        if not db.query(MaterialCategory).first():
            for name in ["Granitos", "Cuarzos", "Sinterizados", "Mármoles"]:
                db.add(MaterialCategory(name=name))

        if not db.query(MaterialColor).first():
            for c in ["Blanco", "Negro", "Gris", "Beige", "Crema", "Rojo", "Verde", "Azul", "Marrón", "Dorado", "Plateado"]:
                db.add(MaterialColor(name=c))

        if not db.query(MaterialThickness).first():
            for t in ["1cm", "2cm", "3cm", "4cm", "6cm"]:
                db.add(MaterialThickness(name=t))

        if not db.query(Material).first():
            common_materials = [
                ("Granito Negro Absoluto", 1, "Negro", "2cm", 45.0),
                ("Granito Blanco Dallas", 1, "Blanco", "2cm", 50.0),
                ("Granito Gris Pulido", 1, "Gris", "2cm", 40.0),
                ("Cuarzo Blanco Polar", 2, "Blanco", "2cm", 70.0),
                ("Cuarzo Gris Oxford", 2, "Gris", "2cm", 75.0),
                ("Cuarzo Beige", 2, "Beige", "2cm", 65.0),
                ("Sinterizado Dekton", 3, "Gris", "2cm", 100.0),
                ("Sinterizado Neolith", 3, "Blanco", "2cm", 110.0),
                ("Mármol Travertino", 4, "Beige", "3cm", 60.0),
                ("Mármol Crema Marfil", 4, "Crema", "3cm", 55.0),
            ]
            for name, cat_id, color, thickness, price in common_materials:
                m = Material(name=name, category_id=cat_id, color=color, available_thickness=thickness, base_price=price)
                db.add(m)
                db.flush()
                db.add(PriceHistory(material_id=m.id, material_name=name, price_m2=price))

        if not db.query(AppOption).first():
            spec_options = {
                "finish_type": ["Pulido", "Mate", "Apomazado", "Cepillado", "Arenado", "Encerado"],
                "front_type": ["Recto", "Boleado", "Media caña", "Chamfer", "Escociado"],
                "bacha_type": ["Sobreponer", "Empotrar", "Integrada", "Bajo mesada", "Sin bacha"],
                "anafe_type": ["Empotrar", "Sobreponer", "Sin anafe"],
            }
            for cat, values in spec_options.items():
                for i, val in enumerate(values):
                    db.add(AppOption(category=cat, value=val, sort_order=i))

        if not db.query(User).first():
            db.add(User(
                username="admin",
                email="admin@afamar.com.ar",
                hashed_password=hash_password("admin123"),
                full_name="Administrador",
                is_admin=True,
                is_active=True,
            ))

        if not db.query(Setting).first():
            for k, v in {
                "company_name": "AFAMAR",
                "company_address": "",
                "company_phone": "",
                "company_email": "",
                "company_logo": "",
                "pdf_footer": "",
                "budget_terms": "",
                "delivery_terms": "",
                "warranty_text": "",
                "observaciones_automaticas": "",
            }.items():
                db.add(Setting(key=k, value=v))

        _seed_product_photos(db)

        db.commit()
        logger.info("Seed data completed successfully")
    except Exception:
        db.rollback()
        logger.exception("Seed data failed — all changes rolled back")
    finally:
        db.close()


def _seed_product_photos(db):
    if db.query(ProductPhoto).first():
        return
    frontend_portfolio = (
        Path(__file__).resolve().parent.parent.parent.parent
        / "afamar-frontend"
        / "src"
        / "assets"
        / "portfolio"
    )
    upload_dir = (
        Path(__file__).resolve().parent.parent.parent
        / "uploads"
        / "product_photos"
    )
    if not frontend_portfolio.exists():
        logger.warning("Frontend portfolio dir not found: %s — skipping product photo seed", frontend_portfolio)
        return

    upload_dir.mkdir(parents=True, exist_ok=True)

    titles = [
        "Mesada de cocina",
        "Mesada de baño",
        "Cubierta de granito",
        "Revestimiento de pared",
        "Mesada con bacha integrada",
        "Detalle de terminación",
        "Cocina completa",
        "Baño completo",
        "Mesada de cuarzo",
        "Detalle de junta",
        "Revestimiento exterior",
        "Trabajo especial",
    ]

    for i, src_path in enumerate(sorted(frontend_portfolio.glob("*.jpg")), start=0):
        idx = i % len(titles)
        ext = src_path.suffix
        stored_name = f"{uuid4().hex}{ext}"
        dest_path = upload_dir / stored_name
        shutil.copy2(str(src_path), str(dest_path))
        photo = ProductPhoto(
            file_path=f"/uploads/product_photos/{stored_name}",
            title=titles[idx],
            description="",
        )
        db.add(photo)
