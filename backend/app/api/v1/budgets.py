from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.exceptions import NotFoundError
from app.core.responses import PaginationInfo, created, success
from app.models.setting import Setting
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from app.services.budget import BudgetService
from app.services.email import send_budget_email
from app.services.pdf import generate_budget_pdf

router = APIRouter()


@router.get("")
def list_budgets(
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    client_id: int | None = None,
    db: Session = Depends(get_db),
):
    service = BudgetService(db)
    items = service.list_filtered(status, client_id, skip, limit)
    total = service.repo.list_filtered_count(status, client_id)
    return success(items, PaginationInfo(total=total, skip=skip, limit=limit))


@router.get("/search")
def search_budgets(q: str = Query(min_length=1), db: Session = Depends(get_db)):
    service = BudgetService(db)
    return success(service.search(q))


@router.get("/{budget_id}")
def get_budget(budget_id: int, db: Session = Depends(get_db)):
    service = BudgetService(db)
    budget = service.get_by_id(budget_id)
    if not budget:
        raise NotFoundError("Budget")
    return success(budget)


@router.post("", status_code=201)
def create_budget(data: BudgetCreate, db: Session = Depends(get_db)):
    service = BudgetService(db)
    return created(service.create(data.model_dump()))


@router.put("/{budget_id}")
def update_budget(budget_id: int, data: BudgetUpdate, db: Session = Depends(get_db)):
    service = BudgetService(db)
    budget = service.update(budget_id, data.model_dump(exclude_unset=True))
    if not budget:
        raise NotFoundError("Budget")
    return success(budget)


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    service = BudgetService(db)
    if not service.delete(budget_id):
        raise NotFoundError("Budget")


def _load_settings(db: Session) -> dict:
    rows = db.query(Setting).all()
    return {row.key: row.value for row in rows}


_COMPANY_KEYS = ["company_name", "company_address", "company_phone", "company_email", "pdf_footer"]
_TERMS_KEYS = ["budget_terms", "delivery_terms", "warranty_text"]


def _build_company_and_terms(settings_data: dict) -> tuple[dict, dict]:
    company = {k: settings_data.get(k, "") for k in _COMPANY_KEYS}
    terms = {k: settings_data.get(k, "") for k in _TERMS_KEYS}
    return company, terms


def _prepare_budget_payload(budget, db: Session) -> tuple[dict, dict, dict, dict]:
    budget_data = BudgetResponse.model_validate(budget).model_dump(mode="json")
    client = budget.client
    client_dict = {
        "name": client.name,
        "phone": client.phone,
        "email": client.email,
        "address": client.address,
    }
    settings_data = _load_settings(db)
    company, terms = _build_company_and_terms(settings_data)
    return budget_data, client_dict, company, terms


@router.get("/{budget_id}/pdf")
def download_budget_pdf(budget_id: int, db: Session = Depends(get_db)):
    service = BudgetService(db)
    budget = service.get_by_id(budget_id)
    if not budget:
        raise NotFoundError("Budget")

    budget_data, client_dict, company, terms = _prepare_budget_payload(budget, db)
    pdf_bytes = generate_budget_pdf(budget_data, client_dict, company=company, terms=terms)

    return Response(
        pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="presupuesto_{budget.number}.pdf"'},
    )


@router.post("/{budget_id}/send-email")
def email_budget(budget_id: int, db: Session = Depends(get_db)):
    service = BudgetService(db)
    budget = service.get_by_id(budget_id)
    if not budget:
        raise NotFoundError("Budget")

    client = budget.client
    if not client.email:
        raise HTTPException(status_code=400, detail="El cliente no tiene email registrado")

    budget_data, client_dict, company, terms = _prepare_budget_payload(budget, db)
    pdf_bytes = generate_budget_pdf(budget_data, client_dict, company=company, terms=terms)
    company_name = company.get("company_name") or "AFAMAR"

    try:
        send_budget_email(client.email, pdf_bytes, budget.number, company_name=company_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar email: {str(e)}")

    return success({"message": "Email enviado correctamente"})
