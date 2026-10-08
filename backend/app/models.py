from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    ForeignKey,
    Text,
    Boolean,
    UniqueConstraint
)

from sqlalchemy.orm import relationship

from .database import Base


# =========================================================
# USER
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False,
        default="user"
    )

    # -----------------------------------------------------
    # SKIN PROFILE
    # -----------------------------------------------------

    skin_profile = relationship(
        "SkinProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------
    # LIFESTYLE
    # -----------------------------------------------------

    lifestyle_records = relationship(
        "Lifestyle",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------
    # SLEEP
    # -----------------------------------------------------

    sleep_records = relationship(
        "Sleep",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------
    # CONSULTATIONS
    # -----------------------------------------------------

    consultation_records = relationship(
        "Consultation",
        back_populates="consultant",
        foreign_keys="Consultation.consultant_id",
        cascade="all, delete-orphan"
    )

    received_consultations = relationship(
        "Consultation",
        back_populates="client",
        foreign_keys="Consultation.client_id",
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------
    # SKIN ASSESSMENTS
    # -----------------------------------------------------

    skin_assessments = relationship(
        "SkinAssessment",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------
    # SKINCARE ROUTINES
    # -----------------------------------------------------

    skincare_routines = relationship(
        "SkincareRoutine",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------
    # ROUTINE ADHERENCE
    # -----------------------------------------------------

    routine_adherence = relationship(
        "RoutineAdherence",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------
    # REMINDERS
    # -----------------------------------------------------

    reminders = relationship(
        "Reminder",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------
    # NOTIFICATIONS
    # -----------------------------------------------------

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# =========================================================
# SKIN PROFILE
# =========================================================

class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    skin_type = Column(String)

    concerns = Column(String)

    sensitivity = Column(String)

    allergies = Column(String)

    budget_inr = Column(
        Float,
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="skin_profile"
    )


# =========================================================
# LIFESTYLE
# =========================================================

class Lifestyle(Base):
    __tablename__ = "lifestyle"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    water_intake = Column(Float)

    exercise_minutes = Column(Integer)

    stress_level = Column(Integer)

    user = relationship(
        "User",
        back_populates="lifestyle_records"
    )


# =========================================================
# SLEEP
# =========================================================

class Sleep(Base):
    __tablename__ = "sleep"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    sleep_hours = Column(Float)

    sleep_quality = Column(Integer)

    date = Column(Date)

    user = relationship(
        "User",
        back_populates="sleep_records"
    )


# =========================================================
# CONSULTATION
# =========================================================

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    consultant_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    client_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    notes = Column(
        Text,
        nullable=False
    )

    recommendations = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        String,
        nullable=False
    )

    consultant = relationship(
        "User",
        back_populates="consultation_records",
        foreign_keys=[consultant_id]
    )

    client = relationship(
        "User",
        back_populates="received_consultations",
        foreign_keys=[client_id]
    )


# =========================================================
# SKIN ASSESSMENT
# =========================================================

class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # =====================================================
    # INDIVIDUAL SCORING COMPONENTS
    # =====================================================

    # Skin Condition Assessment - 35%
    skin_condition_score = Column(
        Float,
        nullable=False
    )

    # Lifestyle Habits - 20%
    lifestyle_score = Column(
        Float,
        nullable=False
    )

    # Sleep Quality - 15%
    sleep_score = Column(
        Float,
        nullable=False
    )

    # Routine Consistency - 20%
    routine_consistency_score = Column(
        Float,
        nullable=False
    )

    # Hydration Level - 10%
    hydration_score = Column(
        Float,
        nullable=False
    )

    # =====================================================
    # OVERALL SKIN HEALTH SCORE
    # =====================================================

    skin_score = Column(
        Float,
        nullable=False
    )

    health_status = Column(
        String,
        nullable=False
    )

    # =====================================================
    # SKIN CONCERN ANALYSIS
    # =====================================================

    concerns = Column(
        Text,
        nullable=False
    )

    primary_concern = Column(String)

    secondary_concerns = Column(Text)

    # =====================================================
    # RISK ANALYSIS
    # =====================================================

    risk_factors = Column(Text)

    assessment_summary = Column(Text)

    # =====================================================
    # CREATION DATE
    # =====================================================

    created_at = Column(
        String,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="skin_assessments"
    )


# =========================================================
# PERSONALIZED SKINCARE ROUTINE
# =========================================================

class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # =====================================================
    # ROUTINE METADATA
    # =====================================================

    skin_type = Column(String)

    primary_concern = Column(String)

    season = Column(String)

    # =====================================================
    # MORNING ROUTINE
    # =====================================================

    morning_routine = Column(
        Text,
        nullable=False
    )

    # =====================================================
    # EVENING ROUTINE
    # =====================================================

    evening_routine = Column(
        Text,
        nullable=False
    )

    # =====================================================
    # WEEKLY TREATMENT
    # =====================================================

    weekly_treatment = Column(
        Text,
        nullable=False
    )

    # =====================================================
    # SEASONAL RECOMMENDATIONS
    # =====================================================

    seasonal_recommendations = Column(
        Text,
        nullable=False
    )

    # =====================================================
    # ADAPTIVE ROUTINE
    # =====================================================

    adaptive_updates = Column(Text)

    # =====================================================
    # CREATION DATE
    # =====================================================

    created_at = Column(
        String,
        nullable=False
    )

    # =====================================================
    # USER RELATIONSHIP
    # =====================================================

    user = relationship(
        "User",
        back_populates="skincare_routines"
    )

    # =====================================================
    # ROUTINE ADHERENCE RELATIONSHIP
    # =====================================================

    adherence_records = relationship(
        "RoutineAdherence",
        back_populates="routine",
        cascade="all, delete-orphan"
    )


# =========================================================
# ROUTINE ADHERENCE TRACKING
# =========================================================

class RoutineAdherence(Base):
    __tablename__ = "routine_adherence"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # USER
    # =====================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # =====================================================
    # SKINCARE ROUTINE
    # =====================================================

    routine_id = Column(
        Integer,
        ForeignKey("skincare_routines.id"),
        nullable=False
    )

    # =====================================================
    # ROUTINE TYPE
    # =====================================================

    routine_type = Column(
        String,
        nullable=False
    )

    # =====================================================
    # ROUTINE ACTIVITY
    # =====================================================

    activity = Column(
        String,
        nullable=False
    )

    # =====================================================
    # COMPLETION STATUS
    # =====================================================

    completed = Column(
        Integer,
        nullable=False,
        default=0
    )

    # =====================================================
    # DATE
    # =====================================================

    date = Column(
        Date,
        nullable=False
    )

    # =====================================================
    # USER RELATIONSHIP
    # =====================================================

    user = relationship(
        "User",
        back_populates="routine_adherence"
    )

    # =====================================================
    # ROUTINE RELATIONSHIP
    # =====================================================

    routine = relationship(
        "SkincareRoutine",
        back_populates="adherence_records"
    )


# =========================================================
# PRODUCT
# =========================================================

class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    source_id = Column(
        String,
        unique=True,
        index=True
    )

    name = Column(
        String,
        nullable=False,
        index=True
    )

    brand = Column(
        String,
        default="Unknown"
    )

    category = Column(
        String,
        index=True
    )

    price_inr = Column(Float)

    rating = Column(
        Float,
        default=0
    )

    ingredients = Column(
        Text,
        default=""
    )

    skin_types = Column(
        Text,
        default=""
    )

    concerns = Column(
        Text,
        default=""
    )

    description = Column(
        Text,
        default=""
    )

    allergens = Column(
        Text,
        default=""
    )

    source = Column(
        String,
        default=""
    )


# =========================================================
# INGREDIENT
# =========================================================

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    aliases = Column(
        Text,
        default=""
    )


# =========================================================
# INGREDIENT CONCERN
# =========================================================

class IngredientConcern(Base):
    __tablename__ = "ingredient_concerns"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    ingredient = Column(
        String,
        nullable=False,
        index=True
    )

    concern = Column(
        String,
        nullable=False,
        index=True
    )

    interactions_to_avoid = Column(
        Text,
        default=""
    )

    notes = Column(
        Text,
        default=""
    )

    source_note = Column(
        Text,
        nullable=False
    )


# =========================================================
# DAILY CHECK-IN
# =========================================================

class DailyCheckin(Base):
    __tablename__ = "daily_checkins"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "date",
            name="uq_daily_checkin_user_date"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    date = Column(
        Date,
        nullable=False,
        index=True
    )

    routine_completed = Column(
        Boolean,
        nullable=False,
        default=False
    )

    water_intake_liters = Column(
        Float,
        nullable=False,
        default=0
    )

    sleep_hours = Column(
        Float,
        nullable=False,
        default=0
    )

    skin_condition_rating = Column(
        Float,
        nullable=False
    )

    lifestyle_score = Column(
        Float,
        nullable=False,
        default=50
    )

    hydration_score = Column(
        Float,
        nullable=False,
        default=0
    )

    skin_health_score = Column(
        Float,
        nullable=False,
        default=0
    )


# =========================================================
# REMINDER SYSTEM
# =========================================================

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # =====================================================
    # REMINDER TYPE
    # =====================================================

    # Supported:
    # routine
    # hydration
    # sleep
    # product_replenishment
    # progress

    reminder_type = Column(
        String,
        nullable=False
    )

    # =====================================================
    # REMINDER CONTENT
    # =====================================================

    title = Column(
        String,
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    # =====================================================
    # REMINDER TIME
    # =====================================================

    # Example:
    # "08:00"
    # "14:00"
    # "21:00"

    reminder_time = Column(
        String,
        nullable=True
    )

    # =====================================================
    # ACTIVE STATUS
    # =====================================================

    active = Column(
        Boolean,
        nullable=False,
        default=True
    )

    # =====================================================
    # PRODUCT REPLENISHMENT
    # =====================================================

    next_due_date = Column(
        Date,
        nullable=True
    )

    # =====================================================
    # LAST TRIGGERED
    # =====================================================

    last_triggered_date = Column(
        Date,
        nullable=True
    )

    # =====================================================
    # CREATED DATE
    # =====================================================

    created_at = Column(
        String,
        nullable=False
    )

    # =====================================================
    # USER RELATIONSHIP
    # =====================================================

    user = relationship(
        "User",
        back_populates="reminders"
    )


# =========================================================
# NOTIFICATION SYSTEM
# =========================================================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # USER
    # =====================================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # =====================================================
    # NOTIFICATION TYPE
    # =====================================================

    # Examples:
    # routine
    # hydration
    # sleep
    # product_replenishment
    # progress
    # platform

    notification_type = Column(
        String,
        nullable=False
    )

    # =====================================================
    # NOTIFICATION CONTENT
    # =====================================================

    title = Column(
        String,
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    # =====================================================
    # READ STATUS
    # =====================================================

    is_read = Column(
        Boolean,
        nullable=False,
        default=False
    )

    # =====================================================
    # CREATED DATE
    # =====================================================

    created_at = Column(
        String,
        nullable=False
    )

    # =====================================================
    # USER RELATIONSHIP
    # =====================================================

    user = relationship(
        "User",
        back_populates="notifications"
    )
    # =========================================================
# CONSULTATION REQUEST
# =========================================================

class ConsultationRequest(Base):
    __tablename__ = "consultation_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    client_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    professional_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    professional_role = Column(
        String,
        nullable=False
    )

    request_message = Column(
        Text,
        nullable=True
    )

    status = Column(
        String,
        nullable=False,
        default="pending"
    )

    created_at = Column(
        String,
        nullable=False
    )

    responded_at = Column(
        String,
        nullable=True
    )

    client = relationship(
        "User",
        foreign_keys=[client_id]
    )

    professional = relationship(
        "User",
        foreign_keys=[professional_id]
    )