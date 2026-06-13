from datetime import datetime

from pydantic import BaseModel


class StockMovementCreate(BaseModel):
    type: str  # entry, exit
    quantity: int
    notes: str | None = None


class StockMovementResponse(BaseModel):
    id: int
    pool_id: int
    type: str
    quantity: int
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PoolStockBase(BaseModel):
    brand: str
    model: str
    description: str | None = None
    material: str | None = None
    quantity: int = 0


class PoolStockCreate(PoolStockBase):
    pass


class PoolStockUpdate(BaseModel):
    brand: str | None = None
    model: str | None = None
    description: str | None = None
    material: str | None = None
    quantity: int | None = None


class PoolStockResponse(PoolStockBase):
    id: int
    created_at: datetime
    updated_at: datetime
    movements: list[StockMovementResponse] = []

    model_config = {"from_attributes": True}
