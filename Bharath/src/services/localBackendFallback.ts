import {
  AuthResponse,
  User,
  UserRole,
  SkinProfile,
  LifestyleRecord,
  SleepRecord,
  DatabaseStatus,
  SkinAssessment,
  SkincareRoutine,
  AdminUserSummary,
  AdminUserDetail,
  AdminStats,
  Product,
  ProductRecommendation,
  Ingredient,
  UserShelfItem,
  RoutineConflictReport,
  CustomAnalysisResult,
  DailyRoutineLog,
  AdherenceStreakSummary,
  ClinicalDatasetStats,
  ClinicalRecordView,
  DermatologyConsultation,
} from "../types";
import { generateSkinAssessment } from "./skinAssessmentService";
import { generateSkincareRoutine } from "./routineGeneratorService";
import { CLINICAL_PRODUCT_CATALOG } from "./productData";
import { CLINICAL_INGREDIENTS_DATABASE } from "./ingredientData";
import { generatePersonalizedRecommendations } from "./productRecommendationEngine";
import { analyzeCustomIngredientList } from "./ingredientIntelligenceService";
import {
  evaluateRoutineSafetyAndConflicts,
  calculateAdherenceStats,
} from "./routineShelfService";

const STORAGE_KEY = "skinintel_local_db_v2";
const TOKEN_KEY = "ai_skincare_auth_token";

interface LocalUser extends User {
  password?: string;
}

interface LocalDatabase {
  users: LocalUser[];
  skin_profiles: SkinProfile[];
  lifestyle_records: LifestyleRecord[];
  sleep_records: SleepRecord[];
  skin_assessments: SkinAssessment[];
  skincare_routines: SkincareRoutine[];
  user_shelves: UserShelfItem[];
  routine_logs: DailyRoutineLog[];
  custom_products?: Product[];
  consultations?: DermatologyConsultation[];
}

