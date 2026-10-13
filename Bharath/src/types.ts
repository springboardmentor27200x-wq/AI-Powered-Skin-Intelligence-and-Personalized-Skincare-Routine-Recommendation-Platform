export type UserRole = "USER" | "DERMATOLOGIST" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SkinProfile {
  id?: number;
  user_id?: number;
  skin_type: string;
  age_group: string;
  skin_concerns: string[];
  allergies: string[];
  sensitivities: string[];
  created_at?: string;
  updated_at?: string;
}

export interface LifestyleRecord {
  id: number;
  user_id: number;
  lifestyle_habits: string[] | string;
  water_intake: number;
  environmental_exposure: string;
  recorded_at: string;
}

export interface SleepRecord {
  id: number;
  user_id: number;
  sleep_hours: number;
  sleep_quality: string;
  recorded_at: string;
}

export interface PrioritizedConcern {
  concern: string;
  severity: "Mild" | "Moderate" | "Severe";
  priority: "High" | "Medium" | "Low";
  contributing_factors: string[];
  recommendation: string;
}

export interface RiskFactor {
  factor: string;
  impact: string;
  category: "Lifestyle" | "Sleep" | "Environment" | "Hydration" | "Sensitivity";
  severity: "High" | "Medium" | "Low";
}

export interface ClinicalCaseMatch {
  patient_id: number;
  similarity_percentage: number;
  age: number;
  skin_type: string;
  primary_concern: string;
  water_liters: number;
  sleep_hours: number;
  barrier_state: string;
  clinical_outcome: string;
  actual_score: number;
}

export interface ModelValidationMetrics {
  sample_size: number;
  features_analyzed: number;
  r_squared: number;
  mean_absolute_error: number;
  accuracy_rate: number;
  f1_score: number;
  algorithm: string;
}

export interface PredictionMetadata {
  engine: string;
  is_predictive: boolean;
  dataset_source: string;
  dataset_records_count: number;
  prediction_confidence: number;
  analogous_clinical_cases: ClinicalCaseMatch[];
  model_metrics: ModelValidationMetrics;
  feature_weights: Record<string, number>;
  predicted_barrier_state: string;
  predicted_primary_active: string;
}

export interface SkinAssessment {
  id: number;
  user_id: number;
  overall_score: number;
  condition_score: number;
  lifestyle_score: number;
  sleep_score: number;
  hydration_score: number;
  routine_score: number;
  score_category: "Optimal" | "Good" | "Moderate" | "Needs Attention";
  score_explanation: string;
  skin_type: string;
  age_group: string;
  concerns: string[];
  prioritized_concerns: PrioritizedConcern[];
  risk_factors: RiskFactor[];
  assessment_summary: string;
  prediction_meta?: PredictionMetadata;
  created_at: string;
  updated_at: string;
}

export interface RoutineStep {
  step_number: number;
  category: string;
  name: string;
  purpose: string;
  when_to_use: string;
  why_selected: string;
  cautions?: string;
  key_ingredients: string[];
}

export interface WeeklyTreatment {
  day_or_frequency: string;
  treatment_type: string;
  name: string;
  purpose: string;
  instructions: string;
  cautions?: string;
}

export interface SkincareRoutine {
  id: number;
  user_id: number;
  assessment_id?: number;
  morning_routine: RoutineStep[];
  evening_routine: RoutineStep[];
  weekly_treatments: WeeklyTreatment[];
  recommendations: string[];
  excluded_ingredients: string[];
  prediction_meta?: PredictionMetadata;
  created_at: string;
  updated_at: string;
}

export interface ClinicalDatasetStats {
  total_records: number;
  filename: string;
  csv_filename: string;
  file_size_kb: number;
  averages: {
    overall_score: number;
    barrier_score: number;
    water_liters: number;
    sleep_hours: number;
  };
  distributions: {
    skin_type: Record<string, number>;
    primary_concern: Record<string, number>;
    barrier_state: Record<string, number>;
    top_actives: Record<string, number>;
  };
  model_benchmarks: {
    algorithm: string;
    k_neighbors: number;
    training_records: number;
    cross_val_r_squared: number;
    mean_absolute_error: number;
    accuracy_rate: number;
    f1_score: number;
  };
  last_updated: string;
}

