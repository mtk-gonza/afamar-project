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

    def search(self, term: str) -> List[WorkOrder]:
        return self.repo.search(term)

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
            "status": "budgeted",
            "origin": "Manual",
            "material": budget.material,
            "material_price_m2": budget.material_price_m2,
            "materials_data": budget.materials_data,
            "color": budget.color,
            "thickness": budget.thickness,
            "finish": budget.finish,
            "bacha": budget.bacha,
            "anafe": budget.anafe,
            "currency": budget.currency,
            "usd_rate": budget.usd_rate,
            "subtotal": budget.subtotal,
            "transport": budget.transport,
            "installation": budget.installation,
            "discount": budget.discount,
            "total": budget.total,
            "deposit_received": budget.deposit_received,
            "deposit_currency": budget.deposit_currency,
            "balance_due": budget.balance_due,
            "payment_method": budget.payment_method,
            "installments": budget.installments,
            "priority": budget.priority,
            "delivery_date": budget.delivery_date,
            "notes": budget.notes,
            "fabrication_details": budget.fabrication_details,
            "pool_id": budget.pool_id,
            "pool_price": budget.pool_price,
            "pool_currency": budget.pool_currency,
            "pool_image": budget.pool_image,
            "pools_data": budget.pools_data,
            "design_observations": budget.design_observations,
            "important_observations": budget.important_observations,
            "snapshot_name": budget.snapshot_name,
            "snapshot_phone": budget.snapshot_phone,
            "snapshot_email": budget.snapshot_email,
            "snapshot_address": budget.snapshot_address,
            "date": budget.date,
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
