# Import all the models, so that Base has them before being
# imported by Alembic or used by create_all

from app.db.database import Base  # noqa
from app.models.user import User, UserProfile  # noqa
from app.models.skin_profile import SkinProfile, SkinConcern, UserSkinConcern  # noqa
from app.models.lifestyle import LifestyleRecord  # noqa
from app.models.sleep import SleepRecord  # noqa
from app.models.hydration import HydrationRecord  # noqa
from app.models.environment import EnvironmentalExposureRecord  # noqa
from app.models.connection import ProfessionalConnection  # noqa
from app.models.assessment import SkinAssessment, AssessmentConcern, RiskFactor, SkinScore  # noqa
from app.models.routine import Routine, RoutineStep  # noqa
from app.models.routine_adherence import RoutineAdherenceRecord  # noqa
from app.models.professional_recommendation import ProfessionalRecommendation  # noqa
from app.models.system_setting import SystemSetting  # noqa