export interface ClinicalRecordView {
  patient_id: number;
  age: number;
  age_group: string;
  gender: string;
  skin_type: string;
  fitzpatrick_type: string;
  primary_concern: string;
  secondary_concern: string;
  sensitivity_level: string;
  daily_water_liters: number;
  daily_sleep_hours: number;
  sleep_quality: string;
  stress_level: string;
  uv_exposure: string;
  pollution_exposure: string;
  diet_type: string;
  uses_daily_spf: number;
  routine_adherence: string;
  known_allergies: string;
  target_overall_score: number;
  target_barrier_score: number;
  target_hydration_score: number;
  target_lifestyle_score: number;
  target_sleep_score: number;
  target_routine_score: number;
  clinical_barrier_state: string;
  predicted_primary_active: string;
  recommended_am_cleanse: string;
  recommended_pm_treatment: string;
  recommended_moisturizer: string;
  clinical_response_stars: number;
  clinical_notes: string;
}

export interface DatabaseCollectionInfo {
  name: string;
  count: number;
  description: string;
  indexes?: string[];
}

export interface DatabaseStatus {
  engine: string;
  dbName: string;
  isConnected: boolean;
  uri: string;
  status: string;
  totalDocuments: number;
  collections: DatabaseCollectionInfo[];
  timestamp: string;
}

export interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  has_profile: boolean;
  skin_type?: string;
  age_group?: string;
  concerns_count: number;
  allergies_count: number;
  sensitivities_count: number;
  has_assessment: boolean;
  assessment_score?: number;
  assessment_category?: string;
  has_routine: boolean;
  routine_steps_count: number;
  lifestyle_count: number;
  sleep_count: number;
  latest_lifestyle?: LifestyleRecord;
  latest_sleep?: SleepRecord;
}

export interface AdminUserDetail {
  user: User;
  skin_profile: SkinProfile | null;
  latest_assessment: SkinAssessment | null;
  latest_routine: SkincareRoutine | null;
  lifestyle_records: LifestyleRecord[];
  sleep_records: SleepRecord[];
}

export interface AdminStats {
  total_users: number;
  total_admins: number;
  total_dermatologists?: number;
  total_standard_users: number;
  total_profiles: number;
  total_assessments: number;
  total_routines: number;
  total_lifestyle_records: number;
  total_sleep_records: number;
  skin_type_distribution: Record<string, number>;
  total_products?: number;
  total_ingredients?: number;
  total_shelf_items?: number;
  total_routine_logs?: number;
}

// ==========================================
// Milestone 3: Ingredient Intelligence & Product Engine Types
// ==========================================

export type IngredientCategory =
  | "Active"
  | "Hydrator"
  | "Barrier & Lipid"
  | "Antioxidant"
  | "Soothing"
  | "Exfoliant"
  | "Sunscreen Filter"
  | "Emollient";

export interface IngredientContraindication {
  ingredient: string;
  reason: string;
  severity: "High" | "Moderate";
}

export interface IngredientSynergy {
  ingredient: string;
  reason: string;
  benefit: string;
}

export interface Ingredient {
  id: number;
  name: string;
  inci_name: string;
  common_names: string[];
  category: IngredientCategory;
  function: string;
  comedogenic_rating: number; // 0 to 5
  safety_score: number; // 1 to 10 (10 being gentlest/safest)
  irritation_potential: "None" | "Low" | "Moderate" | "High";
  ph_optimal_range?: string;
  suitable_skin_types: string[];
  target_concerns: string[];
  contraindications: IngredientContraindication[];
  synergies: IngredientSynergy[];
  usage_advice: {
    time_of_day: "AM" | "PM" | "Both";
    requires_sunscreen: boolean;
    notes: string;
  };
  description: string;
  mechanism_of_action: string;
}

export type ProductCategory =
  | "Cleanser"
  | "Toner"
  | "Serum"
  | "Moisturizer"
  | "Sunscreen"
  | "Treatment & Exfoliant"
  | "Eye Cream";

export type RoutineSlotAssignment =
  | "AM_1"
  | "AM_2"
  | "AM_3"
  | "AM_4"
  | "PM_1"
  | "PM_2"
  | "PM_3"
  | "PM_4"
  | "WEEKLY";

export interface Product {
  id: number;
  name: string;
  brand: string;
  category: ProductCategory;
  routine_slot_default: string;
  price: number;
  volume: string;
  description: string;
  skin_types: string[];
  target_concerns: string[];
  key_actives: string[];
  inci_ingredients: string[];
  comedogenic_score: number; // 0 to 5
  is_fragrance_free: boolean;
  is_alcohol_free: boolean;
  is_cruelty_free: boolean;
  is_vegan: boolean;
  how_to_use: string;
  image_url?: string;
  rating: number;
  review_count: number;
}

export interface ProductRecommendation extends Product {
  match_score: number; // 0 - 100
  match_reasons: string[];
  target_concerns_addressed: string[];
  allergen_warning: boolean;
  flagged_allergens: string[];
  sensitivity_warning: boolean;
  flagged_sensitivities: string[];
  routine_fit: string;
  barrier_compatibility: string;
}

