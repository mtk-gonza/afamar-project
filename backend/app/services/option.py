from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.options import AppOption


class AppOptionService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[AppOption]:
        return self.db.query(AppOption).order_by(AppOption.category, AppOption.sort_order).all()

    def get_by_category(self, category: str) -> List[AppOption]:
        return self.db.query(AppOption).filter(AppOption.category == category).order_by(AppOption.sort_order).all()

    def get_by_id(self, option_id: int) -> Optional[AppOption]:
        return self.db.query(AppOption).filter(AppOption.id == option_id).first()

    def create(self, data: dict) -> AppOption:
        opt = AppOption(**data)
        self.db.add(opt)
        self.db.commit()
        self.db.refresh(opt)
        return opt

    def delete(self, option_id: int) -> bool:
        opt = self.get_by_id(option_id)
        if not opt:
            return False
        self.db.delete(opt)
        self.db.commit()
        return True
