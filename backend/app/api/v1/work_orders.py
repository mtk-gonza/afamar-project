from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.exceptions import NotFoundError
from app.core.responses import created, success
from app.schemas.work_order import WorkOrderCreate, WorkOrderUpdate
from app.services.budget import BudgetService
from app.services.work_order import WorkOrderService
from app.utils.pagination import paginate

router = APIRouter()


@router.get("")
def list_work_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = WorkOrderService(db)
    query = service.repo.db.query(service.repo.model)
    page = paginate(db, query, skip, limit)
    return success(page.items, page.pagination)


@router.get("/{order_id}")
def get_work_order(order_id: int, db: Session = Depends(get_db)):
    service = WorkOrderService(db)
    order = service.get_by_id(order_id)
    if not order:
        raise NotFoundError("Work order")
    return success(order)


@router.post("", status_code=201)
def create_work_order(data: WorkOrderCreate, db: Session = Depends(get_db)):
    service = WorkOrderService(db)
    return created(service.create(data.model_dump()))


@router.post("/from-budget/{budget_id}", status_code=201)
def create_from_budget(budget_id: int, db: Session = Depends(get_db)):
    budget_svc = BudgetService(db)
    budget = budget_svc.get_by_id(budget_id)
    if not budget:
        raise NotFoundError("Budget")
    service = WorkOrderService(db)
    return created(service.create_from_budget(budget))


@router.put("/{order_id}")
def update_work_order(order_id: int, data: WorkOrderUpdate, db: Session = Depends(get_db)):
    service = WorkOrderService(db)
    order = service.update(order_id, data.model_dump(exclude_unset=True))
    if not order:
        raise NotFoundError("Work order")
    return success(order)


@router.delete("/{order_id}", status_code=204)
def delete_work_order(order_id: int, db: Session = Depends(get_db)):
    service = WorkOrderService(db)
    if not service.delete(order_id):
        raise NotFoundError("Work order")
