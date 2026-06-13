from datetime import datetime

from pydantic import BaseModel


class ClientBase(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientResponse(ClientBase):
    id: int
    total_purchased: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
