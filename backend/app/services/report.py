from datetime import date
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.client import Client
from app.models.material import Material
from app.models.pool_stock import PoolStock
from app.models.work_order import WorkOrder


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def budgets_by_status(self, status: str) -> list[dict[str, Any]]:
        results = self.db.query(Budget).filter(Budget.status == status).all()
        return [{"id": b.id, "number": b.number, "client_id": b.client_id, "total": b.total, "created_at": b.created_at} for b in results]

    def budgets_by_date_range(self, start: date, end: date) -> list[dict[str, Any]]:
        results = self.db.query(Budget).filter(Budget.created_at.between(start, end)).all()
        return [{"id": b.id, "number": b.number, "status": b.status, "total": b.total} for b in results]

    def work_orders_by_status(self, status: str) -> list[dict[str, Any]]:
        results = self.db.query(WorkOrder).filter(WorkOrder.status == status).all()
        return [{"id": o.id, "number": o.number, "client_id": o.client_id, "status": o.status} for o in results]

    def monthly_sales(self, year: int) -> list[dict[str, Any]]:
        results = (
            self.db.query(
                func.strftime("%m", Budget.created_at).label("month"),
                func.sum(Budget.total).label("total"),
            )
            .filter(Budget.status == "approved", func.strftime("%Y", Budget.created_at) == str(year))
            .group_by("month")
            .all()
        )
        return [{"month": r.month, "total": float(r.total)} for r in results]

    def most_used_materials(self, limit: int = 10) -> list[dict[str, Any]]:
        results = (
            self.db.query(Material, func.count(Budget.id).label("usage_count"))
            .join(Budget, Budget.material == Material.name)
            .group_by(Material.id)
            .order_by(func.count(Budget.id).desc())
            .limit(limit)
            .all()
        )
        return [{"name": r.Material.name, "usage_count": r.usage_count} for r in results]

    def dashboard_stats(self) -> dict[str, Any]:
        return {
            "pending_budgets": self.db.query(Budget).filter(Budget.status == "pending").count(),
            "budgeted_orders": self.db.query(WorkOrder).filter(WorkOrder.status == "budgeted").count(),
            "in_production_orders": self.db.query(WorkOrder).filter(WorkOrder.status == "in_production").count(),
            "finished_orders": self.db.query(WorkOrder).filter(WorkOrder.status == "finished").count(),
            "pool_stock_total": self.db.query(func.sum(PoolStock.quantity)).scalar() or 0,
            "total_clients": self.db.query(Client).count(),
        }
