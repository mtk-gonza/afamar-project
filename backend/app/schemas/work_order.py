from datetime import date, datetime

from pydantic import BaseModel


class WorkOrderBase(BaseModel):
    client_id: int
    budget_id: int | None = None
    material: str | None = None
    color: str | None = None
    thickness: str | None = None
    bacha: str | None = None
    anafe: str | None = None
    deposit_received: float = 0.0
    balance_due: float = 0.0
    delivery_date: date | None = None
    priority: str = "normal"
    notes: str | None = None


class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrderUpdate(BaseModel):
    status: str | None = None
    material: str | None = None
    color: str | None = None
    thickness: str | None = None
    bacha: str | None = None
    anafe: str | None = None
    deposit_received: float | None = None
    balance_due: float | None = None
    delivery_date: date | None = None
    priority: str | None = None
    digital_signature: str | None = None
    notes: str | None = None


class WorkOrderResponse(WorkOrderBase):
    id: int
    number: str
    status: str
    digital_signature: str | None = None
    signed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
