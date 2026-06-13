import logging

from app.core.database import SessionLocal
from app.models.material import Material, MaterialCategory, MaterialColor, MaterialThickness
from app.models.options import AppOption
from app.models.setting import Setting

logger = logging.getLogger(__name__)


def seed_default_data():
    db = SessionLocal()
    try:
        if not db.query(MaterialCategory).first():
            for name in ["Granitos", "Cuarzos", "Sinterizados", "Mármoles"]:
                db.add(MaterialCategory(name=name))
            db.commit()
            logger.info("Seeded material categories")

        if not db.query(MaterialColor).first():
            for c in ["Blanco", "Negro", "Gris", "Beige", "Crema", "Rojo", "Verde", "Azul", "Marrón", "Dorado", "Plateado"]:
                db.add(MaterialColor(name=c))
            db.commit()
            logger.info("Seeded material colors")

        if not db.query(MaterialThickness).first():
            for t in ["1cm", "2cm", "3cm", "4cm", "6cm"]:
                db.add(MaterialThickness(name=t))
            db.commit()
            logger.info("Seeded material thicknesses")

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
                db.add(Material(name=name, category_id=cat_id, color=color, available_thickness=thickness, base_price=price))
            db.commit()
            logger.info("Seeded common materials")

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
            db.commit()
            logger.info("Seeded spec options")

        if not db.query(Setting).first():
            for k, v in {
                "company_name": "AFAMAR",
                "company_address": "",
                "company_phone": "",
                "company_email": "",
                "pdf_footer": "",
                "budget_terms": "",
                "delivery_terms": "",
                "warranty_text": "",
            }.items():
                db.add(Setting(key=k, value=v))
            db.commit()
            logger.info("Seeded settings defaults")

    finally:
        db.close()
