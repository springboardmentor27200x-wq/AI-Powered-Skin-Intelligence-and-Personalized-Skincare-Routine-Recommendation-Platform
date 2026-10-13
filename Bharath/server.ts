import express, { Request, Response, NextFunction } from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, Db, Collection } from "mongodb";
import { createServer as createViteServer } from "vite";
import { generateSkinAssessment } from "./src/services/skinAssessmentService";
import { generateSkincareRoutine } from "./src/services/routineGeneratorService";
import { predictSkinAssessment } from "./src/services/predictiveModelService";
import { generatePredictiveSkincareRoutine } from "./src/services/predictiveRoutineService";
import {
  initializeClinicalExcelDataset,
  getClinicalDatasetStats,
  getExcelDatasetBuffer,
  getCsvDatasetString,
  getPaginatedDatasetRecords,
} from "./src/services/clinicalDatasetService";
import { CLINICAL_PRODUCT_CATALOG } from "./src/services/productData";
import { CLINICAL_INGREDIENTS_DATABASE } from "./src/services/ingredientData";
import {
  analyzeCustomIngredientList,
  findIngredientInDatabase,
  parseInciText,
} from "./src/services/ingredientIntelligenceService";
import { generatePersonalizedRecommendations } from "./src/services/productRecommendationEngine";
import {
  evaluateRoutineSafetyAndConflicts,
  calculateAdherenceStats,
} from "./src/services/routineShelfService";
import {
  SkinAssessment,
  SkincareRoutine,
  PrioritizedConcern,
  RiskFactor,
  RoutineStep,
  WeeklyTreatment,
  PredictionMetadata,
  Product,
  Ingredient,
  UserShelfItem,
  DailyRoutineLog,
  AdherenceStreakSummary,
  DermatologyConsultation,
} from "./src/types";

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "ai_skincare_planner_jwt_secret_2026_m1_token";
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || "mongodb://localhost:27017/skincare_db";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "skincare_db";

// TypeScript Interfaces for MongoDB Documents & Entities
export type UserRole = "USER" | "DERMATOLOGIST" | "ADMIN";