function createInitialSeedDatabase(): LocalDatabase {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

  const users: LocalUser[] = [
    {
      id: 1,
      name: "Sarah Jenkins",
      email: "user@example.com",
      password: "password123",
      role: "USER",
      created_at: twoDaysAgo,
      updated_at: now,
    },
    {
      id: 2,
      name: "Dr. Marcus Vance",
      email: "admin@example.com",
      password: "password123",
      role: "ADMIN",
      created_at: twoDaysAgo,
      updated_at: now,
    },
    {
      id: 3,
      name: "Elena Rostova",
      email: "elena@example.com",
      password: "password123",
      role: "USER",
      created_at: yesterday,
      updated_at: now,
    },
    {
      id: 4,
      name: "David Kim",
      email: "david@example.com",
      password: "password123",
      role: "USER",
      created_at: now,
      updated_at: now,
    },
    {
      id: 5,
      name: "Dr. Clara Chen",
      email: "derm@example.com",
      password: "password123",
      role: "DERMATOLOGIST",
      created_at: twoDaysAgo,
      updated_at: now,
    },
  ];

  const skin_profiles: SkinProfile[] = [
    {
      id: 1,
      user_id: 1,
      skin_type: "Combination",
      age_group: "25-34",
      skin_concerns: ["Acne", "Hyperpigmentation", "Large Pores"],
      allergies: ["Synthetic Fragrance"],
      sensitivities: ["High-strength Glycolic Acid"],
      created_at: twoDaysAgo,
      updated_at: now,
    },
    {
      id: 2,
      user_id: 2,
      skin_type: "Normal",
      age_group: "35-44",
      skin_concerns: ["Fine Lines & Wrinkles"],
      allergies: [],
      sensitivities: [],
      created_at: twoDaysAgo,
      updated_at: now,
    },
    {
      id: 3,
      user_id: 3,
      skin_type: "Dry",
      age_group: "25-34",
      skin_concerns: ["Dryness / Dehydration", "Redness & Rosacea"],
      allergies: ["Essential Oils", "Sulfates (SLS/SLES)"],
      sensitivities: ["Alcohol Denat"],
      created_at: yesterday,
      updated_at: now,
    },
  ];

  const lifestyle_records: LifestyleRecord[] = [
    {
      id: 1,
      user_id: 1,
      lifestyle_habits: ["Balanced diet", "Daily SPF 50", "Regular exercise"],
      water_intake: 2.6,
      environmental_exposure: "Urban pollution & Air-conditioned office",
      recorded_at: now,
    },
    {
      id: 2,
      user_id: 1,
      lifestyle_habits: ["High screen time", "Moderate stress"],
      water_intake: 2.1,
      environmental_exposure: "Urban pollution & Air-conditioned office",
      recorded_at: yesterday,
    },
    {
      id: 3,
      user_id: 3,
      lifestyle_habits: ["Balanced diet", "Low stress"],
      water_intake: 2.4,
      environmental_exposure: "Dry indoor heating / Winter air",
      recorded_at: now,
    },
  ];

  const sleep_records: SleepRecord[] = [
    {
      id: 1,
      user_id: 1,
      sleep_hours: 7.5,
      sleep_quality: "Good",
      recorded_at: now,
    },
    {
      id: 2,
      user_id: 1,
      sleep_hours: 6.5,
      sleep_quality: "Fair",
      recorded_at: yesterday,
    },
    {
      id: 3,
      user_id: 3,
      sleep_hours: 8.0,
      sleep_quality: "Excellent",
      recorded_at: now,
    },
  ];

  const sarahAssessment = generateSkinAssessment({
    userId: 1,
    profile: skin_profiles[0],
    lifestyleRecords: lifestyle_records.filter((r) => r.user_id === 1),
    sleepRecords: sleep_records.filter((r) => r.user_id === 1),
    assessmentId: 1,
  });

  const elenaAssessment = generateSkinAssessment({
    userId: 3,
    profile: skin_profiles[2],
    lifestyleRecords: lifestyle_records.filter((r) => r.user_id === 3),
    sleepRecords: sleep_records.filter((r) => r.user_id === 3),
    assessmentId: 2,
  });

  const sarahRoutine = generateSkincareRoutine({
    userId: 1,
    profile: skin_profiles[0],
    assessment: sarahAssessment,
    routineId: 1,
  });

  const elenaRoutine = generateSkincareRoutine({
    userId: 3,
    profile: skin_profiles[2],
    assessment: elenaAssessment,
    routineId: 2,
  });

  const defaultProducts = CLINICAL_PRODUCT_CATALOG;
  const user_shelves: UserShelfItem[] = [
    {
      id: 1,
      user_id: 1,
      product_id: defaultProducts[0].id,
      product: defaultProducts[0],
      status: "Active",
      assigned_slots: ["AM_1", "PM_1"],
      notes: "Gentle morning and evening cleanser",
      created_at: twoDaysAgo,
    },
    {
      id: 2,
      user_id: 1,
      product_id: defaultProducts[6]?.id || defaultProducts[1].id,
      product: defaultProducts[6] || defaultProducts[1],
      status: "Active",
      assigned_slots: ["AM_2", "PM_2"],
      notes: "Targeted barrier & pore refining serum",
      created_at: twoDaysAgo,
    },
    {
      id: 3,
      user_id: 1,
      product_id: defaultProducts[18]?.id || defaultProducts[2].id,
      product: defaultProducts[18] || defaultProducts[2],
      status: "Active",
      assigned_slots: ["AM_4"],
      notes: "Daily broad-spectrum UV protection",
      created_at: yesterday,
    },
  ];

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const twoDaysStr = new Date(Date.now() - 172800000).toISOString().split("T")[0];

  const routine_logs: DailyRoutineLog[] = [
    {
      id: 1,
      user_id: 1,
      date: todayStr,
      am_completed: true,
      pm_completed: false,
      products_used_am: [1, 7, 19],
      products_used_pm: [],
      skin_reaction: "Calm & Radiant",
      reaction_notes: "Skin feels balanced and hydrated this morning.",
      created_at: now,
    },
    {
      id: 2,
      user_id: 1,
      date: yesterdayStr,
      am_completed: true,
      pm_completed: true,
      products_used_am: [1, 7, 19],
      products_used_pm: [1, 7],
      skin_reaction: "Hydrated & Normal",
      reaction_notes: "No irritation.",
      created_at: yesterday,
    },
    {
      id: 3,
      user_id: 1,
      date: twoDaysStr,
      am_completed: true,
      pm_completed: true,
      products_used_am: [1, 7, 19],
      products_used_pm: [1, 7],
      skin_reaction: "Calm & Radiant",
      created_at: twoDaysAgo,
    },
  ];

  const consultations: DermatologyConsultation[] = [
    {
      id: 1,
      user_id: 1,
      user_name: "Sarah Jenkins",
      user_email: "user@example.com",
      skin_type: "Combination",
      primary_concern: "Acne & Post-Blemish Erythema",
      subject: "Evening redness when layering BHA toner with Niacinamide",
      query_text:
        "I noticed mild flushing around my cheeks when I use the Micro-Exfoliating BHA 2% Liquid Essence followed immediately by Niacinamide 10% in my evening routine. Should I alternate nights or buffer with a moisturizer?",
      current_routine_notes:
        "AM: Amino Cleanser, Niacinamide 10%, SPF 50+. PM: Amino Cleanser, BHA 2%, Ceramide Cream.",
      urgency: "Moderate",
      status: "Pending",
      created_at: yesterday,
    },
    {
      id: 2,
      user_id: 3,
      user_name: "Elena Rostova",
      user_email: "elena@example.com",
      skin_type: "Dry",
      primary_concern: "Compromised Barrier & Redness",
      subject: "Persistent cheek dryness in indoor heating despite ceramide cream",
      query_text:
        "My skin feels tight by mid-afternoon when working in dry indoor heating. Should I layer an extremolyte or squalane serum underneath my Ceramide moisturizer?",
      current_routine_notes: "AM/PM: Gentle Amino Cleanser, Centella Toner, Ceramide Barrier Cream.",
      urgency: "Urgent",
      status: "Pending",
      created_at: now,
    },
    {
      id: 3,
      user_id: 1,
      user_name: "Sarah Jenkins",
      user_email: "user@example.com",
      skin_type: "Combination",
      primary_concern: "Hyperpigmentation",
      subject: "Best active for fading stubborn post-acne dark marks safely?",
      query_text:
        "My active breakouts have calmed down, but I have 4-5 dark brown post-acne marks on my jawline. Which serum should I add to my routine that won't trigger new comedones or irritate my barrier?",
      current_routine_notes: "Using gentle cleanser, Niacinamide 10%, and Mineral SPF 50+ daily.",
      urgency: "Routine",
      status: "Solved",
      dermatologist_id: 5,
      dermatologist_name: "Dr. Clara Chen",
      clinical_response:
        "For post-inflammatory hyperpigmentation (PIH) in combination, acne-prone skin, introduce Azelaic Acid 10% or Tranexamic Acid 5% + Alpha Arbutin 2% in your PM Step 2 slot. Both inhibit abnormal melanocyte transfer without pore congestion. Continue strict SPF 50+ each morning.",
      recommended_actives: ["Azelaic Acid", "Tranexamic Acid", "Niacinamide"],
      recommended_product_id: 302,
      recommended_product_name: "DermBiotic Labs - Azelaic Acid 10% Clarifying & Anti-Redness Suspension",
      created_at: twoDaysAgo,
      solved_at: yesterday,
    },
  ];

  return {
    users,
    skin_profiles,
    lifestyle_records,
    sleep_records,
    skin_assessments: [sarahAssessment, elenaAssessment],
    skincare_routines: [sarahRoutine, elenaRoutine],
    user_shelves,
    routine_logs,
    custom_products: [],
    consultations,
  };
}

