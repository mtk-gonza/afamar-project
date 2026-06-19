from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.online_budget import OnlineBudget
from app.repositories.online_budget import OnlineBudgetRepository
from app.utils.numbering import generate_budget_number


class OnlineBudgetService:
    def __init__(self, db: Session):
        self.repo = OnlineBudgetRepository(db)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[OnlineBudget]:
        return self.repo.get_all(skip, limit)

    def get_by_id(self, budget_id: int) -> Optional[OnlineBudget]:
        return self.repo.get_by_id(budget_id)

    def create(self, data: dict) -> OnlineBudget:
        last_number = self.repo.get_last_number()
        data["number"] = generate_budget_number(last_number)
        return self.repo.create(data)

    def update(self, budget_id: int, data: dict) -> Optional[OnlineBudget]:
        budget = self.repo.get_by_id(budget_id)
        if not budget:
            return None
        return self.repo.update(budget, data)

    def delete(self, budget_id: int) -> bool:
        budget = self.repo.get_by_id(budget_id)
        if not budget:
            return False
        self.repo.delete(budget)
        return True