export interface UserEntity {
  _id?: any;
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SkinProfileEntity {
  _id?: any;
  id: number;
  user_id: number;
  skin_type: string;
  age_group: string;
  skin_concerns: string[];
  allergies: string[];
  sensitivities: string[];
  created_at: string;
  updated_at: string;
}

export interface LifestyleEntity {
  _id?: any;
  id: number;
  user_id: number;
  lifestyle_habits: string[] | string;
  water_intake: number;
  environmental_exposure: string;
  recorded_at: string;
}

export interface SleepEntity {
  _id?: any;
  id: number;
  user_id: number;
  sleep_hours: number;
  sleep_quality: string;
  recorded_at: string;
}

export interface SkinAssessmentEntity extends SkinAssessment {
  _id?: any;
}

export interface SkincareRoutineEntity extends SkincareRoutine {
  _id?: any;
}

export interface ProductEntity extends Product {
  _id?: any;
}

export interface IngredientEntity extends Ingredient {
  _id?: any;
}

export interface UserShelfEntity extends UserShelfItem {
  _id?: any;
}

export interface DailyRoutineLogEntity extends DailyRoutineLog {
  _id?: any;
}

export interface ConsultationEntity extends DermatologyConsultation {
  _id?: any;
}

// Initial Seed Data
const defaultPasswordHash = bcrypt.hashSync("password123", 10);

const initialSeedUsers: UserEntity[] = [
  {
    id: 1,
    name: "Sarah Jenkins",
    email: "user@example.com",
    password_hash: defaultPasswordHash,
    role: "USER",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 2,
    name: "System Admin",
    email: "admin@example.com",
    password_hash: defaultPasswordHash,
    role: "ADMIN",
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 3,
    name: "Dr. Clara Chen",
    email: "derm@example.com",
    password_hash: defaultPasswordHash,
    role: "DERMATOLOGIST",
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

const initialSeedSkinProfiles: SkinProfileEntity[] = [
  {
    id: 1,
    user_id: 1,
    skin_type: "Combination",
    age_group: "25-34",
    skin_concerns: ["Acne", "Hyperpigmentation", "Uneven Texture"],
    allergies: ["Synthetic Fragrance", "Lanolin"],
    sensitivities: ["High-strength Glycolic Acid", "Direct Sun"],
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const initialSeedLifestyleRecords: LifestyleEntity[] = [
  {
    id: 1,
    user_id: 1,
    lifestyle_habits: ["Mediterranean diet", "Moderate stress (Work)", "Regular SPF 50 application", "Gym 3x/week"],
    water_intake: 2.8,
    environmental_exposure: "Urban air pollution & Air-conditioned office",
    recorded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    lifestyle_habits: ["High caffeine intake", "Late night screen exposure"],
    water_intake: 1.9,
    environmental_exposure: "High UV outdoor exposure (Beach day)",
    recorded_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    lifestyle_habits: ["Balanced whole foods", "Low stress", "Daily walk"],
    water_intake: 3.0,
    environmental_exposure: "Moderate indoor environment",
    recorded_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const initialSeedSleepRecords: SleepEntity[] = [
  {
    id: 1,
    user_id: 1,
    sleep_hours: 7.8,
    sleep_quality: "Good",
    recorded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    sleep_hours: 6.2,
    sleep_quality: "Fair",
    recorded_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    sleep_hours: 8.5,
    sleep_quality: "Deep",
    recorded_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

// Pre-computed Seed Assessment & Routine for User 1 using Predictive Model
const initialSeedAssessment: SkinAssessmentEntity = predictSkinAssessment({
  userId: 1,
  profile: initialSeedSkinProfiles[0],
  lifestyleRecords: initialSeedLifestyleRecords,
  sleepRecords: initialSeedSleepRecords,
  assessmentId: 1,
});

const initialSeedRoutine: SkincareRoutineEntity = generatePredictiveSkincareRoutine({
  userId: 1,
  profile: initialSeedSkinProfiles[0],
  assessment: initialSeedAssessment,
  routineId: 1,
});

// Milestone 3 Seed Data: Shelf & Routine Tracking
const initialSeedShelf: UserShelfEntity[] = [
  {
    id: 1,
    user_id: 1,
    product_id: 101,
    product: CLINICAL_PRODUCT_CATALOG.find((p) => p.id === 101)!,
    assigned_slots: ["AM_1"],
    status: "Active",
    user_rating: 5,
    opened_date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
    notes: "Ultra gentle morning lipid wash. Leaves skin bouncy without tightness.",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    product_id: 301,
    product: CLINICAL_PRODUCT_CATALOG.find((p) => p.id === 301)!,
    assigned_slots: ["AM_2"],
    status: "Active",
    user_rating: 5,
    opened_date: new Date(Date.now() - 8 * 86400000).toISOString().split("T")[0],
    notes: "Niacinamide + Zinc. Regulates midday T-zone shine and clarifies pores.",
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    product_id: 501,
    product: CLINICAL_PRODUCT_CATALOG.find((p) => p.id === 501)!,
    assigned_slots: ["AM_4"],
    status: "Active",
    user_rating: 5,
    opened_date: new Date(Date.now() - 12 * 86400000).toISOString().split("T")[0],
    notes: "Mineral SPF 50+. Zero eye irritation or white residue.",
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 4,
    user_id: 1,
    product_id: 401,
    product: CLINICAL_PRODUCT_CATALOG.find((p) => p.id === 401)!,
    assigned_slots: ["PM_3"],
    status: "Active",
    user_rating: 5,
    opened_date: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
    notes: "Ceramide barrier cream. Deep restorative comfort at bedtime.",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

const initialSeedRoutineLogs: DailyRoutineLogEntity[] = [
  {
    id: 1,
    user_id: 1,
    date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
    am_completed: true,
    pm_completed: true,
    products_used_am: [101, 301, 501],
    products_used_pm: [101, 401],
    skin_reaction: "Calm & Radiant",
    reaction_notes: "Skin felt exceptionally hydrated and comfortable all day.",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    am_completed: true,
    pm_completed: true,
    products_used_am: [101, 301, 501],
    products_used_pm: [101, 401],
    skin_reaction: "Hydrated & Normal",
    reaction_notes: "Zero redness or stinging noticed.",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    am_completed: true,
    pm_completed: true,
    products_used_am: [101, 301, 501],
    products_used_pm: [101, 401],
    skin_reaction: "Calm & Radiant",
    reaction_notes: "Morning glow is visible, texture feels smoother.",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 4,
    user_id: 1,
    date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
    am_completed: true,
    pm_completed: true,
    products_used_am: [101, 301, 501],
    products_used_pm: [101, 401],
    skin_reaction: "Calm & Radiant",
    reaction_notes: "Consistency streak is paying off. No irritation.",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 5,
    user_id: 1,
    date: new Date().toISOString().split("T")[0],
    am_completed: true,
    pm_completed: false,
    products_used_am: [101, 301, 501],
    products_used_pm: [],
    skin_reaction: "Calm & Radiant",
    reaction_notes: "AM routine applied smoothly with sunscreen shield.",
    created_at: new Date().toISOString(),
  },
];

const initialSeedConsultations: ConsultationEntity[] = [
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
    current_routine_notes: "AM: Amino Cleanser, Niacinamide 10%, SPF 50+. PM: Amino Cleanser, BHA 2%, Ceramide Cream.",
    urgency: "Moderate",
    status: "Pending",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 2,
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
    dermatologist_id: 3,
    dermatologist_name: "Dr. Clara Chen",
    clinical_response:
      "For post-inflammatory hyperpigmentation (PIH) in combination, acne-prone skin, introduce Azelaic Acid 10% or Tranexamic Acid 5% + Alpha Arbutin 2% in your PM Step 2 slot. Both inhibit abnormal melanocyte transfer without pore congestion. Continue strict SPF 50+ each morning.",
    recommended_actives: ["Azelaic Acid", "Tranexamic Acid", "Niacinamide"],
    recommended_product_id: 302,
    recommended_product_name: "Azelaic Acid 10% Clarifying & Anti-Redness Suspension",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    solved_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// Fallback in-memory state in case MongoDB instance is connecting or unavailable
let inMemUsers: UserEntity[] = JSON.parse(JSON.stringify(initialSeedUsers));
let inMemSkinProfiles: SkinProfileEntity[] = JSON.parse(JSON.stringify(initialSeedSkinProfiles));
let inMemLifestyleRecords: LifestyleEntity[] = JSON.parse(JSON.stringify(initialSeedLifestyleRecords));
let inMemSleepRecords: SleepEntity[] = JSON.parse(JSON.stringify(initialSeedSleepRecords));
let inMemAssessments: SkinAssessmentEntity[] = [JSON.parse(JSON.stringify(initialSeedAssessment))];
let inMemRoutines: SkincareRoutineEntity[] = [JSON.parse(JSON.stringify(initialSeedRoutine))];
let inMemProducts: ProductEntity[] = JSON.parse(JSON.stringify(CLINICAL_PRODUCT_CATALOG));
let inMemIngredients: IngredientEntity[] = JSON.parse(JSON.stringify(CLINICAL_INGREDIENTS_DATABASE));
let inMemShelf: UserShelfEntity[] = JSON.parse(JSON.stringify(initialSeedShelf));
let inMemRoutineLogs: DailyRoutineLogEntity[] = JSON.parse(JSON.stringify(initialSeedRoutineLogs));
let inMemConsultations: ConsultationEntity[] = JSON.parse(JSON.stringify(initialSeedConsultations));

let nextUserId = 5;
let nextProfileId = 2;
let nextLifestyleId = 4;
let nextSleepId = 4;
let nextAssessmentId = 2;
let nextRoutineId = 2;
let nextShelfId = 5;
let nextRoutineLogId = 6;
let nextProductId = 801;
let nextConsultationId = 3;

// MongoDB Connection & Data Access Layer
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isMongoConnected = false;

async function initMongoDB(): Promise<boolean> {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    await client.connect();
    mongoClient = client;
    mongoDb = client.db(MONGODB_DB_NAME);
    isMongoConnected = true;

    console.log(`[MongoDB] Successfully connected to database: ${MONGODB_DB_NAME}`);

    // Create Indexes
    const usersCol = mongoDb.collection<UserEntity>("users");
    const skinProfilesCol = mongoDb.collection<SkinProfileEntity>("skin_profiles");
    const lifestyleCol = mongoDb.collection<LifestyleEntity>("lifestyle_records");
    const sleepCol = mongoDb.collection<SleepEntity>("sleep_records");
    const assessmentsCol = mongoDb.collection<SkinAssessmentEntity>("skin_assessments");
    const routinesCol = mongoDb.collection<SkincareRoutineEntity>("skincare_routines");
    const productsCol = mongoDb.collection<ProductEntity>("products");
    const ingredientsCol = mongoDb.collection<IngredientEntity>("ingredients");
    const shelvesCol = mongoDb.collection<UserShelfEntity>("user_shelves");
    const routineLogsCol = mongoDb.collection<DailyRoutineLogEntity>("routine_logs");

    await usersCol.createIndex({ email: 1 }, { unique: true });
    await usersCol.createIndex({ id: 1 }, { unique: true });
    await skinProfilesCol.createIndex({ user_id: 1 }, { unique: true });
    await lifestyleCol.createIndex({ user_id: 1 });
    await sleepCol.createIndex({ user_id: 1 });
    await assessmentsCol.createIndex({ user_id: 1 });
    await assessmentsCol.createIndex({ id: 1 }, { unique: true });
    await assessmentsCol.createIndex({ created_at: -1 });
    await routinesCol.createIndex({ user_id: 1 });
    await routinesCol.createIndex({ id: 1 }, { unique: true });
    await routinesCol.createIndex({ assessment_id: 1 });
    await routinesCol.createIndex({ created_at: -1 });
    await productsCol.createIndex({ id: 1 }, { unique: true });
    await productsCol.createIndex({ category: 1 });
    await ingredientsCol.createIndex({ id: 1 }, { unique: true });
    await ingredientsCol.createIndex({ category: 1 });
    await shelvesCol.createIndex({ user_id: 1 });
    await shelvesCol.createIndex({ id: 1 }, { unique: true });
    await routineLogsCol.createIndex({ user_id: 1 });
    await routineLogsCol.createIndex({ date: -1 });

    // Seed users if empty
    const userCount = await usersCol.countDocuments();
    if (userCount === 0) {
      console.log("[MongoDB] Seeding initial users and records into collections...");
      await usersCol.insertMany(JSON.parse(JSON.stringify(initialSeedUsers)));
      await skinProfilesCol.insertMany(JSON.parse(JSON.stringify(initialSeedSkinProfiles)));
      await lifestyleCol.insertMany(JSON.parse(JSON.stringify(initialSeedLifestyleRecords)));
      await sleepCol.insertMany(JSON.parse(JSON.stringify(initialSeedSleepRecords)));
      await assessmentsCol.insertMany([JSON.parse(JSON.stringify(initialSeedAssessment))]);
      await routinesCol.insertMany([JSON.parse(JSON.stringify(initialSeedRoutine))]);
      await productsCol.insertMany(JSON.parse(JSON.stringify(CLINICAL_PRODUCT_CATALOG)));
      await ingredientsCol.insertMany(JSON.parse(JSON.stringify(CLINICAL_INGREDIENTS_DATABASE)));
      await shelvesCol.insertMany(JSON.parse(JSON.stringify(initialSeedShelf)));
      await routineLogsCol.insertMany(JSON.parse(JSON.stringify(initialSeedRoutineLogs)));
    }

    return true;
  } catch (err: any) {
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB server at ${MONGODB_URI.split("@").pop()}: ${err.message}. Using high-performance document store.`);
    isMongoConnected = false;
    return false;
  }
}

// Database Repository Methods
const dbRepo = {
  async findUserById(id: number): Promise<UserEntity | null> {
    if (isMongoConnected && mongoDb) {
      return mongoDb.collection<UserEntity>("users").findOne({ id });
    }
    return inMemUsers.find((u) => u.id === id) || null;
  },

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase().trim();
    if (isMongoConnected && mongoDb) {
      return mongoDb.collection<UserEntity>("users").findOne({ email: normalized });
    }
    return inMemUsers.find((u) => u.email === normalized) || null;
  },

  async createUser(user: Omit<UserEntity, "_id">): Promise<UserEntity> {
    if (isMongoConnected && mongoDb) {
      const result = await mongoDb.collection<UserEntity>("users").insertOne(user as any);
      return { ...user, _id: result.insertedId };
    }
    inMemUsers.push(user);
    return user;
  },

  async updateUser(id: number, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection<UserEntity>("users").updateOne({ id }, { $set: updates });
      return mongoDb.collection<UserEntity>("users").findOne({ id });
    }
    const user = inMemUsers.find((u) => u.id === id);
    if (user) {
      Object.assign(user, updates);
      return user;
    }
    return null;
  },

  async getSkinProfile(userId: number): Promise<SkinProfileEntity | null> {
    if (isMongoConnected && mongoDb) {
      return mongoDb.collection<SkinProfileEntity>("skin_profiles").findOne({ user_id: userId });
    }
    return inMemSkinProfiles.find((p) => p.user_id === userId) || null;
  },

  async saveSkinProfile(profile: SkinProfileEntity): Promise<SkinProfileEntity> {
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection<SkinProfileEntity>("skin_profiles").replaceOne(
        { user_id: profile.user_id },
        profile,
        { upsert: true }
      );
      return profile;
    }
    const idx = inMemSkinProfiles.findIndex((p) => p.user_id === profile.user_id);
    if (idx >= 0) {
      inMemSkinProfiles[idx] = profile;
    } else {
      inMemSkinProfiles.push(profile);
    }
    return profile;
  },

  async getLifestyleRecords(userId: number): Promise<LifestyleEntity[]> {
    if (isMongoConnected && mongoDb) {
      return mongoDb
        .collection<LifestyleEntity>("lifestyle_records")
        .find({ user_id: userId })
        .sort({ recorded_at: -1 })
        .toArray();
    }
    return inMemLifestyleRecords
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  },

  async createLifestyleRecord(record: LifestyleEntity): Promise<LifestyleEntity> {
    if (isMongoConnected && mongoDb) {
      const result = await mongoDb.collection<LifestyleEntity>("lifestyle_records").insertOne(record as any);
      return { ...record, _id: result.insertedId };
    }
    inMemLifestyleRecords.push(record);
    return record;
  },

  async updateLifestyleRecord(id: number, userId: number, updates: Partial<LifestyleEntity>): Promise<LifestyleEntity | null> {
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection<LifestyleEntity>("lifestyle_records").updateOne({ id, user_id: userId }, { $set: updates });
      return mongoDb.collection<LifestyleEntity>("lifestyle_records").findOne({ id, user_id: userId });
    }
    const record = inMemLifestyleRecords.find((r) => r.id === id && r.user_id === userId);
    if (record) {
      Object.assign(record, updates);
      return record;
    }
    return null;
  },

  async deleteLifestyleRecord(id: number, userId: number): Promise<boolean> {
    if (isMongoConnected && mongoDb) {
      const res = await mongoDb.collection<LifestyleEntity>("lifestyle_records").deleteOne({ id, user_id: userId });
      return res.deletedCount > 0;
    }
    const idx = inMemLifestyleRecords.findIndex((r) => r.id === id && r.user_id === userId);
    if (idx >= 0) {
      inMemLifestyleRecords.splice(idx, 1);
      return true;
    }
    return false;
  },

  async getSleepRecords(userId: number): Promise<SleepEntity[]> {
    if (isMongoConnected && mongoDb) {
      return mongoDb
        .collection<SleepEntity>("sleep_records")
        .find({ user_id: userId })
        .sort({ recorded_at: -1 })
        .toArray();
    }
    return inMemSleepRecords
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  },

  async createSleepRecord(record: SleepEntity): Promise<SleepEntity> {
    if (isMongoConnected && mongoDb) {
      const result = await mongoDb.collection<SleepEntity>("sleep_records").insertOne(record as any);
      return { ...record, _id: result.insertedId };
    }
    inMemSleepRecords.push(record);
    return record;
  },

  async updateSleepRecord(id: number, userId: number, updates: Partial<SleepEntity>): Promise<SleepEntity | null> {
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection<SleepEntity>("sleep_records").updateOne({ id, user_id: userId }, { $set: updates });
      return mongoDb.collection<SleepEntity>("sleep_records").findOne({ id, user_id: userId });
    }
    const record = inMemSleepRecords.find((r) => r.id === id && r.user_id === userId);
    if (record) {
      Object.assign(record, updates);
      return record;
    }
    return null;
  },

  async deleteSleepRecord(id: number, userId: number): Promise<boolean> {
    if (isMongoConnected && mongoDb) {
      const res = await mongoDb.collection<SleepEntity>("sleep_records").deleteOne({ id, user_id: userId });
      return res.deletedCount > 0;
    }
    const idx = inMemSleepRecords.findIndex((r) => r.id === id && r.user_id === userId);
    if (idx >= 0) {
      inMemSleepRecords.splice(idx, 1);
      return true;
    }
    return false;
  },

  // Milestone 2 Repository Methods: Assessments & Routines
  async getLatestAssessment(userId: number): Promise<SkinAssessmentEntity | null> {
    if (isMongoConnected && mongoDb) {
      return mongoDb
        .collection<SkinAssessmentEntity>("skin_assessments")
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(1)
        .next();
    }
    const userAssessments = inMemAssessments
      .filter((a) => a.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return userAssessments[0] || null;
  },

  async saveAssessment(assessment: SkinAssessmentEntity): Promise<SkinAssessmentEntity> {
    if (isMongoConnected && mongoDb) {
      const result = await mongoDb.collection<SkinAssessmentEntity>("skin_assessments").insertOne(assessment as any);
      return { ...assessment, _id: result.insertedId };
    }
    inMemAssessments.unshift(assessment);
    return assessment;
  },

  async getLatestRoutine(userId: number): Promise<SkincareRoutineEntity | null> {
    if (isMongoConnected && mongoDb) {
      return mongoDb
        .collection<SkincareRoutineEntity>("skincare_routines")
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(1)
        .next();
    }
    const userRoutines = inMemRoutines
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return userRoutines[0] || null;
  },

  async saveRoutine(routine: SkincareRoutineEntity): Promise<SkincareRoutineEntity> {
    if (isMongoConnected && mongoDb) {
      const result = await mongoDb.collection<SkincareRoutineEntity>("skincare_routines").insertOne(routine as any);
      return { ...routine, _id: result.insertedId };
    }
    inMemRoutines.unshift(routine);
    return routine;
  },

  // Milestone 3 Repository Methods: Products, Ingredients, Shelf, Routine Logs
  async getAllProducts(filters?: {
    category?: string;
    skin_type?: string;
    concern?: string;
    search?: string;
  }): Promise<ProductEntity[]> {
    let results: ProductEntity[] = [];
    if (isMongoConnected && mongoDb) {
      const query: any = {};
      if (filters?.category) query.category = filters.category;
      if (filters?.skin_type) query.skin_types = { $in: [filters.skin_type, "All"] };
      if (filters?.concern) query.target_concerns = { $regex: filters.concern, $options: "i" };
      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: "i" } },
          { brand: { $regex: filters.search, $options: "i" } },
          { description: { $regex: filters.search, $options: "i" } },
          { key_actives: { $in: [new RegExp(filters.search, "i")] } },
        ];
      }
      results = await mongoDb.collection<ProductEntity>("products").find(query).toArray();
    } else {
      results = inMemProducts.filter((p) => {
        if (filters?.category && p.category !== filters.category) return false;
        if (filters?.skin_type && !p.skin_types.includes("All") && !p.skin_types.includes(filters.skin_type)) return false;
        if (filters?.concern && !p.target_concerns.some((c) => c.toLowerCase().includes(filters.concern!.toLowerCase()))) return false;
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          const match =
            p.name.toLowerCase().includes(s) ||
            p.brand.toLowerCase().includes(s) ||
            p.description.toLowerCase().includes(s) ||
            p.key_actives.some((a) => a.toLowerCase().includes(s));
          if (!match) return false;
        }
        return true;
      });
    }
    return results;
  },

  async getProductById(id: number): Promise<ProductEntity | null> {
    if (isMongoConnected && mongoDb) {
      return mongoDb.collection<ProductEntity>("products").findOne({ id });
    }
    return inMemProducts.find((p) => p.id === id) || null;
  },

  async createProduct(product: ProductEntity): Promise<ProductEntity> {
    if (isMongoConnected && mongoDb) {
      const res = await mongoDb.collection<ProductEntity>("products").insertOne(product as any);
      return { ...product, _id: res.insertedId };
    }
    inMemProducts.unshift(product);
    return product;
  },

  async getConsultations(userId?: number): Promise<ConsultationEntity[]> {
    if (isMongoConnected && mongoDb) {
      const query = userId ? { user_id: userId } : {};
      return mongoDb.collection<ConsultationEntity>("consultations").find(query).sort({ created_at: -1 }).toArray();
    }
    const list = userId ? inMemConsultations.filter((c) => c.user_id === userId) : [...inMemConsultations];
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createConsultation(consultation: ConsultationEntity): Promise<ConsultationEntity> {
    if (isMongoConnected && mongoDb) {
      const res = await mongoDb.collection<ConsultationEntity>("consultations").insertOne(consultation as any);
      return { ...consultation, _id: res.insertedId };
    }
    inMemConsultations.unshift(consultation);
    return consultation;
  },

  async solveConsultation(
    id: number,
    updates: {
      dermatologist_id: number;
      dermatologist_name: string;
      clinical_response: string;
      recommended_actives?: string[];
      recommended_product_id?: number;
      recommended_product_name?: string;
    }
  ): Promise<ConsultationEntity | null> {
    const solvedAt = new Date().toISOString();
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection<ConsultationEntity>("consultations").updateOne(
        { id },
        {
          $set: {
            ...updates,
            status: "Solved",
            solved_at: solvedAt,
          },
        }
      );
      return mongoDb.collection<ConsultationEntity>("consultations").findOne({ id });
    }
    const item = inMemConsultations.find((c) => c.id === id);
    if (!item) return null;
    Object.assign(item, {
      ...updates,
      status: "Solved",
      solved_at: solvedAt,
    });
    return item;
  },

  async getAllIngredients(filters?: {
    category?: string;
    comedogenic?: number;
    search?: string;
  }): Promise<IngredientEntity[]> {
    let results: IngredientEntity[] = [];
    if (isMongoConnected && mongoDb) {
      const query: any = {};
      if (filters?.category) query.category = filters.category;
      if (filters?.comedogenic !== undefined) query.comedogenic_rating = { $lte: filters.comedogenic };
      if (filters?.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: "i" } },
          { inci_name: { $regex: filters.search, $options: "i" } },
          { common_names: { $in: [new RegExp(filters.search, "i")] } },
          { function: { $regex: filters.search, $options: "i" } },
        ];
      }
      results = await mongoDb.collection<IngredientEntity>("ingredients").find(query).toArray();
    } else {
      results = inMemIngredients.filter((ing) => {
        if (filters?.category && ing.category !== filters.category) return false;
        if (filters?.comedogenic !== undefined && ing.comedogenic_rating > filters.comedogenic) return false;
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          const match =
            ing.name.toLowerCase().includes(s) ||
            ing.inci_name.toLowerCase().includes(s) ||
            ing.function.toLowerCase().includes(s) ||
            ing.common_names.some((cn) => cn.toLowerCase().includes(s));
          if (!match) return false;
        }
        return true;
      });
    }
    return results;
  },

  async getIngredientById(id: number): Promise<IngredientEntity | null> {
    if (isMongoConnected && mongoDb) {
      return mongoDb.collection<IngredientEntity>("ingredients").findOne({ id });
    }
    return inMemIngredients.find((ing) => ing.id === id) || null;
  },

  async getUserShelf(userId: number): Promise<UserShelfEntity[]> {
    if (isMongoConnected && mongoDb) {
      return mongoDb.collection<UserShelfEntity>("user_shelves").find({ user_id: userId }).sort({ created_at: -1 }).toArray();
    }
    return inMemShelf.filter((s) => s.user_id === userId);
  },

  async addToShelf(item: UserShelfEntity): Promise<UserShelfEntity> {
    if (isMongoConnected && mongoDb) {
      const res = await mongoDb.collection<UserShelfEntity>("user_shelves").insertOne(item as any);
      return { ...item, _id: res.insertedId };
    }
    inMemShelf.unshift(item);
    return item;
  },

  async updateShelfItem(id: number, userId: number, updates: Partial<UserShelfEntity>): Promise<UserShelfEntity | null> {
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection<UserShelfEntity>("user_shelves").updateOne({ id, user_id: userId }, { $set: updates });
      return mongoDb.collection<UserShelfEntity>("user_shelves").findOne({ id, user_id: userId });
    }
    const item = inMemShelf.find((s) => s.id === id && s.user_id === userId);
    if (item) {
      Object.assign(item, updates);
      return item;
    }
    return null;
  },

  async deleteShelfItem(id: number, userId: number): Promise<boolean> {
    if (isMongoConnected && mongoDb) {
      const res = await mongoDb.collection<UserShelfEntity>("user_shelves").deleteOne({ id, user_id: userId });
      return res.deletedCount > 0;
    }
    const idx = inMemShelf.findIndex((s) => s.id === id && s.user_id === userId);
    if (idx >= 0) {
      inMemShelf.splice(idx, 1);
      return true;
    }
    return false;
  },

  async getUserRoutineLogs(userId: number): Promise<DailyRoutineLogEntity[]> {
    if (isMongoConnected && mongoDb) {
      return mongoDb.collection<DailyRoutineLogEntity>("routine_logs").find({ user_id: userId }).sort({ date: -1 }).toArray();
    }
    return inMemRoutineLogs.filter((l) => l.user_id === userId).sort((a, b) => b.date.localeCompare(a.date));
  },

  async saveRoutineLog(log: DailyRoutineLogEntity): Promise<DailyRoutineLogEntity> {
    if (isMongoConnected && mongoDb) {
      // Upsert by user_id and date
      await mongoDb.collection<DailyRoutineLogEntity>("routine_logs").updateOne(
        { user_id: log.user_id, date: log.date },
        { $set: log },
        { upsert: true }
      );
      return log;
    }
    const existingIdx = inMemRoutineLogs.findIndex((l) => l.user_id === log.user_id && l.date === log.date);
    if (existingIdx >= 0) {
      inMemRoutineLogs[existingIdx] = log;
    } else {
      inMemRoutineLogs.unshift(log);
    }
    return log;
  },

  async getDatabaseStats() {
    let usersCount = inMemUsers.length;
    let skinProfilesCount = inMemSkinProfiles.length;
    let lifestyleCount = inMemLifestyleRecords.length;
    let sleepCount = inMemSleepRecords.length;
    let assessmentsCount = inMemAssessments.length;
    let routinesCount = inMemRoutines.length;
    let productsCount = inMemProducts.length;
    let ingredientsCount = inMemIngredients.length;
    let shelvesCount = inMemShelf.length;
    let routineLogsCount = inMemRoutineLogs.length;

    if (isMongoConnected && mongoDb) {
      try {
        usersCount = await mongoDb.collection<UserEntity>("users").countDocuments();
        skinProfilesCount = await mongoDb.collection<SkinProfileEntity>("skin_profiles").countDocuments();
        lifestyleCount = await mongoDb.collection<LifestyleEntity>("lifestyle_records").countDocuments();
        sleepCount = await mongoDb.collection<SleepEntity>("sleep_records").countDocuments();
        assessmentsCount = await mongoDb.collection<SkinAssessmentEntity>("skin_assessments").countDocuments();
        routinesCount = await mongoDb.collection<SkincareRoutineEntity>("skincare_routines").countDocuments();
        productsCount = await mongoDb.collection<ProductEntity>("products").countDocuments();
        ingredientsCount = await mongoDb.collection<IngredientEntity>("ingredients").countDocuments();
        shelvesCount = await mongoDb.collection<UserShelfEntity>("user_shelves").countDocuments();
        routineLogsCount = await mongoDb.collection<DailyRoutineLogEntity>("routine_logs").countDocuments();
      } catch (err: any) {
        console.warn("[MongoDB] Error fetching counts:", err.message);
      }
    }

    return {
      engine: "MongoDB",
      dbName: MONGODB_DB_NAME,
      isConnected: isMongoConnected,
      uri: MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@"),
      status: isMongoConnected ? "Connected (Live MongoDB Driver)" : "Active (In-Memory Document Engine)",
      totalDocuments:
        usersCount +
        skinProfilesCount +
        lifestyleCount +
        sleepCount +
        assessmentsCount +
        routinesCount +
        productsCount +
        ingredientsCount +
        shelvesCount +
        routineLogsCount,
      collections: [
        {
          name: "users",
          count: usersCount,
          description: "User authentication documents & RBAC roles",
          indexes: ["_id (Primary)", "email (Unique)", "id (Unique)"],
        },
        {
          name: "skin_profiles",
          count: skinProfilesCount,
          description: "1-to-1 skin configuration, skin type, concerns & sensitivities",
          indexes: ["_id (Primary)", "user_id (Unique)"],
        },
        {
          name: "lifestyle_records",
          count: lifestyleCount,
          description: "Daily habits, water hydration in liters & environmental exposure logs",
          indexes: ["_id (Primary)", "user_id"],
        },
        {
          name: "sleep_records",
          count: sleepCount,
          description: "Time-series nightly sleep duration and quality logs",
          indexes: ["_id (Primary)", "user_id"],
        },
        {
          name: "skin_assessments",
          count: assessmentsCount,
          description: "Calculated skin health scores (0-100), prioritized concerns & risk factors",
          indexes: ["_id (Primary)", "user_id", "id (Unique)", "created_at (Desc)"],
        },
        {
          name: "skincare_routines",
          count: routinesCount,
          description: "Personalized AM/PM routines, weekly plans & allergen-filtered steps",
          indexes: ["_id (Primary)", "user_id", "assessment_id", "created_at (Desc)"],
        },
        {
          name: "products",
          count: productsCount,
          description: "Curated skincare catalog with complete INCI ingredients and safety ratings",
          indexes: ["_id (Primary)", "id (Unique)", "category"],
        },
        {
          name: "ingredients",
          count: ingredientsCount,
          description: "Dermatological active knowledge base with contraindication & synergy matrices",
          indexes: ["_id (Primary)", "id (Unique)", "category"],
        },
        {
          name: "user_shelves",
          count: shelvesCount,
          description: "User saved products mapped to AM/PM routine slots with opening dates",
          indexes: ["_id (Primary)", "user_id", "id (Unique)"],
        },
        {
          name: "routine_logs",
          count: routineLogsCount,
          description: "Daily routine completion checklists, skin reaction logs & adherence streaks",
          indexes: ["_id (Primary)", "user_id", "date (Desc)"],
        },
      ],
      timestamp: new Date().toISOString(),
    };
  },

  async reseedDefaultData() {
    inMemUsers = JSON.parse(JSON.stringify(initialSeedUsers));
    inMemSkinProfiles = JSON.parse(JSON.stringify(initialSeedSkinProfiles));
    inMemLifestyleRecords = JSON.parse(JSON.stringify(initialSeedLifestyleRecords));
    inMemSleepRecords = JSON.parse(JSON.stringify(initialSeedSleepRecords));
    inMemAssessments = [JSON.parse(JSON.stringify(initialSeedAssessment))];
    inMemRoutines = [JSON.parse(JSON.stringify(initialSeedRoutine))];
    inMemProducts = JSON.parse(JSON.stringify(CLINICAL_PRODUCT_CATALOG));
    inMemIngredients = JSON.parse(JSON.stringify(CLINICAL_INGREDIENTS_DATABASE));
    inMemShelf = JSON.parse(JSON.stringify(initialSeedShelf));
    inMemRoutineLogs = JSON.parse(JSON.stringify(initialSeedRoutineLogs));

    if (isMongoConnected && mongoDb) {
      try {
        const usersCol = mongoDb.collection<UserEntity>("users");
        const skinCol = mongoDb.collection<SkinProfileEntity>("skin_profiles");
        const lifeCol = mongoDb.collection<LifestyleEntity>("lifestyle_records");
        const sleepCol = mongoDb.collection<SleepEntity>("sleep_records");
        const assessCol = mongoDb.collection<SkinAssessmentEntity>("skin_assessments");
        const routineCol = mongoDb.collection<SkincareRoutineEntity>("skincare_routines");
        const productsCol = mongoDb.collection<ProductEntity>("products");
        const ingredientsCol = mongoDb.collection<IngredientEntity>("ingredients");
        const shelvesCol = mongoDb.collection<UserShelfEntity>("user_shelves");
        const routineLogsCol = mongoDb.collection<DailyRoutineLogEntity>("routine_logs");

        await usersCol.deleteMany({});
        await skinCol.deleteMany({});
        await lifeCol.deleteMany({});
        await sleepCol.deleteMany({});
        await assessCol.deleteMany({});
        await routineCol.deleteMany({});
        await productsCol.deleteMany({});
        await ingredientsCol.deleteMany({});
        await shelvesCol.deleteMany({});
        await routineLogsCol.deleteMany({});

        await usersCol.insertMany(JSON.parse(JSON.stringify(initialSeedUsers)));
        await skinCol.insertMany(JSON.parse(JSON.stringify(initialSeedSkinProfiles)));
        await lifeCol.insertMany(JSON.parse(JSON.stringify(initialSeedLifestyleRecords)));
        await sleepCol.insertMany(JSON.parse(JSON.stringify(initialSeedSleepRecords)));
        await assessCol.insertMany([JSON.parse(JSON.stringify(initialSeedAssessment))]);
        await routineCol.insertMany([JSON.parse(JSON.stringify(initialSeedRoutine))]);
        await productsCol.insertMany(JSON.parse(JSON.stringify(CLINICAL_PRODUCT_CATALOG)));
        await ingredientsCol.insertMany(JSON.parse(JSON.stringify(CLINICAL_INGREDIENTS_DATABASE)));
        await shelvesCol.insertMany(JSON.parse(JSON.stringify(initialSeedShelf)));
        await routineLogsCol.insertMany(JSON.parse(JSON.stringify(initialSeedRoutineLogs)));
      } catch (err: any) {
        console.warn("[MongoDB] Error reseeding:", err.message);
      }
    }

    return this.getDatabaseStats();
  },

  // Admin Management Repository Methods
  async getAllUsersWithSummary() {
    let allUsers: UserEntity[] = [];
    if (isMongoConnected && mongoDb) {
      allUsers = await mongoDb.collection<UserEntity>("users").find({}).sort({ created_at: -1 }).toArray();
    } else {
      allUsers = [...inMemUsers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const summaries = await Promise.all(
      allUsers.map(async (u) => {
        const profile = await this.getSkinProfile(u.id);
        const latestAssessment = await this.getLatestAssessment(u.id);
        const latestRoutine = await this.getLatestRoutine(u.id);
        const lifestyle = await this.getLifestyleRecords(u.id);
        const sleep = await this.getSleepRecords(u.id);

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
          has_assessment: !!latestAssessment,
          assessment_score: latestAssessment?.overall_score,
          assessment_category: latestAssessment?.score_category,
          has_routine: !!latestRoutine,
          routine_steps_count: (latestRoutine?.morning_routine?.length || 0) + (latestRoutine?.evening_routine?.length || 0),
          lifestyle_count: lifestyle.length,
          sleep_count: sleep.length,
          latest_lifestyle: lifestyle[0] || null,
          latest_sleep: sleep[0] || null,
        };
      })
    );

    return summaries;
  },

  async getUserFullDetails(userId: number) {
    const user = await this.findUserById(userId);
    if (!user) return null;

    const { password_hash, ...safeUser } = user;
    const skin_profile = await this.getSkinProfile(userId);
    const latest_assessment = await this.getLatestAssessment(userId);
    const latest_routine = await this.getLatestRoutine(userId);
    const lifestyle_records = await this.getLifestyleRecords(userId);
    const sleep_records = await this.getSleepRecords(userId);

    return {
      user: safeUser,
      skin_profile,
      latest_assessment,
      latest_routine,
      lifestyle_records,
      sleep_records,
    };
  },

  async adminDeleteUser(userId: number): Promise<boolean> {
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection<UserEntity>("users").deleteOne({ id: userId });
      await mongoDb.collection<SkinProfileEntity>("skin_profiles").deleteMany({ user_id: userId });
      await mongoDb.collection<LifestyleEntity>("lifestyle_records").deleteMany({ user_id: userId });
      await mongoDb.collection<SleepEntity>("sleep_records").deleteMany({ user_id: userId });
      await mongoDb.collection<SkinAssessmentEntity>("skin_assessments").deleteMany({ user_id: userId });
      await mongoDb.collection<SkincareRoutineEntity>("skincare_routines").deleteMany({ user_id: userId });
      return true;
    }
    const idx = inMemUsers.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      inMemUsers.splice(idx, 1);
      inMemSkinProfiles = inMemSkinProfiles.filter((p) => p.user_id !== userId);
      inMemLifestyleRecords = inMemLifestyleRecords.filter((l) => l.user_id !== userId);
      inMemSleepRecords = inMemSleepRecords.filter((s) => s.user_id !== userId);
      inMemAssessments = inMemAssessments.filter((a) => a.user_id !== userId);
      inMemRoutines = inMemRoutines.filter((r) => r.user_id !== userId);
      return true;
    }
    return false;
  },

  async getAdminStats() {
    let allUsers: UserEntity[] = [];
    let allProfiles: SkinProfileEntity[] = [];
    let allAssessments: SkinAssessmentEntity[] = [];
    let allRoutines: SkincareRoutineEntity[] = [];
    let allLifestyle: LifestyleEntity[] = [];
    let allSleep: SleepEntity[] = [];

    if (isMongoConnected && mongoDb) {
      allUsers = await mongoDb.collection<UserEntity>("users").find({}).toArray();
      allProfiles = await mongoDb.collection<SkinProfileEntity>("skin_profiles").find({}).toArray();
      allAssessments = await mongoDb.collection<SkinAssessmentEntity>("skin_assessments").find({}).toArray();
      allRoutines = await mongoDb.collection<SkincareRoutineEntity>("skincare_routines").find({}).toArray();
      allLifestyle = await mongoDb.collection<LifestyleEntity>("lifestyle_records").find({}).toArray();
      allSleep = await mongoDb.collection<SleepEntity>("sleep_records").find({}).toArray();
    } else {
      allUsers = inMemUsers;
      allProfiles = inMemSkinProfiles;
      allAssessments = inMemAssessments;
      allRoutines = inMemRoutines;
      allLifestyle = inMemLifestyleRecords;
      allSleep = inMemSleepRecords;
    }

    const skinTypeDist: Record<string, number> = {};
    for (const p of allProfiles) {
      const type = p.skin_type || "Unspecified";
      skinTypeDist[type] = (skinTypeDist[type] || 0) + 1;
    }

    return {
      total_users: allUsers.length,
      total_admins: allUsers.filter((u) => u.role === "ADMIN").length,
      total_dermatologists: allUsers.filter((u) => u.role === "DERMATOLOGIST").length,
      total_standard_users: allUsers.filter((u) => u.role === "USER").length,
      total_profiles: allProfiles.length,
      total_assessments: allAssessments.length,
      total_routines: allRoutines.length,
      total_lifestyle_records: allLifestyle.length,
      total_sleep_records: allSleep.length,
      skin_type_distribution: skinTypeDist,
      total_products: isMongoConnected && mongoDb ? await mongoDb.collection("products").countDocuments() : inMemProducts.length,
      total_ingredients: isMongoConnected && mongoDb ? await mongoDb.collection("ingredients").countDocuments() : inMemIngredients.length,
      total_shelf_items: isMongoConnected && mongoDb ? await mongoDb.collection("user_shelves").countDocuments() : inMemShelf.length,
      total_routine_logs: isMongoConnected && mongoDb ? await mongoDb.collection("routine_logs").countDocuments() : inMemRoutineLogs.length,
    };
  },
};

// Express App Setup
async function startServer() {
  const app = express();
  app.use(express.json());

  // Attempt initial connection to MongoDB (async, non-blocking)
  initMongoDB().catch((err) => {
    console.warn("[MongoDB] Setup initialization warning:", err.message);
  });

  // Initialize 1,200+ records Clinical Excel Dataset and ML Engine cache
  try {
    const dataset = initializeClinicalExcelDataset();
    console.log(`[Clinical Dataset] Initialized ${dataset.length} records from Excel for predictive model inference.`);
  } catch (err: any) {
    console.error("[Clinical Dataset] Notice initializing dataset:", err.message);
  }

  // CORS Headers for API requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // JWT Helper
  const generateToken = (user: UserEntity) => {
    return jwt.sign(
      {
        sub: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
  };

  // Auth Middleware
  const authenticateToken = async (req: Request & { user?: UserEntity }, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ detail: "Authentication token missing or invalid." });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded: any) => {
      if (err || !decoded) {
        return res.status(401).json({ detail: "Invalid or expired JWT token." });
      }
      const user = await dbRepo.findUserById(parseInt(decoded.sub, 10));
      if (!user) {
        return res.status(401).json({ detail: "User associated with token not found." });
      }
      req.user = user;
      next();
    });
  };

  // 1. HEALTH & DATABASE ARCHITECTURE
  const handleHealth = (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "SkinIntel - AI Skincare Planner",
      version: "2.0.0",
      milestone: "Milestone 2 - Skin Assessment & Personalized Routine Generation",
      capabilities: {
        authentication: "JWT (HS256)",
        database: "MongoDB (Document Database)",
        collections: ["users", "skin_profiles", "lifestyle_records", "sleep_records", "skin_assessments", "skincare_routines"],
        mongo_connected: isMongoConnected,
        rbac: ["USER", "ADMIN"],
        modules: ["auth", "users", "skin-profile", "lifestyle", "sleep", "skin-assessment", "routine"],
      },
      system_time: new Date().toISOString(),
    });
  };

  app.get("/health", handleHealth);
  app.get("/api/health", handleHealth);

  // MongoDB Database Info & Management Endpoints
  const handleDatabaseStatus = async (req: Request, res: Response) => {
    try {
      const stats = await dbRepo.getDatabaseStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to retrieve database status." });
    }
  };

  const handleDatabaseReseed = async (req: Request, res: Response) => {
    try {
      const stats = await dbRepo.reseedDefaultData();
      res.json({ message: "Database reseeded successfully with default documents.", stats });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to reseed database." });
    }
  };

  app.get("/database/status", handleDatabaseStatus);
  app.get("/api/database/status", handleDatabaseStatus);
  app.get("/api/database/collections", handleDatabaseStatus);
  app.post("/database/reseed", handleDatabaseReseed);
  app.post("/api/database/reseed", handleDatabaseReseed);

  // 2. AUTHENTICATION ROUTER
  const handleRegister = async (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ detail: "Name, email, and password are required." });
      }

      if (password.length < 6) {
        return res.status(400).json({ detail: "Password must be at least 6 characters." });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await dbRepo.findUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ detail: "A user with this email address already exists." });
      }

      const validRoles: UserRole[] = ["USER", "DERMATOLOGIST", "ADMIN"];
      const assignedRole: UserRole = validRoles.includes(role) ? role : "USER";

      const newUser: UserEntity = {
        id: nextUserId++,
        name: name.trim(),
        email: normalizedEmail,
        password_hash: bcrypt.hashSync(password, 10),
        role: assignedRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const created = await dbRepo.createUser(newUser);
      const token = generateToken(created);

      const { password_hash, ...userResponse } = created;
      return res.status(201).json({
        access_token: token,
        token_type: "bearer",
        user: userResponse,
      });
    } catch (err: any) {
      return res.status(500).json({ detail: err.message || "Failed to register user." });
    }
  };

  app.post("/auth/register", handleRegister);
  app.post("/api/auth/register", handleRegister);

  const handleLogin = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ detail: "Email and password are required." });
      }

      const user = await dbRepo.findUserByEmail(email);
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ detail: "Invalid email or password." });
      }

      const token = generateToken(user);
      const { password_hash, ...userResponse } = user;
      return res.json({
        access_token: token,
        token_type: "bearer",
        user: userResponse,
      });
    } catch (err: any) {
      return res.status(500).json({ detail: err.message || "Failed to log in." });
    }
  };

  app.post("/auth/login", handleLogin);
  app.post("/api/auth/login", handleLogin);

  const handleAuthMe = (req: any, res: Response) => {
    const { password_hash, ...userResponse } = req.user;
    res.json(userResponse);
  };

  app.get("/auth/me", authenticateToken, handleAuthMe);
  app.get("/api/auth/me", authenticateToken, handleAuthMe);

  // 3. USERS PROFILE ROUTER
  const handleUsersMeGet = (req: any, res: Response) => {
    const { password_hash, ...userResponse } = req.user;
    res.json(userResponse);
  };

  const handleUsersMePut = async (req: any, res: Response) => {
    try {
      const { name, email } = req.body;
      const user: UserEntity = req.user;
      const updates: Partial<UserEntity> = {};

      if (name) updates.name = name.trim();
      if (email) {
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await dbRepo.findUserByEmail(normalizedEmail);
        if (existing && existing.id !== user.id) {
          return res.status(400).json({ detail: "This email address is already in use by another account." });
        }
        updates.email = normalizedEmail;
      }
      updates.updated_at = new Date().toISOString();

      const updated = await dbRepo.updateUser(user.id, updates);
      const { password_hash, ...userResponse } = updated || user;
      res.json(userResponse);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to update user." });
    }
  };

  app.get("/users/me", authenticateToken, handleUsersMeGet);
  app.get("/api/users/me", authenticateToken, handleUsersMeGet);
  app.put("/users/me", authenticateToken, handleUsersMePut);
  app.put("/api/users/me", authenticateToken, handleUsersMePut);

  // 4. SKIN PROFILE ROUTER
  const handleSkinProfileGet = async (req: any, res: Response) => {
    const profile = await dbRepo.getSkinProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ detail: "Skin profile not found. Please create your profile." });
    }
    res.json(profile);
  };

  const handleSkinProfilePost = async (req: any, res: Response) => {
    try {
      const { skin_type, age_group, skin_concerns, allergies, sensitivities } = req.body;
      if (!skin_type || !age_group) {
        return res.status(422).json({ detail: "skin_type and age_group are required." });
      }

      let profile = await dbRepo.getSkinProfile(req.user.id);
      if (profile) {
        profile.skin_type = skin_type;
        profile.age_group = age_group;
        profile.skin_concerns = skin_concerns || [];
        profile.allergies = allergies || [];
        profile.sensitivities = sensitivities || [];
        profile.updated_at = new Date().toISOString();
        const saved = await dbRepo.saveSkinProfile(profile);
        return res.json(saved);
      }

      const newProfile: SkinProfileEntity = {
        id: nextProfileId++,
        user_id: req.user.id,
        skin_type,
        age_group,
        skin_concerns: skin_concerns || [],
        allergies: allergies || [],
        sensitivities: sensitivities || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const saved = await dbRepo.saveSkinProfile(newProfile);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to save skin profile." });
    }
  };

  const handleSkinProfilePut = async (req: any, res: Response) => {
    try {
      const profile = await dbRepo.getSkinProfile(req.user.id);
      if (!profile) {
        return res.status(404).json({ detail: "Skin profile not found. Please create one before updating." });
      }

      const { skin_type, age_group, skin_concerns, allergies, sensitivities } = req.body;
      if (skin_type !== undefined) profile.skin_type = skin_type;
      if (age_group !== undefined) profile.age_group = age_group;
      if (skin_concerns !== undefined) profile.skin_concerns = skin_concerns;
      if (allergies !== undefined) profile.allergies = allergies;
      if (sensitivities !== undefined) profile.sensitivities = sensitivities;
      profile.updated_at = new Date().toISOString();

      const saved = await dbRepo.saveSkinProfile(profile);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to update skin profile." });
    }
  };

  app.get("/skin-profile", authenticateToken, handleSkinProfileGet);
  app.get("/api/skin-profile", authenticateToken, handleSkinProfileGet);
  app.post("/skin-profile", authenticateToken, handleSkinProfilePost);
  app.post("/api/skin-profile", authenticateToken, handleSkinProfilePost);
  app.put("/skin-profile", authenticateToken, handleSkinProfilePut);
  app.put("/api/skin-profile", authenticateToken, handleSkinProfilePut);

  // 5. LIFESTYLE TRACKING ROUTER
  const handleLifestyleGet = async (req: any, res: Response) => {
    const userRecords = await dbRepo.getLifestyleRecords(req.user.id);
    res.json(userRecords);
  };

  const handleLifestylePost = async (req: any, res: Response) => {
    try {
      const { lifestyle_habits, water_intake, environmental_exposure } = req.body;
      if (water_intake === undefined || typeof water_intake !== "number") {
        return res.status(422).json({ detail: "water_intake (number) is required." });
      }

      const newRecord: LifestyleEntity = {
        id: nextLifestyleId++,
        user_id: req.user.id,
        lifestyle_habits: lifestyle_habits || [],
        water_intake: Number(water_intake),
        environmental_exposure: environmental_exposure || "",
        recorded_at: new Date().toISOString(),
      };
      const created = await dbRepo.createLifestyleRecord(newRecord);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to create lifestyle record." });
    }
  };

  const handleLifestylePut = async (req: any, res: Response) => {
    try {
      const recordId = parseInt(req.params.id, 10);
      const { lifestyle_habits, water_intake, environmental_exposure } = req.body;
      const updates: Partial<LifestyleEntity> = {};

      if (lifestyle_habits !== undefined) updates.lifestyle_habits = lifestyle_habits;
      if (water_intake !== undefined) updates.water_intake = Number(water_intake);
      if (environmental_exposure !== undefined) updates.environmental_exposure = environmental_exposure;

      const updated = await dbRepo.updateLifestyleRecord(recordId, req.user.id, updates);
      if (!updated) {
        return res.status(404).json({ detail: "Lifestyle record not found or access denied." });
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to update lifestyle record." });
    }
  };

  const handleLifestyleDelete = async (req: any, res: Response) => {
    try {
      const recordId = parseInt(req.params.id, 10);
      const deleted = await dbRepo.deleteLifestyleRecord(recordId, req.user.id);
      if (!deleted) {
        return res.status(404).json({ detail: "Lifestyle record not found or access denied." });
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to delete lifestyle record." });
    }
  };

  app.get("/lifestyle", authenticateToken, handleLifestyleGet);
  app.get("/api/lifestyle", authenticateToken, handleLifestyleGet);
  app.post("/lifestyle", authenticateToken, handleLifestylePost);
  app.post("/api/lifestyle", authenticateToken, handleLifestylePost);
  app.put("/lifestyle/:id", authenticateToken, handleLifestylePut);
  app.put("/api/lifestyle/:id", authenticateToken, handleLifestylePut);
  app.delete("/lifestyle/:id", authenticateToken, handleLifestyleDelete);
  app.delete("/api/lifestyle/:id", authenticateToken, handleLifestyleDelete);

  // 6. SLEEP TRACKING ROUTER
  const handleSleepGet = async (req: any, res: Response) => {
    const userRecords = await dbRepo.getSleepRecords(req.user.id);
    res.json(userRecords);
  };

  const handleSleepPost = async (req: any, res: Response) => {
    try {
      const { sleep_hours, sleep_quality } = req.body;
      if (sleep_hours === undefined || !sleep_quality) {
        return res.status(422).json({ detail: "sleep_hours and sleep_quality are required." });
      }

      const newRecord: SleepEntity = {
        id: nextSleepId++,
        user_id: req.user.id,
        sleep_hours: Number(sleep_hours),
        sleep_quality: String(sleep_quality),
        recorded_at: new Date().toISOString(),
      };
      const created = await dbRepo.createSleepRecord(newRecord);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to create sleep record." });
    }
  };

  const handleSleepPut = async (req: any, res: Response) => {
    try {
      const recordId = parseInt(req.params.id, 10);
      const { sleep_hours, sleep_quality } = req.body;
      const updates: Partial<SleepEntity> = {};

      if (sleep_hours !== undefined) updates.sleep_hours = Number(sleep_hours);
      if (sleep_quality !== undefined) updates.sleep_quality = String(sleep_quality);

      const updated = await dbRepo.updateSleepRecord(recordId, req.user.id, updates);
      if (!updated) {
        return res.status(404).json({ detail: "Sleep record not found or access denied." });
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to update sleep record." });
    }
  };

  const handleSleepDelete = async (req: any, res: Response) => {
    try {
      const recordId = parseInt(req.params.id, 10);
      const deleted = await dbRepo.deleteSleepRecord(recordId, req.user.id);
      if (!deleted) {
        return res.status(404).json({ detail: "Sleep record not found or access denied." });
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to delete sleep record." });
    }
  };

  app.get("/sleep", authenticateToken, handleSleepGet);
  app.get("/api/sleep", authenticateToken, handleSleepGet);
  app.post("/sleep", authenticateToken, handleSleepPost);
  app.post("/api/sleep", authenticateToken, handleSleepPost);
  app.put("/sleep/:id", authenticateToken, handleSleepPut);
  app.put("/api/sleep/:id", authenticateToken, handleSleepPut);
  app.delete("/sleep/:id", authenticateToken, handleSleepDelete);
  app.delete("/api/sleep/:id", authenticateToken, handleSleepDelete);

  // 7. SKIN ASSESSMENT ROUTER (Milestone 2)
  const handleSkinAssessmentGet = async (req: any, res: Response) => {
    try {
      const assessment = await dbRepo.getLatestAssessment(req.user.id);
      if (!assessment) {
        return res.status(404).json({ detail: "No skin assessment has been generated yet." });
      }
      res.json(assessment);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to retrieve skin assessment." });
    }
  };

  const handleSkinAssessmentPost = async (req: any, res: Response) => {
    try {
      const profile = await dbRepo.getSkinProfile(req.user.id);
      if (!profile) {
        return res.status(400).json({ detail: "Please complete your skin profile before starting the assessment." });
      }

      const lifestyleRecords = await dbRepo.getLifestyleRecords(req.user.id);
      const sleepRecords = await dbRepo.getSleepRecords(req.user.id);

      // Execute Predictive Machine Learning Model using 1,200+ clinical records from Excel
      const assessment = predictSkinAssessment({
        userId: req.user.id,
        profile,
        lifestyleRecords,
        sleepRecords,
        assessmentId: nextAssessmentId++,
      });

      const saved = await dbRepo.saveAssessment(assessment);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to generate skin assessment." });
    }
  };

  app.get("/skin-assessment", authenticateToken, handleSkinAssessmentGet);
  app.get("/api/skin-assessment", authenticateToken, handleSkinAssessmentGet);
  app.post("/skin-assessment", authenticateToken, handleSkinAssessmentPost);
  app.post("/api/skin-assessment", authenticateToken, handleSkinAssessmentPost);

  // 8. PERSONALIZED ROUTINE ROUTER (Milestone 2 - Predictive Model)
  const handleRoutineGet = async (req: any, res: Response) => {
    try {
      const routine = await dbRepo.getLatestRoutine(req.user.id);
      if (!routine) {
        return res.status(404).json({ detail: "No personalized skincare routine found." });
      }
      res.json(routine);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to retrieve skincare routine." });
    }
  };

  const handleRoutineGenerate = async (req: any, res: Response) => {
    try {
      const profile = await dbRepo.getSkinProfile(req.user.id);
      if (!profile) {
        return res.status(400).json({ detail: "Please complete your skin profile before generating a routine." });
      }

      let assessment = await dbRepo.getLatestAssessment(req.user.id);
      if (!assessment) {
        const lifestyleRecords = await dbRepo.getLifestyleRecords(req.user.id);
        const sleepRecords = await dbRepo.getSleepRecords(req.user.id);
        assessment = predictSkinAssessment({
          userId: req.user.id,
          profile,
          lifestyleRecords,
          sleepRecords,
          assessmentId: nextAssessmentId++,
        });
        assessment = await dbRepo.saveAssessment(assessment);
      }

      // Generate routine via Predictive Clinical Dataset Matching
      const routine = generatePredictiveSkincareRoutine({
        userId: req.user.id,
        profile,
        assessment,
        routineId: nextRoutineId++,
      });

      const saved = await dbRepo.saveRoutine(routine);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to generate skincare routine." });
    }
  };

  app.get("/routine", authenticateToken, handleRoutineGet);
  app.get("/api/routine", authenticateToken, handleRoutineGet);
  app.post("/routine/generate", authenticateToken, handleRoutineGenerate);
  app.post("/api/routine/generate", authenticateToken, handleRoutineGenerate);

  // 8.5 CLINICAL DATASET & PREDICTIVE ML ROUTER
  const handleDatasetStatsGet = (req: Request, res: Response) => {
    try {
      const stats = getClinicalDatasetStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to retrieve dataset statistics." });
    }
  };

  const handleDatasetRecordsGet = (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = (req.query.search as string) || "";
      const result = getPaginatedDatasetRecords(page, limit, search);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to fetch dataset records." });
    }
  };

  const handleDatasetDownloadExcel = (req: Request, res: Response) => {
    try {
      const buffer = getExcelDatasetBuffer();
      res.setHeader("Content-Disposition", 'attachment; filename="skincare_clinical_dataset.xlsx"');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to download Excel dataset." });
    }
  };

  const handleDatasetDownloadCsv = (req: Request, res: Response) => {
    try {
      const csvStr = getCsvDatasetString();
      res.setHeader("Content-Disposition", 'attachment; filename="skincare_clinical_dataset.csv"');
      res.setHeader("Content-Type", "text/csv");
      res.send(csvStr);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to download CSV dataset." });
    }
  };

  app.get("/dataset/stats", handleDatasetStatsGet);
  app.get("/api/dataset/stats", handleDatasetStatsGet);
  app.get("/dataset/records", handleDatasetRecordsGet);
  app.get("/api/dataset/records", handleDatasetRecordsGet);
  app.get("/dataset/download/excel", handleDatasetDownloadExcel);
  app.get("/api/dataset/download/excel", handleDatasetDownloadExcel);
  app.get("/dataset/download/csv", handleDatasetDownloadCsv);
  app.get("/api/dataset/download/csv", handleDatasetDownloadCsv);

  // ==========================================
  // 8.6 MILESTONE 3: PRODUCT RECOMMENDATION ENGINE ROUTER
  // ==========================================
  const handleProductsGet = async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const skin_type = req.query.skin_type as string;
      const concern = req.query.concern as string;
      const search = req.query.search as string;

      const products = await dbRepo.getAllProducts({ category, skin_type, concern, search });
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to fetch products." });
    }
  };

  const handleProductDetailGet = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await dbRepo.getProductById(id);
      if (!product) {
        return res.status(404).json({ detail: "Product not found." });
      }
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to fetch product details." });
    }
  };

  const handleProductRecommendationsGet = async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const profile = await dbRepo.getSkinProfile(userId);
      const assessment = await dbRepo.getLatestAssessment(userId);
      const catalog = await dbRepo.getAllProducts();

      const recommendations = generatePersonalizedRecommendations({
        profile,
        assessment,
        catalog,
      });

      res.json({
        recommendations,
        profile_summary: {
          skin_type: profile?.skin_type || "Combination",
          concerns: profile?.skin_concerns || [],
          allergies: profile?.allergies || [],
          sensitivities: profile?.sensitivities || [],
          barrier_state: assessment?.prediction_meta?.predicted_barrier_state || "Resilient",
          predicted_primary_active: assessment?.prediction_meta?.predicted_primary_active || "Niacinamide",
        },
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to generate recommendations." });
    }
  };

  const handleProductCreatePost = async (req: any, res: Response) => {
    try {
      const {
        name,
        brand,
        category,
        routine_slot_default,
        price,
        volume,
        description,
        skin_types,
        target_concerns,
        key_actives,
        inci_ingredients,
        comedogenic_score,
        is_fragrance_free,
        is_alcohol_free,
        is_cruelty_free,
        is_vegan,
        how_to_use,
      } = req.body;

      if (!name || !brand || !category) {
        return res.status(400).json({ detail: "Product name, brand, and category are required." });
      }

      const newProduct: ProductEntity = {
        id: nextProductId++,
        name: String(name).trim(),
        brand: String(brand).trim(),
        category: category as any,
        routine_slot_default: routine_slot_default || "AM_2",
        price: Number(price) || 28,
        volume: volume || "30 ml / 1.0 fl oz",
        description:
          description ||
          "Dermatologist-screened clinical formulation engineered for barrier support and targeted efficacy.",
        skin_types: Array.isArray(skin_types) && skin_types.length > 0 ? skin_types : ["All", "Combination", "Sensitive"],
        target_concerns:
          Array.isArray(target_concerns) && target_concerns.length > 0
            ? target_concerns
            : ["Compromised Barrier", "Hydration"],
        key_actives:
          Array.isArray(key_actives) && key_actives.length > 0 ? key_actives : ["Niacinamide", "Ceramide NP"],
        inci_ingredients:
          Array.isArray(inci_ingredients) && inci_ingredients.length > 0
            ? inci_ingredients
            : ["Aqua/Water", "Glycerin", "Niacinamide", "Ceramide NP", "Panthenol"],
        comedogenic_score: comedogenic_score !== undefined ? Number(comedogenic_score) : 0,
        is_fragrance_free: is_fragrance_free !== undefined ? Boolean(is_fragrance_free) : true,
        is_alcohol_free: is_alcohol_free !== undefined ? Boolean(is_alcohol_free) : true,
        is_cruelty_free: is_cruelty_free !== undefined ? Boolean(is_cruelty_free) : true,
        is_vegan: is_vegan !== undefined ? Boolean(is_vegan) : true,
        how_to_use: how_to_use || "Apply evenly to clean skin morning and/or evening before moisturizer.",
        rating: 4.9,
        review_count: 1,
      };

      const created = await dbRepo.createProduct(newProduct);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to add new product." });
    }
  };

  app.get("/products", handleProductsGet);
  app.get("/api/products", handleProductsGet);
  app.post("/products", authenticateToken, handleProductCreatePost);
  app.post("/api/products", authenticateToken, handleProductCreatePost);
  app.get("/products/recommendations", authenticateToken, handleProductRecommendationsGet);
  app.get("/api/products/recommendations", authenticateToken, handleProductRecommendationsGet);
  app.get("/products/:id", handleProductDetailGet);
  app.get("/api/products/:id", handleProductDetailGet);

  // ==========================================
  // 8.7 MILESTONE 3: INGREDIENT INTELLIGENCE & INCI SCANNER ROUTER
  // ==========================================
  const handleIngredientsGet = async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const comedogenic = req.query.comedogenic ? parseInt(req.query.comedogenic as string, 10) : undefined;
      const search = req.query.search as string;

      const ingredients = await dbRepo.getAllIngredients({ category, comedogenic, search });
      res.json(ingredients);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to fetch ingredients." });
    }
  };

  const handleIngredientDetailGet = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const ingredient = await dbRepo.getIngredientById(id);
      if (!ingredient) {
        return res.status(404).json({ detail: "Ingredient not found." });
      }
      res.json(ingredient);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to fetch ingredient details." });
    }
  };

  const handleIngredientAnalyzePost = async (req: any, res: Response) => {
    try {
      const { ingredients_text } = req.body;
      if (!ingredients_text || typeof ingredients_text !== "string") {
        return res.status(400).json({ detail: "Please provide valid ingredients text for INCI analysis." });
      }

      let profile: any = null;
      // If user is authenticated, personalize analysis against their profile
      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded && decoded.id) {
            profile = await dbRepo.getSkinProfile(decoded.id);
          }
        } catch {
          // Token verification silent fallback
        }
      }

      const analysis = analyzeCustomIngredientList(ingredients_text, profile);
      res.json(analysis);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to analyze formulation." });
    }
  };

  app.get("/ingredients", handleIngredientsGet);
  app.get("/api/ingredients", handleIngredientsGet);
  app.get("/ingredients/:id", handleIngredientDetailGet);
  app.get("/api/ingredients/:id", handleIngredientDetailGet);
  app.post("/ingredients/analyze", handleIngredientAnalyzePost);
  app.post("/api/ingredients/analyze", handleIngredientAnalyzePost);

  // ==========================================
  // 8.8 MILESTONE 3: USER SKINCARE SHELF & ROUTINE ASSIGNMENT ROUTER
  // ==========================================
  const handleShelfGet = async (req: any, res: Response) => {
    try {
      const items = await dbRepo.getUserShelf(req.user.id);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to fetch shelf items." });
    }
  };

  const handleShelfAddPost = async (req: any, res: Response) => {
    try {
      const { product_id, assigned_slots, notes } = req.body;
      if (!product_id) {
        return res.status(400).json({ detail: "product_id is required." });
      }

      const product = await dbRepo.getProductById(product_id);
      if (!product) {
        return res.status(404).json({ detail: "Product not found." });
      }

      const newShelfItem: UserShelfEntity = {
        id: nextShelfId++,
        user_id: req.user.id,
        product_id,
        product,
        assigned_slots: assigned_slots || [product.routine_slot_default as any || "AM_1"],
        status: "Active",
        user_rating: 5,
        opened_date: new Date().toISOString().split("T")[0],
        notes: notes || "",
        created_at: new Date().toISOString(),
      };

      const saved = await dbRepo.addToShelf(newShelfItem);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to add product to shelf." });
    }
  };

  const handleShelfUpdatePatch = async (req: any, res: Response) => {
    try {
      const shelfId = parseInt(req.params.id, 10);
      const { assigned_slots, status, user_rating, notes } = req.body;

      const updates: Partial<UserShelfEntity> = {};
      if (assigned_slots !== undefined) updates.assigned_slots = assigned_slots;
      if (status !== undefined) updates.status = status;
      if (user_rating !== undefined) updates.user_rating = user_rating;
      if (notes !== undefined) updates.notes = notes;

      const updated = await dbRepo.updateShelfItem(shelfId, req.user.id, updates);
      if (!updated) {
        return res.status(404).json({ detail: "Shelf item not found." });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to update shelf item." });
    }
  };

  const handleShelfDelete = async (req: any, res: Response) => {
    try {
      const shelfId = parseInt(req.params.id, 10);
      const deleted = await dbRepo.deleteShelfItem(shelfId, req.user.id);
      if (!deleted) {
        return res.status(404).json({ detail: "Shelf item not found." });
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to remove shelf item." });
    }
  };

  app.get("/shelf", authenticateToken, handleShelfGet);
  app.get("/api/shelf", authenticateToken, handleShelfGet);
  app.post("/shelf", authenticateToken, handleShelfAddPost);
  app.post("/api/shelf", authenticateToken, handleShelfAddPost);
  app.patch("/shelf/:id", authenticateToken, handleShelfUpdatePatch);
  app.patch("/api/shelf/:id", authenticateToken, handleShelfUpdatePatch);
  app.delete("/shelf/:id", authenticateToken, handleShelfDelete);
  app.delete("/api/shelf/:id", authenticateToken, handleShelfDelete);

  // ==========================================
  // 8.9 MILESTONE 3: ROUTINE CONFLICT CHECKER & ADHERENCE LOGS
  // ==========================================
  const handleRoutineConflictCheckGet = async (req: any, res: Response) => {
    try {
      const shelfItems = await dbRepo.getUserShelf(req.user.id);
      const report = evaluateRoutineSafetyAndConflicts(shelfItems);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to check routine conflicts." });
    }
  };

  const handleRoutineLogsGet = async (req: any, res: Response) => {
    try {
      const logs = await dbRepo.getUserRoutineLogs(req.user.id);
      const summary = calculateAdherenceStats(logs);
      res.json({ logs, summary });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to fetch routine logs." });
    }
  };

  const handleRoutineLogPost = async (req: any, res: Response) => {
    try {
      const {
        date,
        am_completed,
        pm_completed,
        products_used_am,
        products_used_pm,
        skin_reaction,
        reaction_notes,
      } = req.body;

      const logDate = date || new Date().toISOString().split("T")[0];

      const newLog: DailyRoutineLogEntity = {
        id: nextRoutineLogId++,
        user_id: req.user.id,
        date: logDate,
        am_completed: Boolean(am_completed),
        pm_completed: Boolean(pm_completed),
        products_used_am: Array.isArray(products_used_am) ? products_used_am : [],
        products_used_pm: Array.isArray(products_used_pm) ? products_used_pm : [],
        skin_reaction: skin_reaction || "Calm & Radiant",
        reaction_notes: reaction_notes || "",
        created_at: new Date().toISOString(),
      };

      const saved = await dbRepo.saveRoutineLog(newLog);
      const allLogs = await dbRepo.getUserRoutineLogs(req.user.id);
      const summary = calculateAdherenceStats(allLogs);

      res.status(201).json({ log: saved, summary });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to save daily routine log." });
    }
  };

  app.get("/routine/conflict-check", authenticateToken, handleRoutineConflictCheckGet);
  app.get("/api/routine/conflict-check", authenticateToken, handleRoutineConflictCheckGet);
  app.get("/routine-logs", authenticateToken, handleRoutineLogsGet);
  app.get("/api/routine-logs", authenticateToken, handleRoutineLogsGet);
  app.post("/routine-logs", authenticateToken, handleRoutineLogPost);
  app.post("/api/routine-logs", authenticateToken, handleRoutineLogPost);

  // ==========================================
  // 8.10 DERMATOLOGY CONSULTATIONS & PATIENT QUERY RESOLUTION
  // ==========================================
  const handleConsultationsGet = async (req: any, res: Response) => {
    try {
      const isDermOrAdmin = req.user.role === "DERMATOLOGIST" || req.user.role === "ADMIN";
      const list = await dbRepo.getConsultations(isDermOrAdmin ? undefined : req.user.id);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to load dermatology consultations." });
    }
  };

  const handleConsultationCreatePost = async (req: any, res: Response) => {
    try {
      const { primary_concern, subject, query_text, current_routine_notes, urgency } = req.body;
      if (!subject || !query_text) {
        return res.status(400).json({ detail: "Subject and clinical question are required." });
      }

      const profile = await dbRepo.getSkinProfile(req.user.id);
      const newConsultation: ConsultationEntity = {
        id: nextConsultationId++,
        user_id: req.user.id,
        user_name: req.user.name,
        user_email: req.user.email,
        skin_type: profile?.skin_type || "Combination",
        primary_concern: primary_concern || profile?.skin_concerns?.[0] || "General Skin Inquiry",
        subject: String(subject).trim(),
        query_text: String(query_text).trim(),
        current_routine_notes: current_routine_notes ? String(current_routine_notes).trim() : "",
        urgency: urgency === "Urgent" || urgency === "Moderate" ? urgency : "Routine",
        status: "Pending",
        created_at: new Date().toISOString(),
      };

      const saved = await dbRepo.createConsultation(newConsultation);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to submit consultation query." });
    }
  };

  const handleConsultationSolvePut = async (req: any, res: Response) => {
    try {
      if (req.user.role !== "DERMATOLOGIST" && req.user.role !== "ADMIN") {
        return res.status(403).json({ detail: "Only a Dermatologist can resolve clinical queries." });
      }
      const id = parseInt(req.params.id, 10);
      const { clinical_response, recommended_actives, recommended_product_id } = req.body;
      if (!clinical_response || !String(clinical_response).trim()) {
        return res.status(400).json({ detail: "Clinical response is required to solve the query." });
      }

      let recommendedProductName: string | undefined;
      if (recommended_product_id) {
        const prod = await dbRepo.getProductById(Number(recommended_product_id));
        if (prod) {
          recommendedProductName = `${prod.brand} - ${prod.name}`;
        }
      }

      const updated = await dbRepo.solveConsultation(id, {
        dermatologist_id: req.user.id,
        dermatologist_name: req.user.name,
        clinical_response: String(clinical_response).trim(),
        recommended_actives: Array.isArray(recommended_actives) ? recommended_actives : [],
        recommended_product_id: recommended_product_id ? Number(recommended_product_id) : undefined,
        recommended_product_name: recommendedProductName,
      });

      if (!updated) {
        return res.status(404).json({ detail: "Consultation query not found." });
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to resolve consultation query." });
    }
  };

  app.get("/consultations", authenticateToken, handleConsultationsGet);
  app.get("/api/consultations", authenticateToken, handleConsultationsGet);
  app.post("/consultations", authenticateToken, handleConsultationCreatePost);
  app.post("/api/consultations", authenticateToken, handleConsultationCreatePost);
  app.put("/consultations/:id/solve", authenticateToken, handleConsultationSolvePut);
  app.put("/api/consultations/:id/solve", authenticateToken, handleConsultationSolvePut);
  app.post("/consultations/:id/solve", authenticateToken, handleConsultationSolvePut);
  app.post("/api/consultations/:id/solve", authenticateToken, handleConsultationSolvePut);

  // 9. ADMIN USERS & SYSTEM MANAGEMENT ROUTER
  const requireAdmin = (req: any, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "DERMATOLOGIST")) {
      return res.status(403).json({ detail: "Access forbidden. Admin or Dermatologist role required." });
    }
    next();
  };

  // Get all users with rich profile & assessment summary
  const handleAdminUsersGet = async (req: any, res: Response) => {
    try {
      const users = await dbRepo.getAllUsersWithSummary();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to fetch users list." });
    }
  };

  // Get full inspection details of a specific user (profile, assessment, routine, lifestyle, sleep)
  const handleAdminUserDetailGet = async (req: any, res: Response) => {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const detail = await dbRepo.getUserFullDetails(targetUserId);
      if (!detail) {
        return res.status(404).json({ detail: "User not found." });
      }
      res.json(detail);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to fetch user dossier." });
    }
  };

  // Admin create user
  const handleAdminUserCreate = async (req: any, res: Response) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ detail: "Name, email, and temporary password are required." });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await dbRepo.findUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(400).json({ detail: "A user with this email address already exists." });
      }

      const validRoles: UserRole[] = ["USER", "DERMATOLOGIST", "ADMIN"];
      const assignedRole: UserRole = validRoles.includes(role) ? role : "USER";
      const newUser: UserEntity = {
        id: nextUserId++,
        name: name.trim(),
        email: normalizedEmail,
        password_hash: bcrypt.hashSync(password, 10),
        role: assignedRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const created = await dbRepo.createUser(newUser);
      const { password_hash, ...userResponse } = created;
      res.status(201).json(userResponse);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to create user." });
    }
  };

  // Admin update user (name, email, role)
  const handleAdminUserUpdate = async (req: any, res: Response) => {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      const targetUser = await dbRepo.findUserById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ detail: "User not found." });
      }

      const { name, email, role } = req.body;
      const updates: Partial<UserEntity> = {};

      if (name) updates.name = name.trim();
      if (email) {
        const normalized = email.toLowerCase().trim();
        const existing = await dbRepo.findUserByEmail(normalized);
        if (existing && existing.id !== targetUserId) {
          return res.status(400).json({ detail: "Email is already in use by another account." });
        }
        updates.email = normalized;
      }
      if (role && (role === "USER" || role === "DERMATOLOGIST" || role === "ADMIN")) {
        updates.role = role;
      }
      updates.updated_at = new Date().toISOString();

      const updated = await dbRepo.updateUser(targetUserId, updates);
      const { password_hash, ...userResponse } = updated || targetUser;
      res.json(userResponse);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to update user." });
    }
  };

  // Admin delete user
  const handleAdminUserDelete = async (req: any, res: Response) => {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      if (req.user.id === targetUserId) {
        return res.status(400).json({ detail: "Cannot delete your own active administrator account." });
      }

      const deleted = await dbRepo.adminDeleteUser(targetUserId);
      if (!deleted) {
        return res.status(404).json({ detail: "User not found." });
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to delete user." });
    }
  };

  // Admin system & user stats
  const handleAdminStatsGet = async (req: any, res: Response) => {
    try {
      const stats = await dbRepo.getAdminStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to retrieve admin stats." });
    }
  };

  app.get("/admin/users", authenticateToken, requireAdmin, handleAdminUsersGet);
  app.get("/api/admin/users", authenticateToken, requireAdmin, handleAdminUsersGet);
  app.get("/admin/users/:id", authenticateToken, requireAdmin, handleAdminUserDetailGet);
  app.get("/api/admin/users/:id", authenticateToken, requireAdmin, handleAdminUserDetailGet);
  app.post("/admin/users", authenticateToken, requireAdmin, handleAdminUserCreate);
  app.post("/api/admin/users", authenticateToken, requireAdmin, handleAdminUserCreate);
  app.put("/admin/users/:id", authenticateToken, requireAdmin, handleAdminUserUpdate);
  app.put("/api/admin/users/:id", authenticateToken, requireAdmin, handleAdminUserUpdate);
  app.delete("/admin/users/:id", authenticateToken, requireAdmin, handleAdminUserDelete);
  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, handleAdminUserDelete);
  app.get("/admin/stats", authenticateToken, requireAdmin, handleAdminStatsGet);
  app.get("/api/admin/stats", authenticateToken, requireAdmin, handleAdminStatsGet);

  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SkinIntel Server (MongoDB Architecture) running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});


