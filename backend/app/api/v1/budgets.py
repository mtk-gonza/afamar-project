from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.exceptions import NotFoundError
from app.core.responses import created, success
from app.models.setting import Setting
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.services.budget import BudgetService
from app.services.email import send_budget_email
from app.services.pdf import generate_budget_pdf
from app.utils.pagination import paginate

router = APIRouter()


@router.get("")
def list_budgets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = BudgetService(db)
    query = service.repo.db.query(service.repo.model)
    page = paginate(db, query, skip, limit)
    return success(page.items, page.pagination)


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


def _budget_to_dict(budget) -> dict:
    return {
        "id": budget.id,
        "number": budget.number,
        "client_id": budget.client_id,
        "status": budget.status,
        "material": budget.material,
        "color": budget.color,
        "thickness": budget.thickness,
        "front": budget.front,
        "finish": budget.finish,
        "bacha": budget.bacha,
        "anafe": budget.anafe,
        "perforations": budget.perforations,
        "subtotal": budget.subtotal,
        "usd_reference": budget.usd_reference,
        "shipping": budget.shipping,
        "total": budget.total,
        "payment_method": budget.payment_method,
        "validity_days": budget.validity_days,
        "estimated_delivery": budget.estimated_delivery,
        "estimated_date": str(budget.estimated_date) if budget.estimated_date else None,
        "notes": budget.notes,
        "created_at": str(budget.created_at),
        "items": [
            {
                "id": item.id,
                "description": item.description,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total": item.total,
            }
            for item in (budget.items or [])
        ],
    }


@router.get("/{budget_id}/pdf")
def download_budget_pdf(budget_id: int, db: Session = Depends(get_db)):
    service = BudgetService(db)
    budget = service.get_by_id(budget_id)
    if not budget:
        raise NotFoundError("Budget")

    budget_dict = _budget_to_dict(budget)
    client = budget.client
    client_dict = {
        "name": client.name,
        "phone": client.phone,
        "email": client.email,
        "address": client.address,
    }
    settings_data = _load_settings(db)

    company_keys = ["company_name", "company_address", "company_phone", "company_email", "pdf_footer"]
    company = {k: settings_data.get(k, "") for k in company_keys}

    terms_keys = ["budget_terms", "delivery_terms", "warranty_text"]
    terms = {k: settings_data.get(k, "") for k in terms_keys}

    pdf_bytes = generate_budget_pdf(budget_dict, client_dict, company=company, terms=terms)

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

    budget_dict = _budget_to_dict(budget)
    client_dict = {
        "name": client.name,
        "phone": client.phone,
        "email": client.email,
        "address": client.address,
    }
    settings_data = _load_settings(db)

    company_keys = ["company_name", "company_address", "company_phone", "company_email", "pdf_footer"]
    company = {k: settings_data.get(k, "") for k in company_keys}

    terms_keys = ["budget_terms", "delivery_terms", "warranty_text"]
    terms = {k: settings_data.get(k, "") for k in terms_keys}

    pdf_bytes = generate_budget_pdf(budget_dict, client_dict, company=company, terms=terms)
    company_name = company.get("company_name") or "AFAMAR"

    try:
        send_budget_email(client.email, pdf_bytes, budget.number, company_name=company_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar email: {str(e)}")

    return success({"message": "Email enviado correctamente"})
