from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.exceptions import NotFoundError
from app.core.responses import created, success
from app.schemas.online_budget import OnlineBudgetCreate, OnlineBudgetUpdate
from app.services.online_budget import OnlineBudgetService
from app.utils.pagination import paginate

router = APIRouter()


@router.get("")
def list_online_budgets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = OnlineBudgetService(db)
    query = service.repo.db.query(service.repo.model).order_by(service.repo.model.created_at.desc())
    page = paginate(db, query, skip, limit)
    return success(page.items, page.pagination)


@router.get("/{budget_id}")
def get_online_budget(budget_id: int, db: Session = Depends(get_db)):
    service = OnlineBudgetService(db)
    budget = service.get_by_id(budget_id)
    if not budget:
        raise NotFoundError("Online budget")
    return success(budget)


@router.post("", status_code=201)
def create_online_budget(data: OnlineBudgetCreate, db: Session = Depends(get_db)):
    service = OnlineBudgetService(db)
    return created(service.create(data.model_dump()))


@router.put("/{budget_id}")
def update_online_budget(budget_id: int, data: OnlineBudgetUpdate, db: Session = Depends(get_db)):
    service = OnlineBudgetService(db)
    budget = service.update(budget_id, data.model_dump(exclude_unset=True))
    if not budget:
        raise NotFoundError("Online budget")
    return success(budget)


@router.delete("/{budget_id}", status_code=204)
def delete_online_budget(budget_id: int, db: Session = Depends(get_db)):
    service = OnlineBudgetService(db)
    if not service.delete(budget_id):
        raise NotFoundError("Online budget")