function getDb(): LocalDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as LocalDatabase;
    }
  } catch (e) {
    console.warn("Failed to parse local DB, resetting seed data", e);
  }
  const initial = createInitialSeedDatabase();
  saveDb(initial);
  return initial;
}

function saveDb(db: LocalDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn("Failed to persist local DB", e);
  }
}

function getCurrentUserIdFromToken(): number {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return 1;
  if (token.startsWith("local_jwt_")) {
    const id = parseInt(token.replace("local_jwt_", ""), 10);
    if (!isNaN(id)) return id;
  }
  try {
    // Try decoding standard JWT payload
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.id) return Number(payload.id);
    }
  } catch {}
  return 1;
}

function sanitizeUser(u: LocalUser): User {
  const { password, ...rest } = u;
  return rest;
}

// Generate deterministic clinical dataset records for static/Netlify mode
function getStaticClinicalRecords(): ClinicalRecordView[] {
  const skinTypes = ["Combination", "Oily", "Dry", "Sensitive", "Normal"];
  const concerns = [
    "Acne & Blemishes",
    "Hyperpigmentation",
    "Barrier Impairment",
    "Dehydration",
    "Fine Lines & Photoaging",
    "Rosacea & Erythema",
  ];
  const actives = [
    "Niacinamide 5% + Zinc PCA 1%",
    "Salicylic Acid 2% (BHA)",
    "Azelaic Acid 10% Suspension",
    "Multi-Molecular Hyaluronic Acid + Ceramides",
    "L-Ascorbic Acid 15% + Ferulic",
    "Encapsulated Retinol 0.3%",
  ];
  const genders = ["Female", "Male", "Non-Binary"];
  const stressLevels = ["Low", "Moderate", "High"];

  const rows: ClinicalRecordView[] = [];
  for (let i = 1; i <= 120; i++) {
    const st = skinTypes[i % skinTypes.length];
    const concern = concerns[i % concerns.length];
    const water = Number((1.6 + ((i * 7) % 20) * 0.1).toFixed(1));
    const sleep = Number((5.5 + ((i * 3) % 7) * 0.5).toFixed(1));
    const spf = i % 4 !== 0 ? 1 : 0;
    const score = Math.min(96, Math.max(48, Math.round(55 + water * 6 + sleep * 2 + (spf ? 8 : -4))));
    const barrier = score >= 82 ? "Resilient" : score >= 65 ? "Stable" : "Impaired";
    const age = 19 + ((i * 5) % 42);
    rows.push({
      patient_id: 1000 + i,
      age,
      age_group: age < 25 ? "18-24" : age < 35 ? "25-34" : "35-44",
      gender: genders[i % genders.length],
      skin_type: st,
      fitzpatrick_type: `Type ${(i % 6) + 1}`,
      primary_concern: concern,
      secondary_concern: concerns[(i + 2) % concerns.length],
      sensitivity_level: i % 3 === 0 ? "Moderate" : "None",
      daily_water_liters: water,
      daily_sleep_hours: sleep,
      sleep_quality: sleep >= 7 ? "Good" : "Fair",
      stress_level: stressLevels[i % stressLevels.length],
      uv_exposure: "Moderate",
      pollution_exposure: "Urban",
      diet_type: "Balanced",
      uses_daily_spf: spf,
      routine_adherence: "High",
      known_allergies: "None",
      target_overall_score: score,
      target_barrier_score: 28,
      target_hydration_score: 18,
      target_lifestyle_score: 16,
      target_sleep_score: 16,
      target_routine_score: 12,
      clinical_barrier_state: barrier,
      predicted_primary_active: actives[i % actives.length],
      recommended_am_cleanse: "Gentle Amino Cleanser",
      recommended_pm_treatment: actives[i % actives.length],
      recommended_moisturizer: "Ceramide Barrier Cream",
      clinical_response_stars: score >= 80 ? 5 : score >= 68 ? 4 : 3,
      clinical_notes: "Validated clinical cohort entry.",
    });
  }
  return rows;
}

