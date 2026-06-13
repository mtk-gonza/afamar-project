from typing import List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.client import Client
from app.repositories.base import BaseRepository


class ClientRepository(BaseRepository):
    model = Client

    def __init__(self, db: Session):
        super().__init__(db)

    def get_by_id(self, client_id: int) -> Optional[Client]:
        return self.db.query(Client).filter(Client.id == client_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Client]:
        return self.db.query(Client).offset(skip).limit(limit).all()

    def search(self, term: str) -> List[Client]:
        pattern = f"%{term}%"
        return (
            self.db.query(Client)
            .filter(
                or_(
                    Client.name.ilike(pattern),
                    Client.phone.ilike(pattern),
                    Client.address.ilike(pattern),
                )
            )
            .all()
        )

    def create(self, data: dict) -> Client:
        client = Client(**data)
        return self.save(client)

    def update(self, client: Client, data: dict) -> Client:
        for key, value in data.items():
            if value is not None:
                setattr(client, key, value)
        return self.save(client)

    def delete(self, client: Client) -> None:
        super().delete(client)
