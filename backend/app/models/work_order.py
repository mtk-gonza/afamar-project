from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id"), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="budgeted")  # budgeted, in_production, finished

    material: Mapped[str] = mapped_column(String(200), nullable=True)
    color: Mapped[str] = mapped_column(String(100), nullable=True)
    thickness: Mapped[str] = mapped_column(String(50), nullable=True)
    bacha: Mapped[str] = mapped_column(String(100), nullable=True)
    anafe: Mapped[str] = mapped_column(String(100), nullable=True)

    deposit_received: Mapped[float] = mapped_column(Float, default=0.0)
    balance_due: Mapped[float] = mapped_column(Float, default=0.0)
    delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal")  # normal, urgent

    digital_signature: Mapped[str] = mapped_column(Text, nullable=True)
    signed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    client = relationship("Client", back_populates="work_orders")
    budget = relationship("Budget", back_populates="work_order")
