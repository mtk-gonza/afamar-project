from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.budget import Budget, BudgetItem, BudgetSketchElement
from app.repositories.budget import BudgetRepository
from app.utils.numbering import generate_budget_number


class BudgetService:
    def __init__(self, db: Session):
        self.repo = BudgetRepository(db)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Budget]:
        return self.repo.get_all(skip, limit)

    def get_by_id(self, budget_id: int) -> Optional[Budget]:
        return self.repo.get_by_id(budget_id)

    def get_by_status(self, status: str) -> List[Budget]:
        return self.repo.get_by_status(status)

    def get_by_client(self, client_id: int) -> List[Budget]:
        return self.repo.get_by_client(client_id)

    def create(self, data: dict) -> Budget:
        items_data = data.pop("items", [])
        sketch_data = data.pop("sketch_elements", [])
        last_number = self.repo.get_last_number()
        data["number"] = generate_budget_number(last_number)
        budget = self.repo.create(data)
        for item_data in items_data:
            item = BudgetItem(budget_id=budget.id, **item_data)
            self.repo.save(item)
        for sk_data in sketch_data:
            el = BudgetSketchElement(budget_id=budget.id, **sk_data)
            self.repo.save(el)
        return self.repo.get_by_id(budget.id)

    def update(self, budget_id: int, data: dict) -> Optional[Budget]:
        budget = self.repo.get_by_id(budget_id)
        if not budget:
            return None
        items_data = data.pop("items", None)
        sketch_data = data.pop("sketch_elements", None)
        budget = self.repo.update(budget, data)
        if items_data is not None:
            for item in budget.items:
                self.repo.delete(item)
            for item_data in items_data:
                item = BudgetItem(budget_id=budget.id, **item_data)
                self.repo.save(item)
        if sketch_data is not None:
            for el in budget.sketch_elements:
                self.repo.delete(el)
            for sk_data in sketch_data:
                el = BudgetSketchElement(budget_id=budget.id, **sk_data)
                self.repo.save(el)
        return self.repo.get_by_id(budget.id)

    def delete(self, budget_id: int) -> bool:
        budget = self.repo.get_by_id(budget_id)
        if not budget:
            return False
        self.repo.delete(budget)
        return True
