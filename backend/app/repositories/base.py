from typing import Type

from sqlalchemy.orm import Session

from app.core.database import Base


class BaseRepository:
    model: Type[Base]

    def __init__(self, db: Session):
        self.db = db

    def save(self, instance: Base) -> Base:
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete(self, instance: Base) -> None:
        self.db.delete(instance)
        self.db.commit()
