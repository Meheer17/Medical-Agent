from datetime import datetime
from enum import Enum

from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class UrgencyLevel(str, Enum):
    URGENT = "urgent"
    PRIORITY = "priority"
    ROUTINE = "routine"


class TriageLog(Base):
    __tablename__ = "triage_logs"
    __table_args__ = (Index("ix_triage_logs_patient_id", "patient_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    symptoms: Mapped[str] = mapped_column(Text, nullable=False)
    urgency_level: Mapped[UrgencyLevel] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

    patient: Mapped["Patient"] = relationship(back_populates="triage_logs")
