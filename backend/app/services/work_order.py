from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.work_order import WorkOrder
from app.repositories.work_order import WorkOrderRepository
from app.utils.numbering import generate_work_order_number


class WorkOrderService:
    def __init__(self, db: Session):
        self.repo = WorkOrderRepository(db)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[WorkOrder]:
        return self.repo.get_all(skip, limit)

    def get_by_id(self, order_id: int) -> Optional[WorkOrder]:
        return self.repo.get_by_id(order_id)

    def get_by_status(self, status: str) -> List[WorkOrder]:
        return self.repo.get_by_status(status)

    def get_by_client(self, client_id: int) -> List[WorkOrder]:
        return self.repo.get_by_client(client_id)

    def create(self, data: dict) -> WorkOrder:
        last_number = self.repo.get_last_number()
        data["number"] = generate_work_order_number(last_number)
        return self.repo.create(data)

    def create_from_budget(self, budget) -> WorkOrder:
        last_number = self.repo.get_last_number()
        data = {
            "number": generate_work_order_number(last_number),
            "client_id": budget.client_id,
            "budget_id": budget.id,
            "material": budget.material,
            "color": budget.color,
            "thickness": budget.thickness,
            "bacha": budget.bacha,
            "anafe": budget.anafe,
            "status": "budgeted",
        }
        return self.repo.create(data)

    def update(self, order_id: int, data: dict) -> Optional[WorkOrder]:
        order = self.repo.get_by_id(order_id)
        if not order:
            return None
        return self.repo.update(order, data)

    def delete(self, order_id: int) -> bool:
        order = self.repo.get_by_id(order_id)
        if not order:
            return False
        self.repo.delete(order)
        return True
