from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class DermatologistPrescription(Base):
    __tablename__ = "dermatologist_prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    dermatologist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    dermatologist_name = Column(String, default="Dr. Sarah Carter, MD (Board-Certified Dermatologist)")
    diagnosis = Column(String, nullable=True)
    clinical_notes = Column(Text, nullable=True)
    
    # Prescribed products and customized AM/PM/Weekly regimens
    prescribed_am_routine = Column(JSON, default=list)
    prescribed_pm_routine = Column(JSON, default=list)
    prescribed_treatments = Column(JSON, default=list)
    
    # Overall clinical priority e.g. "Barrier Repair & Sebum Regulation"
    clinical_focus = Column(String, nullable=True)
    review_period_weeks = Column(Integer, default=4)

    created_at = Column(DateTime, default=datetime.utcnow)
    
    dermatologist = relationship("User", foreign_keys=[dermatologist_id])
    patient = relationship("User", foreign_keys=[patient_id])