export interface UserShelfItem {
  id: number;
  user_id: number;
  product_id: number;
  product: Product;
  assigned_slots: RoutineSlotAssignment[];
  status: "Active" | "Empty" | "Wishlist";
  user_rating?: number;
  opened_date?: string;
  notes?: string;
  created_at: string;
}

export interface RoutineConflictItem {
  type: "Contraindication" | "Irritation Overload" | "Missing Sunscreen" | "pH Incompatibility";
  severity: "High" | "Medium" | "Low";
  slot?: string;
  product1?: string;
  product2?: string;
  ingredient1?: string;
  ingredient2?: string;
  description: string;
  clinical_recommendation: string;
}

export interface RoutineSynergyItem {
  product1?: string;
  product2?: string;
  ingredient1?: string;
  ingredient2?: string;
  benefit: string;
  description: string;
}

export interface RoutineConflictReport {
  has_conflicts: boolean;
  conflict_count: number;
  conflicts: RoutineConflictItem[];
  synergies: RoutineSynergyItem[];
  overall_safety_rating: "Safe & Balanced" | "Caution Advised" | "Hazardous Clashes Detected";
}

export interface CustomAnalysisIngredientItem {
  name: string;
  inci_name: string;
  category: string;
  comedogenic_rating: number;
  function: string;
  is_active: boolean;
  matched: boolean;
}

export interface CustomAnalysisResult {
  total_ingredients_parsed: number;
  known_ingredients: number;
  safety_score: number;
  comedogenic_risk: "Very Low" | "Low" | "Moderate" | "High";
  max_comedogenic_rating: number;
  allergen_matches: { ingredient: string; user_allergen: string }[];
  sensitivity_matches: { ingredient: string; user_sensitivity: string }[];
  detected_conflicts: {
    ingredient1: string;
    ingredient2: string;
    reason: string;
    severity: "High" | "Moderate";
  }[];
  detected_synergies: {
    ingredient1: string;
    ingredient2: string;
    reason: string;
  }[];
  actives_found: string[];
  key_benefits: string[];
  usage_recommendation: string;
  ingredients_details: CustomAnalysisIngredientItem[];
}

export interface DailyRoutineLog {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  am_completed: boolean;
  pm_completed: boolean;
  products_used_am: number[];
  products_used_pm: number[];
  skin_reaction:
    | "Calm & Radiant"
    | "Hydrated & Normal"
    | "Mild Tingling"
    | "Slight Redness"
    | "Dryness / Flaking"
    | "Irritation"
    | "Breakout";
  reaction_notes?: string;
  created_at: string;
}

export interface AdherenceStreakSummary {
  current_streak_days: number;
  longest_streak_days: number;
  total_completed_sessions: number;
  adherence_rate_30d: number;
  recent_reactions: { reaction: string; count: number }[];
  last_logged_date?: string;
}

export interface DermatologyConsultation {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  skin_type?: string;
  primary_concern: string;
  subject: string;
  query_text: string;
  current_routine_notes?: string;
  urgency: "Routine" | "Moderate" | "Urgent";
  status: "Pending" | "Solved";
  dermatologist_id?: number;
  dermatologist_name?: string;
  clinical_response?: string;
  recommended_actives?: string[];
  recommended_product_id?: number;
  recommended_product_name?: string;
  created_at: string;
  solved_at?: string;
}

export interface RoutineReminderSettings {
  morning_routine_enabled: boolean;
  morning_routine_time: string; // e.g. "08:00"
  evening_routine_enabled: boolean;
  evening_routine_time: string; // e.g. "21:30"
  hydration_reminder_enabled: boolean;
  hydration_reminder_time: string; // e.g. "14:00"
  sunscreen_reapply_enabled: boolean;
  sunscreen_reapply_time: string; // e.g. "12:30"
  consultation_alerts_enabled: boolean;
  browser_notifications_permitted: boolean;
}

export interface ReminderAlertItem {
  id: string;
  title: string;
  message: string;
  type: "routine" | "hydration" | "sunscreen" | "consultation" | "conflict";
  timestamp: string;
  read: boolean;
  route?: PageRoute;
}

export type PageRoute = 
  | "/dashboard"
  | "/skin-profile"
  | "/lifestyle"
  | "/sleep"
  | "/assessment"
  | "/routine"
  | "/products"
  | "/ingredients"
  | "/consultations"
  | "/profile"
  | "/login"
  | "/register"
  | "/admin/users"
  | "/admin/database"
  | "/admin/dataset";

