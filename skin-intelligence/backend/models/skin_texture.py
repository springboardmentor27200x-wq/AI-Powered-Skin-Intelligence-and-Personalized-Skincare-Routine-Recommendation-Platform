from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class SkinTextureAnalysis(Base):
    __tablename__ = "skin_texture_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    smoothness_score = Column(Float, nullable=False, default=70.0)
    roughness_score = Column(Float, nullable=False, default=30.0)
    pore_visibility_score = Column(Float, nullable=False, default=25.0)
    pore_density_score = Column(Float, nullable=False, default=20.0)
    oiliness_shine_score = Column(Float, nullable=False, default=35.0)
    redness_erythema_score = Column(Float, nullable=False, default=15.0)
    fine_lines_score = Column(Float, nullable=False, default=10.0)
    overall_texture_score = Column(Float, nullable=False, default=78.0)

    texture_type = Column(String, nullable=False)
    primary_concern = Column(String, nullable=True)
    analysis_summary = Column(Text, nullable=True)
    diagnostics_json = Column(Text, nullable=True)
    
    image_filename = Column(String, nullable=True)
    heatmap_overlay_base64 = Column(Text, nullable=True)
    pore_overlay_base64 = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="texture_analyses")
