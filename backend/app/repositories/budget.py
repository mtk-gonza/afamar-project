from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.repositories.base import BaseRepository


class BudgetRepository(BaseRepository):
    model = Budget

    def __init__(self, db: Session):
        super().__init__(db)

    def get_by_id(self, budget_id: int) -> Optional[Budget]:
        return self.db.query(Budget).filter(Budget.id == budget_id).first()

    def get_by_number(self, number: str) -> Optional[Budget]:
        return self.db.query(Budget).filter(Budget.number == number).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Budget]:
        return self.db.query(Budget).order_by(Budget.id.desc()).offset(skip).limit(limit).all()

    def get_by_status(self, status: str) -> List[Budget]:
        return self.db.query(Budget).filter(Budget.status == status).order_by(Budget.id.desc()).all()

    def get_by_client(self, client_id: int) -> List[Budget]:
        return self.db.query(Budget).filter(Budget.client_id == client_id).order_by(Budget.id.desc()).all()

    def get_last_number(self) -> Optional[str]:
        budget = self.db.query(Budget).order_by(Budget.id.desc()).first()
        return budget.number if budget else None

    def create(self, data: dict) -> Budget:
        budget = Budget(**data)
        return self.save(budget)

    def update(self, budget: Budget, data: dict) -> Budget:
        for key, value in data.items():
            if value is not None:
                setattr(budget, key, value)
        return self.save(budget)
