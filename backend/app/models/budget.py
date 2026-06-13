from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, approved, rejected

    material: Mapped[str] = mapped_column(String(200), nullable=True)
    color: Mapped[str] = mapped_column(String(100), nullable=True)
    thickness: Mapped[str] = mapped_column(String(50), nullable=True)
    front: Mapped[str] = mapped_column(String(100), nullable=True)
    finish: Mapped[str] = mapped_column(String(100), nullable=True)
    bacha: Mapped[str] = mapped_column(String(100), nullable=True)
    anafe: Mapped[str] = mapped_column(String(100), nullable=True)
    perforations: Mapped[str] = mapped_column(String(200), nullable=True)

    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    usd_reference: Mapped[float] = mapped_column(Float, default=0.0)
    shipping: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float, default=0.0)

    payment_method: Mapped[str] = mapped_column(String(50), nullable=True)
    validity_days: Mapped[int] = mapped_column(Integer, default=15)
    estimated_delivery: Mapped[str] = mapped_column(String(100), nullable=True)
    estimated_date: Mapped[date] = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    client = relationship("Client", back_populates="budgets")
    items = relationship("BudgetItem", back_populates="budget", cascade="all, delete-orphan")
    sketch_elements = relationship("BudgetSketchElement", back_populates="budget", cascade="all, delete-orphan")
    work_order = relationship("WorkOrder", back_populates="budget", uselist=False)


class BudgetItem(Base):
    __tablename__ = "budget_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id"), nullable=False)
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float, default=0.0)

    budget = relationship("Budget", back_populates="items")


class BudgetSketchElement(Base):
    __tablename__ = "budget_sketch_elements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # rectangle, circle, text, measure, bacha, anafe, perforation
    data: Mapped[str] = mapped_column(Text, nullable=True)  # JSON with coordinates, dimensions, etc.
    order: Mapped[int] = mapped_column(Integer, default=0)

    budget = relationship("Budget", back_populates="sketch_elements")
