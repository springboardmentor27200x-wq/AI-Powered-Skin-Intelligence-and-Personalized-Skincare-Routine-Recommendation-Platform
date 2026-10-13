import {
  AuthResponse,
  User,
  SkinProfile,
  LifestyleRecord,
  SleepRecord,
  DatabaseStatus,
  SkinAssessment,
  SkincareRoutine,
  AdminUserSummary,
  AdminUserDetail,
  AdminStats,
  UserRole,
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
import { localBackend } from "./localBackendFallback";
import { CLINICAL_PRODUCT_CATALOG } from "./productData";
import { CLINICAL_INGREDIENTS_DATABASE } from "./ingredientData";

const TOKEN_KEY = "ai_skincare_auth_token";

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

class BackendUnavailableError extends Error {
  constructor() {
    super("Backend unavailable, using client-side storage");
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  // If user is logged in with a local fallback token, use localBackend directly
  if (token && token.startsWith("local_jwt_")) {
    throw new BackendUnavailableError();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch {
    throw new BackendUnavailableError();
  }

  const contentType = response.headers.get("content-type") || "";
  // On static hosts like Netlify, /api/* routes may return text/html (index.html) or 404
  if (contentType.includes("text/html") || response.status === 404 && !contentType.includes("application/json")) {
    throw new BackendUnavailableError();
  }

  if (response.status === 401) {
    removeToken();
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      throw new BackendUnavailableError();
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new BackendUnavailableError();
  }
}

export const api = {
  // Auth endpoints
  async register(data: { name: string; email: string; password: string; role?: string }): Promise<AuthResponse> {
    try {
      const res = await apiRequest<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setToken(res.access_token);
      return res;
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.register(data);
      }
      throw err;
    }
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const res = await apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setToken(res.access_token);
      return res;
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.login(data.email, data.password);
      }
      throw err;
    }
  },

  async getMe(): Promise<User> {
    try {
      return await apiRequest<User>("/api/auth/me");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getMe();
      }
      throw err;
    }
  },

  // User Profile endpoints
  async updateUserProfile(data: { name?: string; email?: string }): Promise<User> {
    try {
      return await apiRequest<User>("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.updateUserProfile(data);
      }
      throw err;
    }
  },

  // Skin Profile endpoints
  async getSkinProfile(): Promise<SkinProfile> {
    try {
      return await apiRequest<SkinProfile>("/api/skin-profile");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getSkinProfile();
      }
      throw err;
    }
  },

  async createSkinProfile(data: SkinProfile): Promise<SkinProfile> {
    try {
      return await apiRequest<SkinProfile>("/api/skin-profile", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.saveSkinProfile(data);
      }
      throw err;
    }
  },

  async updateSkinProfile(data: Partial<SkinProfile>): Promise<SkinProfile> {
    try {
      return await apiRequest<SkinProfile>("/api/skin-profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.saveSkinProfile(data);
      }
      throw err;
    }
  },

  // Lifestyle Tracking endpoints
  async getLifestyleRecords(): Promise<LifestyleRecord[]> {
    try {
      return await apiRequest<LifestyleRecord[]>("/api/lifestyle");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getLifestyleRecords();
      }
      throw err;
    }
  },

  async createLifestyleRecord(data: {
    lifestyle_habits: string[] | string;
    water_intake: number;
    environmental_exposure: string;
  }): Promise<LifestyleRecord> {
    try {
      return await apiRequest<LifestyleRecord>("/api/lifestyle", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.createLifestyleRecord(data);
      }
      throw err;
    }
  },

  async updateLifestyleRecord(
    id: number,
    data: {
      lifestyle_habits?: string[] | string;
      water_intake?: number;
      environmental_exposure?: string;
    }
  ): Promise<LifestyleRecord> {
    try {
      return await apiRequest<LifestyleRecord>(`/api/lifestyle/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.updateLifestyleRecord(id, data);
      }
      throw err;
    }
  },

  async deleteLifestyleRecord(id: number): Promise<void> {
    try {
      return await apiRequest<void>(`/api/lifestyle/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.deleteLifestyleRecord(id);
      }
      throw err;
    }
  },

  // Sleep Tracking endpoints
  async getSleepRecords(): Promise<SleepRecord[]> {
    try {
      return await apiRequest<SleepRecord[]>("/api/sleep");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getSleepRecords();
      }
      throw err;
    }
  },

  async createSleepRecord(data: {
    sleep_hours: number;
    sleep_quality: string;
  }): Promise<SleepRecord> {
    try {
      return await apiRequest<SleepRecord>("/api/sleep", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.createSleepRecord(data);
      }
      throw err;
    }
  },

  async updateSleepRecord(
    id: number,
    data: {
      sleep_hours?: number;
      sleep_quality?: string;
    }
  ): Promise<SleepRecord> {
    try {
      return await apiRequest<SleepRecord>(`/api/sleep/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.updateSleepRecord(id, data);
      }
      throw err;
    }
  },

  async deleteSleepRecord(id: number): Promise<void> {
    try {
      return await apiRequest<void>(`/api/sleep/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.deleteSleepRecord(id);
      }
      throw err;
    }
  },

  // Milestone 2: Skin Assessment endpoints
  async getSkinAssessment(): Promise<SkinAssessment> {
    try {
      return await apiRequest<SkinAssessment>("/api/skin-assessment");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getSkinAssessment();
      }
      throw err;
    }
  },

  async generateSkinAssessment(): Promise<SkinAssessment> {
    try {
      return await apiRequest<SkinAssessment>("/api/skin-assessment", {
        method: "POST",
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.generateSkinAssessment();
      }
      throw err;
    }
  },

  // Milestone 2: Personalized Skincare Routine endpoints
  async getSkincareRoutine(): Promise<SkincareRoutine> {
    try {
      return await apiRequest<SkincareRoutine>("/api/routine");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getSkincareRoutine();
      }
      throw err;
    }
  },

  async generateSkincareRoutine(): Promise<SkincareRoutine> {
    try {
      return await apiRequest<SkincareRoutine>("/api/routine/generate", {
        method: "POST",
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.generateSkincareRoutine();
      }
      throw err;
    }
  },

  // MongoDB Database Endpoints
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      return await apiRequest<DatabaseStatus>("/api/database/status");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getDatabaseStatus();
      }
      throw err;
    }
  },

  async reseedDatabase(): Promise<{ message: string; stats: DatabaseStatus }> {
    try {
      return await apiRequest<{ message: string; stats: DatabaseStatus }>("/api/database/reseed", {
        method: "POST",
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.reseedDatabase();
      }
      throw err;
    }
  },

  // Admin Management Endpoints
  async getAdminUsers(): Promise<AdminUserSummary[]> {
    try {
      return await apiRequest<AdminUserSummary[]>("/api/admin/users");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getAdminUsers();
      }
      throw err;
    }
  },

  async getAdminUserDetail(userId: number): Promise<AdminUserDetail> {
    try {
      return await apiRequest<AdminUserDetail>(`/api/admin/users/${userId}`);
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getAdminUserDetail(userId);
      }
      throw err;
    }
  },

  async createAdminUser(data: { name: string; email: string; password: string; role: UserRole }): Promise<User> {
    try {
      return await apiRequest<User>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.createAdminUser(data);
      }
      throw err;
    }
  },

  async updateAdminUser(userId: number, data: { name?: string; email?: string; role?: UserRole }): Promise<User> {
    try {
      return await apiRequest<User>(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.updateAdminUser(userId, data);
      }
      throw err;
    }
  },

  async deleteAdminUser(userId: number): Promise<void> {
    try {
      return await apiRequest<void>(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.deleteAdminUser(userId);
      }
      throw err;
    }
  },

  async getAdminStats(): Promise<AdminStats> {
    try {
      return await apiRequest<AdminStats>("/api/admin/stats");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getAdminStats();
      }
      throw err;
    }
  },

  // Clinical Excel Dataset & Predictive Model Endpoints
  async getClinicalDatasetStats(): Promise<ClinicalDatasetStats> {
    try {
      return await apiRequest<ClinicalDatasetStats>("/api/dataset/stats");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getClinicalDatasetStats();
      }
      throw err;
    }
  },

  async getClinicalDatasetRecords(
    page = 1,
    limit = 20,
    search = ""
  ): Promise<{
    records: ClinicalRecordView[];
    pagination: { page: number; limit: number; total_records: number; total_pages: number };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
      });
      return await apiRequest<{
        records: ClinicalRecordView[];
        pagination: { page: number; limit: number; total_records: number; total_pages: number };
      }>(`/api/dataset/records?${params.toString()}`);
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getClinicalDatasetRecords(page, limit, search);
      }
      throw err;
    }
  },

  getDatasetDownloadUrl(format: "excel" | "csv" = "excel"): string {
    return format === "excel" ? "/api/dataset/download/excel" : "/api/dataset/download/csv";
  },

  // ==========================================
  // Milestone 3: Products & Recommendation Engine
  // ==========================================
  async getProducts(params?: {
    category?: string;
    skin_type?: string;
    concern?: string;
    search?: string;
  }): Promise<Product[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.set("category", params.category);
      if (params?.skin_type) query.set("skin_type", params.skin_type);
      if (params?.concern) query.set("concern", params.concern);
      if (params?.search) query.set("search", params.search);
      const qs = query.toString();
      return await apiRequest<Product[]>(`/api/products${qs ? `?${qs}` : ""}`);
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getProducts(params);
      }
      throw err;
    }
  },

  async getProduct(id: number): Promise<Product> {
    try {
      return await apiRequest<Product>(`/api/products/${id}`);
    } catch {
      return CLINICAL_PRODUCT_CATALOG.find((p) => p.id === id) || CLINICAL_PRODUCT_CATALOG[0];
    }
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    try {
      return await apiRequest<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.createProduct(data);
      }
      throw err;
    }
  },

  async getProductRecommendations(): Promise<{
    recommendations: ProductRecommendation[];
    profile_summary: {
      skin_type: string;
      concerns: string[];
      allergies: string[];
      sensitivities: string[];
      barrier_state: string;
      predicted_primary_active: string;
    };
  }> {
    try {
      return await apiRequest<{
        recommendations: ProductRecommendation[];
        profile_summary: {
          skin_type: string;
          concerns: string[];
          allergies: string[];
          sensitivities: string[];
          barrier_state: string;
          predicted_primary_active: string;
        };
      }>("/api/products/recommendations");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getProductRecommendations();
      }
      throw err;
    }
  },

  // ==========================================
  // Milestone 3: Ingredients & INCI Safety Scanner
  // ==========================================
  async getIngredients(params?: {
    category?: string;
    comedogenic?: number;
    search?: string;
  }): Promise<Ingredient[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.set("category", params.category);
      if (params?.comedogenic !== undefined) query.set("comedogenic", params.comedogenic.toString());
      if (params?.search) query.set("search", params.search);
      const qs = query.toString();
      return await apiRequest<Ingredient[]>(`/api/ingredients${qs ? `?${qs}` : ""}`);
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getIngredients(params);
      }
      throw err;
    }
  },

  async getIngredient(id: number): Promise<Ingredient> {
    try {
      return await apiRequest<Ingredient>(`/api/ingredients/${id}`);
    } catch {
      return CLINICAL_INGREDIENTS_DATABASE.find((i) => i.id === id) || CLINICAL_INGREDIENTS_DATABASE[0];
    }
  },

  async analyzeIngredients(inciText: string): Promise<CustomAnalysisResult> {
    try {
      return await apiRequest<CustomAnalysisResult>("/api/ingredients/analyze", {
        method: "POST",
        body: JSON.stringify({ ingredients_text: inciText }),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.analyzeIngredients(inciText);
      }
      throw err;
    }
  },

  // ==========================================
  // Milestone 3: User Skincare Shelf & Routine Tracker
  // ==========================================
  async getUserShelf(): Promise<UserShelfItem[]> {
    try {
      return await apiRequest<UserShelfItem[]>("/api/shelf");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getUserShelf();
      }
      throw err;
    }
  },

  async addToShelf(productId: number, assigned_slots?: string[], notes?: string): Promise<UserShelfItem> {
    try {
      return await apiRequest<UserShelfItem>("/api/shelf", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, assigned_slots, notes }),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.addToShelf(productId, assigned_slots, notes);
      }
      throw err;
    }
  },

  async updateShelfItem(
    id: number,
    data: {
      assigned_slots?: string[];
      status?: "Active" | "Empty" | "Wishlist";
      user_rating?: number;
      notes?: string;
    }
  ): Promise<UserShelfItem> {
    try {
      return await apiRequest<UserShelfItem>(`/api/shelf/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.updateShelfItem(id, data);
      }
      throw err;
    }
  },

  async removeFromShelf(id: number): Promise<void> {
    try {
      return await apiRequest<void>(`/api/shelf/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.removeFromShelf(id);
      }
      throw err;
    }
  },

  async checkRoutineConflicts(): Promise<RoutineConflictReport> {
    try {
      return await apiRequest<RoutineConflictReport>("/api/routine/conflict-check");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.checkRoutineConflicts();
      }
      throw err;
    }
  },

  // ==========================================
  // Milestone 3: Daily Routine Adherence & Reaction Logger
  // ==========================================
  async getRoutineLogs(): Promise<{
    logs: DailyRoutineLog[];
    summary: AdherenceStreakSummary;
  }> {
    try {
      return await apiRequest<{
        logs: DailyRoutineLog[];
        summary: AdherenceStreakSummary;
      }>("/api/routine-logs");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getRoutineLogs();
      }
      throw err;
    }
  },

  async logDailyRoutine(data: {
    date: string;
    am_completed: boolean;
    pm_completed: boolean;
    products_used_am?: number[];
    products_used_pm?: number[];
    skin_reaction: string;
    reaction_notes?: string;
  }): Promise<{ log: DailyRoutineLog; summary: AdherenceStreakSummary }> {
    try {
      return await apiRequest<{ log: DailyRoutineLog; summary: AdherenceStreakSummary }>("/api/routine-logs", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.logDailyRoutine(data);
      }
      throw err;
    }
  },

  // ==========================================
  // Dermatology Consultations & Patient Query Resolution
  // ==========================================
  async getConsultations(): Promise<DermatologyConsultation[]> {
    try {
      return await apiRequest<DermatologyConsultation[]>("/api/consultations");
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.getConsultations();
      }
      throw err;
    }
  },

  async createConsultation(data: {
    primary_concern: string;
    subject: string;
    query_text: string;
    current_routine_notes?: string;
    urgency?: "Routine" | "Moderate" | "Urgent";
  }): Promise<DermatologyConsultation> {
    try {
      return await apiRequest<DermatologyConsultation>("/api/consultations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.createConsultation(data);
      }
      throw err;
    }
  },

  async solveConsultation(
    id: number,
    data: {
      clinical_response: string;
      recommended_actives?: string[];
      recommended_product_id?: number;
      recommended_product_name?: string;
    }
  ): Promise<DermatologyConsultation> {
    try {
      return await apiRequest<DermatologyConsultation>(`/api/consultations/${id}/solve`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        return localBackend.solveConsultation(id, data);
      }
      throw err;
    }
  },
};
