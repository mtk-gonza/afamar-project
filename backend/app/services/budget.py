from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.budget import Budget, BudgetAdicional, BudgetItem, BudgetSketchElement
from app.repositories.budget import BudgetRepository
from app.utils.numbering import generate_budget_number


def _sync_children(budget: Budget, repo: BudgetRepository, attr: str, model_class, data_list: Optional[List[Dict]]):
    if data_list is None:
        return
    existing = {getattr(obj, "id"): obj for obj in getattr(budget, attr)}
    incoming_ids = {d.get("id") for d in data_list if d.get("id")}
    for obj_id, obj in existing.items():
        if obj_id not in incoming_ids:
            repo.delete(obj)
    for d in data_list:
        obj_id = d.get("id")
        if obj_id and obj_id in existing:
            for k, v in d.items():
                if k != "id":
                    setattr(existing[obj_id], k, v)
        else:
            new_obj = model_class(budget_id=budget.id, **{k: v for k, v in d.items() if k != "id"})
            repo.add(new_obj)


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

    def search(self, term: str) -> List[Budget]:
        return self.repo.search(term)

    def list_filtered(self, status: Optional[str] = None, client_id: Optional[int] = None, skip: int = 0, limit: int = 100):
        return self.repo.list_filtered(status, client_id, skip, limit)

    def create(self, data: dict) -> Budget:
        items_data = data.pop("items", [])
        adicionales_data = data.pop("adicionales", [])
        sketch_data = data.pop("sketch_elements", [])
        last_number = self.repo.get_last_number()
        data["number"] = generate_budget_number(last_number)
        budget = self.repo.create(data)
        for item_data in items_data:
            item = BudgetItem(budget_id=budget.id, **item_data)
            self.repo.add(item)
        for ad_data in adicionales_data:
            ad = BudgetAdicional(budget_id=budget.id, **ad_data)
            self.repo.add(ad)
        for sk_data in sketch_data:
            el = BudgetSketchElement(budget_id=budget.id, **sk_data)
            self.repo.add(el)
        self.repo.db.commit()
        return self.repo.get_by_id(budget.id)

    def update(self, budget_id: int, data: dict) -> Optional[Budget]:
        budget = self.repo.get_by_id(budget_id)
        if not budget:
            return None
        items_data = data.pop("items", None)
        adicionales_data = data.pop("adicionales", None)
        sketch_data = data.pop("sketch_elements", None)
        budget = self.repo.update(budget, data)
        _sync_children(budget, self.repo, "items", BudgetItem, items_data)
        _sync_children(budget, self.repo, "adicionales", BudgetAdicional, adicionales_data)
        _sync_children(budget, self.repo, "sketch_elements", BudgetSketchElement, sketch_data)
        self.repo.db.commit()
        return self.repo.get_by_id(budget.id)

    def delete(self, budget_id: int) -> bool:
        budget = self.repo.get_by_id(budget_id)
        if not budget:
            return False
        self.repo.delete(budget)
        self.repo.db.commit()
        return True