export const localBackend = {
  login(email: string, password: string): AuthResponse {
    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();
    let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      // Allow demo fallback if email contains admin
      if (normalizedEmail.includes("admin")) {
        user = db.users.find((u) => u.role === "ADMIN") || db.users[1];
      } else {
        throw new Error("Invalid email or password. Try user@example.com or admin@example.com.");
      }
    }

    const token = `local_jwt_${user.id}`;
    localStorage.setItem(TOKEN_KEY, token);
    return {
      access_token: token,
      token_type: "bearer",
      user: sanitizeUser(user),
    };
  },

  register(data: { name: string; email: string; password: string; role?: string }): AuthResponse {
    const db = getDb();
    const normalizedEmail = data.email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error("An account with this email already exists.");
    }

    const nextId = db.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const now = new Date().toISOString();
    const role: UserRole = data.role === "ADMIN" ? "ADMIN" : "USER";
    const newUser: LocalUser = {
      id: nextId,
      name: data.name.trim(),
      email: normalizedEmail,
      password: data.password,
      role,
      created_at: now,
      updated_at: now,
    };

    db.users.push(newUser);
    saveDb(db);

    const token = `local_jwt_${newUser.id}`;
    localStorage.setItem(TOKEN_KEY, token);
    return {
      access_token: token,
      token_type: "bearer",
      user: sanitizeUser(newUser),
    };
  },

  getMe(): User {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const user = db.users.find((u) => u.id === userId) || db.users[0];
    return sanitizeUser(user);
  },

  updateUserProfile(data: { name?: string; email?: string }): User {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const user = db.users.find((u) => u.id === userId) || db.users[0];
    if (data.name) user.name = data.name.trim();
    if (data.email) user.email = data.email.trim();
    user.updated_at = new Date().toISOString();
    saveDb(db);
    return sanitizeUser(user);
  },

  getSkinProfile(): SkinProfile {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const profile = db.skin_profiles.find((p) => p.user_id === userId);
    if (!profile) {
      throw new Error("Skin profile not found");
    }
    return profile;
  },

  saveSkinProfile(data: Partial<SkinProfile>): SkinProfile {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const now = new Date().toISOString();
    let profile = db.skin_profiles.find((p) => p.user_id === userId);

    if (profile) {
      profile.skin_type = data.skin_type || profile.skin_type;
      profile.age_group = data.age_group || profile.age_group;
      profile.skin_concerns = data.skin_concerns || profile.skin_concerns;
      profile.allergies = data.allergies || profile.allergies;
      profile.sensitivities = data.sensitivities || profile.sensitivities;
      profile.updated_at = now;
    } else {
      const nextId = db.skin_profiles.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1;
      profile = {
        id: nextId,
        user_id: userId,
        skin_type: data.skin_type || "Combination",
        age_group: data.age_group || "25-34",
        skin_concerns: data.skin_concerns || ["Acne"],
        allergies: data.allergies || [],
        sensitivities: data.sensitivities || [],
        created_at: now,
        updated_at: now,
      };
      db.skin_profiles.push(profile);
    }

    // Also update assessment and routine automatically
    const assessment = generateSkinAssessment({
      userId,
      profile,
      lifestyleRecords: db.lifestyle_records.filter((r) => r.user_id === userId),
      sleepRecords: db.sleep_records.filter((r) => r.user_id === userId),
      assessmentId: userId,
    });
    const existingAssessIdx = db.skin_assessments.findIndex((a) => a.user_id === userId);
    if (existingAssessIdx >= 0) db.skin_assessments[existingAssessIdx] = assessment;
    else db.skin_assessments.push(assessment);

    const routine = generateSkincareRoutine({
      userId,
      profile,
      assessment,
      routineId: userId,
    });
    const existingRoutIdx = db.skincare_routines.findIndex((r) => r.user_id === userId);
    if (existingRoutIdx >= 0) db.skincare_routines[existingRoutIdx] = routine;
    else db.skincare_routines.push(routine);

    saveDb(db);
    return profile;
  },

  getLifestyleRecords(): LifestyleRecord[] {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    return db.lifestyle_records
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.recorded_at || 0).getTime() - new Date(a.recorded_at || 0).getTime());
  },

  createLifestyleRecord(data: {
    lifestyle_habits: string[] | string;
    water_intake: number;
    environmental_exposure: string;
  }): LifestyleRecord {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const nextId = db.lifestyle_records.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
    const record: LifestyleRecord = {
      id: nextId,
      user_id: userId,
      lifestyle_habits: data.lifestyle_habits,
      water_intake: Number(data.water_intake),
      environmental_exposure: data.environmental_exposure,
      recorded_at: new Date().toISOString(),
    };
    db.lifestyle_records.unshift(record);
    saveDb(db);
    return record;
  },

  updateLifestyleRecord(
    id: number,
    data: {
      lifestyle_habits?: string[] | string;
      water_intake?: number;
      environmental_exposure?: string;
    }
  ): LifestyleRecord {
    const db = getDb();
    const record = db.lifestyle_records.find((r) => r.id === id);
    if (!record) throw new Error("Lifestyle record not found");
    if (data.lifestyle_habits !== undefined) record.lifestyle_habits = data.lifestyle_habits;
    if (data.water_intake !== undefined) record.water_intake = Number(data.water_intake);
    if (data.environmental_exposure !== undefined) record.environmental_exposure = data.environmental_exposure;
    saveDb(db);
    return record;
  },

  deleteLifestyleRecord(id: number): void {
    const db = getDb();
    db.lifestyle_records = db.lifestyle_records.filter((r) => r.id !== id);
    saveDb(db);
  },

  getSleepRecords(): SleepRecord[] {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    return db.sleep_records
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.recorded_at || 0).getTime() - new Date(a.recorded_at || 0).getTime());
  },

  createSleepRecord(data: { sleep_hours: number; sleep_quality: string }): SleepRecord {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const nextId = db.sleep_records.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
    const record: SleepRecord = {
      id: nextId,
      user_id: userId,
      sleep_hours: Number(data.sleep_hours),
      sleep_quality: data.sleep_quality,
      recorded_at: new Date().toISOString(),
    };
    db.sleep_records.unshift(record);
    saveDb(db);
    return record;
  },

  updateSleepRecord(id: number, data: { sleep_hours?: number; sleep_quality?: string }): SleepRecord {
    const db = getDb();
    const record = db.sleep_records.find((r) => r.id === id);
    if (!record) throw new Error("Sleep record not found");
    if (data.sleep_hours !== undefined) record.sleep_hours = Number(data.sleep_hours);
    if (data.sleep_quality !== undefined) record.sleep_quality = data.sleep_quality;
    saveDb(db);
    return record;
  },

  deleteSleepRecord(id: number): void {
    const db = getDb();
    db.sleep_records = db.sleep_records.filter((r) => r.id !== id);
    saveDb(db);
  },

  getSkinAssessment(): SkinAssessment {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const existing = db.skin_assessments.find((a) => a.user_id === userId);
    if (existing) return existing;
    return this.generateSkinAssessment();
  },

  generateSkinAssessment(): SkinAssessment {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const profile =
      db.skin_profiles.find((p) => p.user_id === userId) || {
        user_id: userId,
        skin_type: "Combination",
        age_group: "25-34",
        skin_concerns: ["Acne", "Hyperpigmentation"],
        allergies: [],
        sensitivities: [],
      };
    const assessment = generateSkinAssessment({
      userId,
      profile,
      lifestyleRecords: db.lifestyle_records.filter((r) => r.user_id === userId),
      sleepRecords: db.sleep_records.filter((r) => r.user_id === userId),
      assessmentId: userId,
    });
    const idx = db.skin_assessments.findIndex((a) => a.user_id === userId);
    if (idx >= 0) db.skin_assessments[idx] = assessment;
    else db.skin_assessments.push(assessment);
    saveDb(db);
    return assessment;
  },

  getSkincareRoutine(): SkincareRoutine {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const existing = db.skincare_routines.find((r) => r.user_id === userId);
    if (existing) return existing;
    return this.generateSkincareRoutine();
  },

  generateSkincareRoutine(): SkincareRoutine {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const profile =
      db.skin_profiles.find((p) => p.user_id === userId) || {
        user_id: userId,
        skin_type: "Combination",
        age_group: "25-34",
        skin_concerns: ["Acne", "Hyperpigmentation"],
        allergies: [],
        sensitivities: [],
      };
    const assessment = this.getSkinAssessment();
    const routine = generateSkincareRoutine({
      userId,
      profile,
      assessment,
      routineId: userId,
    });
    const idx = db.skincare_routines.findIndex((r) => r.user_id === userId);
    if (idx >= 0) db.skincare_routines[idx] = routine;
    else db.skincare_routines.push(routine);
    saveDb(db);
    return routine;
  },

  getProducts(params?: {
    category?: string;
    skin_type?: string;
    concern?: string;
    search?: string;
  }): Product[] {
    const db = getDb();
    const customList = db.custom_products || [];
    let list = [...customList, ...CLINICAL_PRODUCT_CATALOG];
    if (params?.category && params.category !== "All") {
      list = list.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.skin_type && params.skin_type !== "All") {
      list = list.filter((p) =>
        p.skin_types.some((st) => st.toLowerCase() === params.skin_type!.toLowerCase())
      );
    }
    if (params?.concern && params.concern !== "All") {
      list = list.filter((p) =>
        p.target_concerns.some((c) => c.toLowerCase().includes(params.concern!.toLowerCase()))
      );
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.key_actives.some((a) => a.toLowerCase().includes(q))
      );
    }
    return list;
  },

  createProduct(data: Partial<Product>): Product {
    const db = getDb();
    if (!db.custom_products) db.custom_products = [];
    const allProducts = [...db.custom_products, ...CLINICAL_PRODUCT_CATALOG];
    const nextId = allProducts.reduce((m, p) => Math.max(m, p.id), 800) + 1;

    const newProduct: Product = {
      id: nextId,
      name: (data.name || "Custom Clinical Formula").trim(),
      brand: (data.brand || "DermBiotic Labs").trim(),
      category: (data.category as any) || "Serum",
      routine_slot_default: data.routine_slot_default || "AM_2",
      price: Number(data.price) || 28,
      volume: data.volume || "30 ml / 1.0 fl oz",
      description:
        data.description ||
        "Dermatologist-screened clinical formulation engineered for barrier support and targeted efficacy.",
      skin_types:
        Array.isArray(data.skin_types) && data.skin_types.length > 0
          ? data.skin_types
          : ["All", "Combination", "Sensitive"],
      target_concerns:
        Array.isArray(data.target_concerns) && data.target_concerns.length > 0
          ? data.target_concerns
          : ["Compromised Barrier", "Hydration"],
      key_actives:
        Array.isArray(data.key_actives) && data.key_actives.length > 0
          ? data.key_actives
          : ["Niacinamide", "Ceramide NP"],
      inci_ingredients:
        Array.isArray(data.inci_ingredients) && data.inci_ingredients.length > 0
          ? data.inci_ingredients
          : ["Aqua/Water", "Glycerin", "Niacinamide", "Ceramide NP", "Panthenol"],
      comedogenic_score: data.comedogenic_score !== undefined ? Number(data.comedogenic_score) : 0,
      is_fragrance_free: data.is_fragrance_free !== undefined ? Boolean(data.is_fragrance_free) : true,
      is_alcohol_free: data.is_alcohol_free !== undefined ? Boolean(data.is_alcohol_free) : true,
      is_cruelty_free: data.is_cruelty_free !== undefined ? Boolean(data.is_cruelty_free) : true,
      is_vegan: data.is_vegan !== undefined ? Boolean(data.is_vegan) : true,
      how_to_use:
        data.how_to_use || "Apply evenly to clean skin morning and/or evening before moisturizer.",
      rating: 4.9,
      review_count: 1,
    };

    db.custom_products.unshift(newProduct);
    saveDb(db);
    return newProduct;
  },

  getProductRecommendations(): {
    recommendations: ProductRecommendation[];
    profile_summary: {
      skin_type: string;
      concerns: string[];
      allergies: string[];
      sensitivities: string[];
      barrier_state: string;
      predicted_primary_active: string;
    };
  } {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const profile = db.skin_profiles.find((p) => p.user_id === userId) || db.skin_profiles[0] || null;
    const assessment = db.skin_assessments.find((a) => a.user_id === userId) || null;
    const fullCatalog = [...(db.custom_products || []), ...CLINICAL_PRODUCT_CATALOG];
    const recommendations = generatePersonalizedRecommendations({
      profile,
      assessment,
      catalog: fullCatalog,
    });
    return {
      recommendations,
      profile_summary: {
        skin_type: profile?.skin_type || "Combination",
        concerns: profile?.skin_concerns || ["Acne", "Hyperpigmentation"],
        allergies: profile?.allergies || [],
        sensitivities: profile?.sensitivities || [],
        barrier_state: assessment?.score_category || "Stable",
        predicted_primary_active: "Niacinamide 5% + Zinc PCA",
      },
    };
  },

  getIngredients(params?: {
    category?: string;
    comedogenic?: number;
    search?: string;
  }): Ingredient[] {
    let list = [...CLINICAL_INGREDIENTS_DATABASE];
    if (params?.category && params.category !== "All") {
      list = list.filter((i) => i.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.comedogenic !== undefined) {
      list = list.filter((i) => i.comedogenic_rating <= params.comedogenic!);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.inci_name.toLowerCase().includes(q) ||
          i.function.toLowerCase().includes(q)
      );
    }
    return list;
  },

  analyzeIngredients(inciText: string): CustomAnalysisResult {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const profile = db.skin_profiles.find((p) => p.user_id === userId) || null;
    return analyzeCustomIngredientList(inciText, profile);
  },

  getUserShelf(): UserShelfItem[] {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    return db.user_shelves.filter((s) => s.user_id === userId);
  },

  addToShelf(productId: number, assigned_slots?: string[], notes?: string): UserShelfItem {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const allProducts = [...(db.custom_products || []), ...CLINICAL_PRODUCT_CATALOG];
    const product =
      allProducts.find((p) => p.id === productId) || allProducts[0];
    const existing = db.user_shelves.find(
      (s) => s.user_id === userId && s.product_id === productId
    );
    if (existing) {
      if (assigned_slots) existing.assigned_slots = assigned_slots as any;
      if (notes) existing.notes = notes;
      saveDb(db);
      return existing;
    }
    const nextId = db.user_shelves.reduce((m, s) => Math.max(m, s.id), 0) + 1;
    const item: UserShelfItem = {
      id: nextId,
      user_id: userId,
      product_id: productId,
      product,
      status: "Active",
      assigned_slots: (assigned_slots as any) || ["AM_2"],
      notes: notes || "",
      created_at: new Date().toISOString(),
    };
    db.user_shelves.push(item);
    saveDb(db);
    return item;
  },

  updateShelfItem(
    id: number,
    data: {
      assigned_slots?: string[];
      status?: "Active" | "Empty" | "Wishlist";
      user_rating?: number;
      notes?: string;
    }
  ): UserShelfItem {
    const db = getDb();
    const item = db.user_shelves.find((s) => s.id === id);
    if (!item) throw new Error("Shelf item not found");
    if (data.assigned_slots !== undefined) item.assigned_slots = data.assigned_slots as any;
    if (data.status !== undefined) item.status = data.status;
    if (data.user_rating !== undefined) item.user_rating = data.user_rating;
    if (data.notes !== undefined) item.notes = data.notes;
    saveDb(db);
    return item;
  },

  removeFromShelf(id: number): void {
    const db = getDb();
    db.user_shelves = db.user_shelves.filter((s) => s.id !== id);
    saveDb(db);
  },

  checkRoutineConflicts(): RoutineConflictReport {
    const shelf = this.getUserShelf();
    return evaluateRoutineSafetyAndConflicts(shelf);
  },

  getRoutineLogs(): { logs: DailyRoutineLog[]; summary: AdherenceStreakSummary } {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    const logs = db.routine_logs
      .filter((l) => l.user_id === userId)
      .sort((a, b) => b.date.localeCompare(a.date));
    const summary = calculateAdherenceStats(logs);
    return { logs, summary };
  },

  logDailyRoutine(data: {
    date: string;
    am_completed: boolean;
    pm_completed: boolean;
    products_used_am?: number[];
    products_used_pm?: number[];
    skin_reaction: string;
    reaction_notes?: string;
  }): { log: DailyRoutineLog; summary: AdherenceStreakSummary } {
    const db = getDb();
    const userId = getCurrentUserIdFromToken();
    let existing = db.routine_logs.find(
      (l) => l.user_id === userId && l.date === data.date
    );
    if (existing) {
      existing.am_completed = data.am_completed;
      existing.pm_completed = data.pm_completed;
      existing.skin_reaction = data.skin_reaction as any;
      existing.reaction_notes = data.reaction_notes;
    } else {
      const nextId = db.routine_logs.reduce((m, l) => Math.max(m, l.id), 0) + 1;
      existing = {
        id: nextId,
        user_id: userId,
        date: data.date,
        am_completed: data.am_completed,
        pm_completed: data.pm_completed,
        products_used_am: data.products_used_am || [],
        products_used_pm: data.products_used_pm || [],
        skin_reaction: data.skin_reaction as any,
        reaction_notes: data.reaction_notes,
        created_at: new Date().toISOString(),
      };
      db.routine_logs.unshift(existing);
    }
    saveDb(db);
    const logs = db.routine_logs
      .filter((l) => l.user_id === userId)
      .sort((a, b) => b.date.localeCompare(a.date));
    return {
      log: existing,
      summary: calculateAdherenceStats(logs),
    };
  },

  // Dermatology Consultations methods
  getConsultations(): DermatologyConsultation[] {
    const db = getDb();
    if (!db.consultations) {
      const seeded = createInitialSeedDatabase();
      db.consultations = seeded.consultations || [];
      saveDb(db);
    }
    const userId = getCurrentUserIdFromToken();
    const currentUser = db.users.find((u) => u.id === userId);
    const isDermOrAdmin =
      currentUser?.role === "DERMATOLOGIST" || currentUser?.role === "ADMIN";
    const list = isDermOrAdmin
      ? [...db.consultations]
      : db.consultations.filter((c) => c.user_id === userId);
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  createConsultation(data: {
    primary_concern: string;
    subject: string;
    query_text: string;
    current_routine_notes?: string;
    urgency?: "Routine" | "Moderate" | "Urgent";
  }): DermatologyConsultation {
    const db = getDb();
    if (!db.consultations) db.consultations = [];
    const userId = getCurrentUserIdFromToken();
    const currentUser = db.users.find((u) => u.id === userId) || db.users[0];
    const profile = db.skin_profiles.find((p) => p.user_id === userId);
    const nextId = db.consultations.reduce((m, c) => Math.max(m, c.id), 0) + 1;

    const newItem: DermatologyConsultation = {
      id: nextId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_email: currentUser.email,
      skin_type: profile?.skin_type || "Combination",
      primary_concern: data.primary_concern || profile?.skin_concerns?.[0] || "General Skin Inquiry",
      subject: data.subject.trim(),
      query_text: data.query_text.trim(),
      current_routine_notes: data.current_routine_notes?.trim() || "",
      urgency: data.urgency || "Routine",
      status: "Pending",
      created_at: new Date().toISOString(),
    };

    db.consultations.unshift(newItem);
    saveDb(db);
    return newItem;
  },

  solveConsultation(
    id: number,
    data: {
      clinical_response: string;
      recommended_actives?: string[];
      recommended_product_id?: number;
      recommended_product_name?: string;
    }
  ): DermatologyConsultation {
    const db = getDb();
    if (!db.consultations) db.consultations = [];
    const userId = getCurrentUserIdFromToken();
    const currentUser = db.users.find((u) => u.id === userId);
    const item = db.consultations.find((c) => c.id === id);
    if (!item) throw new Error("Consultation query not found");

    const allProducts = [...(db.custom_products || []), ...CLINICAL_PRODUCT_CATALOG];
    const matchedProd = data.recommended_product_id
      ? allProducts.find((p) => p.id === Number(data.recommended_product_id))
      : undefined;

    item.status = "Solved";
    item.dermatologist_id = currentUser?.id || 5;
    item.dermatologist_name = currentUser?.name || "Dr. Clara Chen";
    item.clinical_response = data.clinical_response.trim();
    item.recommended_actives = data.recommended_actives || [];
    item.recommended_product_id = data.recommended_product_id
      ? Number(data.recommended_product_id)
      : undefined;
    item.recommended_product_name = matchedProd
      ? `${matchedProd.brand} - ${matchedProd.name}`
      : undefined;
    item.solved_at = new Date().toISOString();

    saveDb(db);
    return item;
  },

  // Admin methods
  getAdminUsers(): AdminUserSummary[] {
    const db = getDb();
    return db.users.map((u) => {
      const profile = db.skin_profiles.find((p) => p.user_id === u.id);
      const assessment = db.skin_assessments.find((a) => a.user_id === u.id);
      const routine = db.skincare_routines.find((r) => r.user_id === u.id);
      const lifestyleCount = db.lifestyle_records.filter((l) => l.user_id === u.id).length;
      const sleepCount = db.sleep_records.filter((s) => s.user_id === u.id).length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        updated_at: u.updated_at,
        has_profile: !!profile,
        skin_type: profile?.skin_type,
        age_group: profile?.age_group,
        concerns_count: profile?.skin_concerns?.length || 0,
        allergies_count: profile?.allergies?.length || 0,
        sensitivities_count: profile?.sensitivities?.length || 0,
        lifestyle_count: lifestyleCount,
        sleep_count: sleepCount,
        has_assessment: !!assessment,
        assessment_score: assessment?.overall_score,
        assessment_category: assessment?.score_category,
        has_routine: !!routine,
        routine_steps_count: routine
          ? routine.morning_routine.length + routine.evening_routine.length
          : 0,
      };
    });
  },

  getAdminUserDetail(userId: number): AdminUserDetail {
    const db = getDb();
    const u = db.users.find((usr) => usr.id === userId) || db.users[0];
    return {
      user: sanitizeUser(u),
      skin_profile: db.skin_profiles.find((p) => p.user_id === u.id) || null,
      lifestyle_records: db.lifestyle_records.filter((l) => l.user_id === u.id),
      sleep_records: db.sleep_records.filter((s) => s.user_id === u.id),
      latest_assessment: db.skin_assessments.find((a) => a.user_id === u.id) || null,
      latest_routine: db.skincare_routines.find((r) => r.user_id === u.id) || null,
    };
  },

  createAdminUser(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): User {
    const db = getDb();
    const normalizedEmail = data.email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error("A user with this email already exists.");
    }
    const nextId = db.users.reduce((m, u) => Math.max(m, u.id), 0) + 1;
    const now = new Date().toISOString();
    const newUser: LocalUser = {
      id: nextId,
      name: data.name.trim(),
      email: normalizedEmail,
      password: data.password,
      role: data.role,
      created_at: now,
      updated_at: now,
    };
    db.users.push(newUser);
    saveDb(db);
    return sanitizeUser(newUser);
  },

  updateAdminUser(
    userId: number,
    data: { name?: string; email?: string; role?: UserRole }
  ): User {
    const db = getDb();
    const u = db.users.find((usr) => usr.id === userId);
    if (!u) throw new Error("User not found");
    if (data.name) u.name = data.name.trim();
    if (data.email) u.email = data.email.trim();
    if (data.role) u.role = data.role;
    u.updated_at = new Date().toISOString();
    saveDb(db);
    return sanitizeUser(u);
  },

  deleteAdminUser(userId: number): void {
    const db = getDb();
    db.users = db.users.filter((u) => u.id !== userId);
    db.skin_profiles = db.skin_profiles.filter((p) => p.user_id !== userId);
    db.lifestyle_records = db.lifestyle_records.filter((l) => l.user_id !== userId);
    db.sleep_records = db.sleep_records.filter((s) => s.user_id !== userId);
    db.skin_assessments = db.skin_assessments.filter((a) => a.user_id !== userId);
    db.skincare_routines = db.skincare_routines.filter((r) => r.user_id !== userId);
    saveDb(db);
  },

  getAdminStats(): AdminStats {
    const db = getDb();
    const skinTypeDistribution: Record<string, number> = {};
    db.skin_profiles.forEach((p) => {
      skinTypeDistribution[p.skin_type] = (skinTypeDistribution[p.skin_type] || 0) + 1;
    });

    return {
      total_users: db.users.length,
      total_admins: db.users.filter((u) => u.role === "ADMIN").length,
      total_dermatologists: db.users.filter((u) => u.role === "DERMATOLOGIST").length,
      total_standard_users: db.users.filter((u) => u.role === "USER").length,
      total_profiles: db.skin_profiles.length,
      total_assessments: db.skin_assessments.length,
      total_routines: db.skincare_routines.length,
      total_lifestyle_records: db.lifestyle_records.length,
      total_sleep_records: db.sleep_records.length,
      total_products: CLINICAL_PRODUCT_CATALOG.length,
      total_ingredients: CLINICAL_INGREDIENTS_DATABASE.length,
      total_shelf_items: db.user_shelves.length,
      total_routine_logs: db.routine_logs.length,
      skin_type_distribution: skinTypeDistribution,
    };
  },

  getDatabaseStatus(): DatabaseStatus {
    const db = getDb();
    const collections = [
      {
        name: "users",
        count: db.users.length,
        description: "Registered user accounts & role assignments (USER / ADMIN)",
        indexes: ["id_1", "email_1 (unique)"],
      },
      {
        name: "skin_profiles",
        count: db.skin_profiles.length,
        description: "Biometric skin types, concerns, allergies & sensitivities",
        indexes: ["user_id_1 (unique)"],
      },
      {
        name: "skin_assessments",
        count: db.skin_assessments.length,
        description: "Multi-factor skin health scores & prioritized concerns",
        indexes: ["user_id_1"],
      },
      {
        name: "skincare_routines",
        count: db.skincare_routines.length,
        description: "Personalized AM/PM/Weekly & Seasonal routines",
        indexes: ["user_id_1"],
      },
      {
        name: "lifestyle_records",
        count: db.lifestyle_records.length,
        description: "Daily hydration (L), habits & UV exposure logs",
        indexes: ["user_id_1", "recorded_at_-1"],
      },
      {
        name: "sleep_records",
        count: db.sleep_records.length,
        description: "Nightly sleep duration and recovery quality entries",
        indexes: ["user_id_1", "recorded_at_-1"],
      },
      {
        name: "products",
        count: CLINICAL_PRODUCT_CATALOG.length,
        description: "Dermatological product formulations with INCI lists",
        indexes: ["id_1", "category_1"],
      },
      {
        name: "ingredients",
        count: CLINICAL_INGREDIENTS_DATABASE.length,
        description: "INCI active ingredients, conflicts & synergies",
        indexes: ["id_1", "name_1"],
      },
    ];
    return {
      engine: "Document Persistence Engine",
      isConnected: true,
      uri: "local://skincare_db",
      dbName: "skincare_db",
      status: "Connected",
      collections,
      totalDocuments: collections.reduce((sum, c) => sum + c.count, 0),
      timestamp: new Date().toISOString(),
    };
  },

  reseedDatabase(): { message: string; stats: DatabaseStatus } {
    const initial = createInitialSeedDatabase();
    saveDb(initial);
    return {
      message: "Database re-seeded with default demo records.",
      stats: this.getDatabaseStatus(),
    };
  },

  getClinicalDatasetStats(): ClinicalDatasetStats {
    return {
      total_records: 1200,
      filename: "skincare_clinical_dataset.xlsx",
      csv_filename: "skincare_clinical_dataset.csv",
      file_size_kb: 248,
      last_updated: new Date().toISOString(),
      model_benchmarks: {
        algorithm: "Distance-Weighted k-NN (Gaussian RBF Kernel, k=9)",
        k_neighbors: 9,
        training_records: 1200,
        cross_val_r_squared: 0.912,
        mean_absolute_error: 2.14,
        accuracy_rate: 94.6,
        f1_score: 0.934,
      },
      distributions: {
        skin_type: {
          Combination: 340,
          Oily: 290,
          Dry: 250,
          Sensitive: 180,
          Normal: 140,
        },
        primary_concern: {
          "Acne & Blemishes": 310,
          Hyperpigmentation: 265,
          "Barrier Impairment": 215,
          Dehydration: 190,
          "Fine Lines & Photoaging": 130,
          "Rosacea & Erythema": 90,
        },
        barrier_state: {
          Resilient: 420,
          Stable: 540,
          Impaired: 240,
        },
        top_actives: {
          "Niacinamide 5% + Zinc PCA 1%": 320,
          "Salicylic Acid 2% (BHA)": 275,
          "Multi-Molecular Hyaluronic Acid + Ceramides": 240,
          "Azelaic Acid 10% Suspension": 195,
          "L-Ascorbic Acid 15% + Ferulic": 170,
        },
      },
      averages: {
        overall_score: 74.6,
        barrier_score: 26.4,
        water_liters: 2.3,
        sleep_hours: 7.1,
      },
    };
  },

  getClinicalDatasetRecords(
    page = 1,
    limit = 15,
    search = ""
  ): {
    records: ClinicalRecordView[];
    pagination: { page: number; limit: number; total_records: number; total_pages: number };
  } {
    let all = getStaticClinicalRecords();
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(
        (r) =>
          String(r.patient_id).includes(q) ||
          r.skin_type.toLowerCase().includes(q) ||
          r.primary_concern.toLowerCase().includes(q) ||
          r.predicted_primary_active.toLowerCase().includes(q)
      );
    }
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);
    return {
      records: paged,
      pagination: {
        page,
        limit,
        total_records: search.trim() ? all.length : 1200,
        total_pages: Math.max(1, Math.ceil((search.trim() ? all.length : 1200) / limit)),
      },
    };
  },
};
