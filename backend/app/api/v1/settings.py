from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.responses import success
from app.models.setting import Setting
from app.schemas.setting import SettingUpdate

router = APIRouter()

DEFAULT_KEYS = {
    "company_name": "AFAMAR",
    "company_address": "",
    "company_phone": "",
    "company_email": "",
    "pdf_footer": "",
    "budget_terms": "",
    "delivery_terms": "",
    "warranty_text": "",
}


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    rows = db.query(Setting).all()
    data = {row.key: row.value for row in rows}
    for k, v in DEFAULT_KEYS.items():
        data.setdefault(k, v)
    return success(data)


@router.put("")
def update_settings(data: SettingUpdate, db: Session = Depends(get_db)):
    for key, value in data.model_dump().items():
        if key in DEFAULT_KEYS:
            db.merge(Setting(key=key, value=value))
    db.commit()
    return get_settings(db)
