from datetime import date, datetime

from sqlalchemy import Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class Insurance(Base):
    __tablename__ = "insurance"
    __table_args__ = (Index("ix_insurance_policy_number", "policy_number", unique=True),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    provider: Mapped[str] = mapped_column(String(255), nullable=False)
    policy_number: Mapped[str] = mapped_column(String(255), nullable=False)
    valid_through: Mapped[date | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    patients: Mapped[list["Patient"]] = relationship(back_populates="insurance")
