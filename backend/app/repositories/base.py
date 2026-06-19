from typing import Any, Type

from sqlalchemy.orm import Session

from app.core.database import Base


class BaseRepository:
    model: Type[Base]

    def __init__(self, db: Session):
        self.db = db

    def add(self, instance: Base, commit: bool = False) -> Base:
        self.db.add(instance)
        if commit:
            self.db.commit()
        self.db.flush()
        self.db.refresh(instance)
        return instance

    def save(self, instance: Base) -> Base:
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete(self, instance: Base) -> None:
        self.db.delete(instance)

    def get_all(self, skip: int = 0, limit: int = 100):
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def get_by_id(self, id: int):
        return self.db.query(self.model).filter(self.model.id == id).first()  # type: ignore

    def create(self, data: dict, commit: bool = False):
        return self.add(self.model(**data), commit=commit)

    def update(self, obj: Base, data: dict[str, Any]) -> Base:
        for key, value in data.items():
            setattr(obj, key, value)
        return self.save(obj)
