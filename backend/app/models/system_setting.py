from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from app.db.database import Base


class SystemSetting(Base):
    """
    Dynamic platform settings, UI customization, feature controls,
    and administrative CMS legal policies (Privacy Policy, Terms, Security Standards).
    """
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(JSON, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
