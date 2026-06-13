from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.client import Client
from app.repositories.client import ClientRepository


class ClientService:
    def __init__(self, db: Session):
        self.repo = ClientRepository(db)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Client]:
        return self.repo.get_all(skip, limit)

    def get_by_id(self, client_id: int) -> Optional[Client]:
        return self.repo.get_by_id(client_id)

    def search(self, term: str) -> List[Client]:
        return self.repo.search(term)

    def create(self, data: dict) -> Client:
        return self.repo.create(data)

    def update(self, client_id: int, data: dict) -> Optional[Client]:
        client = self.repo.get_by_id(client_id)
        if not client:
            return None
        return self.repo.update(client, data)

    def delete(self, client_id: int) -> bool:
        client = self.repo.get_by_id(client_id)
        if not client:
            return False
        self.repo.delete(client)
        return True
