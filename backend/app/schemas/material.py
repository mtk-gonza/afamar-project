from datetime import datetime

from pydantic import BaseModel


class MaterialCategoryCreate(BaseModel):
    name: str


class MaterialCategoryResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class MaterialColorCreate(BaseModel):
    name: str
    category_id: int | None = None


class MaterialColorResponse(BaseModel):
    id: int
    name: str
    category_id: int | None = None

    model_config = {"from_attributes": True}


class MaterialThicknessCreate(BaseModel):
    name: str


class MaterialThicknessResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class MaterialBase(BaseModel):
    name: str
    category_id: int
    color: str | None = None
    available_thickness: str | None = None
    base_price: float = 0.0
    notes: str | None = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: str | None = None
    category_id: int | None = None
    color: str | None = None
    available_thickness: str | None = None
    base_price: float | None = None
    notes: str | None = None


class MaterialResponse(MaterialBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
