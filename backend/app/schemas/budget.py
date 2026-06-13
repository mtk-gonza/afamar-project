from datetime import date, datetime

from pydantic import BaseModel


class BudgetItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    total: float = 0.0


class BudgetItemCreate(BudgetItemBase):
    pass


class BudgetItemResponse(BudgetItemBase):
    id: int
    budget_id: int

    model_config = {"from_attributes": True}


class BudgetSketchElementBase(BaseModel):
    type: str
    data: str | None = None
    order: int = 0


class BudgetSketchElementCreate(BudgetSketchElementBase):
    pass


class BudgetSketchElementResponse(BudgetSketchElementBase):
    id: int
    budget_id: int

    model_config = {"from_attributes": True}


class BudgetBase(BaseModel):
    client_id: int
    material: str | None = None
    color: str | None = None
    thickness: str | None = None
    front: str | None = None
    finish: str | None = None
    bacha: str | None = None
    anafe: str | None = None
    perforations: str | None = None
    subtotal: float = 0.0
    usd_reference: float = 0.0
    shipping: float = 0.0
    total: float = 0.0
    payment_method: str | None = None
    validity_days: int = 15
    estimated_delivery: str | None = None
    estimated_date: date | None = None
    notes: str | None = None


class BudgetCreate(BudgetBase):
    items: list[BudgetItemCreate] = []
    sketch_elements: list[BudgetSketchElementCreate] = []


class BudgetUpdate(BaseModel):
    status: str | None = None
    material: str | None = None
    color: str | None = None
    thickness: str | None = None
    front: str | None = None
    finish: str | None = None
    bacha: str | None = None
    anafe: str | None = None
    perforations: str | None = None
    subtotal: float | None = None
    usd_reference: float | None = None
    shipping: float | None = None
    total: float | None = None
    payment_method: str | None = None
    validity_days: int | None = None
    estimated_delivery: str | None = None
    estimated_date: date | None = None
    notes: str | None = None
    items: list[BudgetItemCreate] | None = None
    sketch_elements: list[BudgetSketchElementCreate] | None = None


class BudgetResponse(BudgetBase):
    id: int
    number: str
    status: str
    created_at: datetime
    updated_at: datetime
    items: list[BudgetItemResponse] = []
    sketch_elements: list[BudgetSketchElementResponse] = []

    model_config = {"from_attributes": True}
