from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class SkinProfileCreate(BaseModel):
    user_id: int
    skin_type: str
    skin_concerns: str
    sensitivity: str


class LifestyleCreate(BaseModel):
    user_id: int
    water_intake: str
    exercise: str
    smoking: str


class SleepCreate(BaseModel):
    user_id: int
    sleep_hours: float
    sleep_quality: str


class SkinAssessmentCreate(BaseModel):
    user_id: int  
    routine_consistency: int  


class RoutineCreate(BaseModel):
    user_id: int

class IngredientAnalysisCreate(BaseModel):
    ingredient: str
    skin_type: str
    skin_concerns: str
    sensitivity: str
    allergies: str = ""

class ProductRecommendationCreate(BaseModel):
    skin_type: str
    skin_concerns: str
    sensitivity: str
    budget: float

class ProductComparisonCreate(BaseModel):
    product_names: list[str]

class AlternativeProductCreate(BaseModel):
    category: str
    budget: float

class SkinProgressCreate(BaseModel):
    user_id: int
    progress_date: str
    skin_score: int
    routine_adherence: int
    notes: str = ""   