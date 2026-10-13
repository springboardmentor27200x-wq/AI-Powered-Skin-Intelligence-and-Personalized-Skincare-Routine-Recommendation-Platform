import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Product,
  ProductRecommendation,
  UserShelfItem,
  RoutineConflictReport,
  ProductCategory,
  RoutineSlotAssignment,
  PageRoute,
} from "../types";
import {
  Sparkles,
  ShoppingBag,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Star,
  RefreshCw,
  X,
  Droplet,
  Sun,
  Moon,
  Zap,
} from "lucide-react";

interface ProductRecommendationPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const ProductRecommendationPage: React.FC<ProductRecommendationPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"recommendations" | "catalog" | "shelf">("recommendations");
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [profileSummary, setProfileSummary] = useState<any>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [shelfItems, setShelfItems] = useState<UserShelfItem[]>([]);
  const [conflictReport, setConflictReport] = useState<RoutineConflictReport | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedConcern, setSelectedConcern] = useState<string>("All");
  const [fragranceFreeOnly, setFragranceFreeOnly] = useState(false);

  // Selected product modal
  const [selectedProduct, setSelectedProduct] = useState<Product | ProductRecommendation | null>(null);
  const [assignSlotModalItem, setAssignSlotModalItem] = useState<UserShelfItem | null>(null);

  // Add New Product Modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdBrand, setNewProdBrand] = useState("");
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>("Serum");
  const [newProdSlot, setNewProdSlot] = useState<RoutineSlotAssignment>("AM_2");
  const [newProdPrice, setNewProdPrice] = useState("29.00");
  const [newProdVolume, setNewProdVolume] = useState("30 ml / 1.0 fl oz");
  const [newProdDescription, setNewProdDescription] = useState("");
  const [newProdActives, setNewProdActives] = useState("Niacinamide, Ceramide NP, Panthenol");
  const [newProdInci, setNewProdInci] = useState(
    "Aqua/Water, Glycerin, Niacinamide, Ceramide NP, Panthenol, Sodium Hyaluronate, Allantoin"
  );
  const [newProdSkinTypes, setNewProdSkinTypes] = useState<string[]>(["Combination", "Sensitive"]);
  const [newProdConcerns, setNewProdConcerns] = useState<string[]>(["Compromised Barrier", "Acne"]);
  const [newProdFragranceFree, setNewProdFragranceFree] = useState(true);
  const [newProdAddToShelf, setNewProdAddToShelf] = useState(true);

  const categories: { label: string; value: string }[] = [
    { label: "All Categories", value: "All" },
    { label: "Cleansers", value: "Cleanser" },
    { label: "Toners & Essences", value: "Toner" },
    { label: "Serums & Actives", value: "Serum" },
    { label: "Moisturizers", value: "Moisturizer" },
    { label: "Sunscreens (SPF 50+)", value: "Sunscreen" },
    { label: "Exfoliants & Peels", value: "Treatment & Exfoliant" },
    { label: "Eye Care", value: "Eye Cream" },
  ];

  const commonConcerns = [
    "All",
    "Acne",
    "Enlarged Pores",
    "Hyperpigmentation",
    "Compromised Barrier",
    "Redness",
    "Dryness & Dehydration",
    "Fine Lines & Wrinkles",
    "Excess Sebum",
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // 1. Fetch Recommendations & Profile context
      const recRes = await api.getProductRecommendations();
      setRecommendations(recRes.recommendations || []);
      setProfileSummary(recRes.profile_summary || null);

      // 2. Fetch all products catalog
      const catalogRes = await api.getProducts();
      setCatalog(catalogRes || []);

      // 3. Fetch user shelf
      const shelfRes = await api.getUserShelf();
      setShelfItems(shelfRes || []);

      // 4. Fetch routine conflict check
      const conflictRes = await api.checkRoutineConflicts();
      setConflictReport(conflictRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load product intelligence data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToShelf = async (product: Product) => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      const defaultSlot = product.routine_slot_default || "AM_1";
      await api.addToShelf(product.id, [defaultSlot]);
      setSuccessMsg(`Added "${product.name}" to your skincare shelf!`);
      setTimeout(() => setSuccessMsg(""), 3500);

      // Refresh shelf & conflict report
      const updatedShelf = await api.getUserShelf();
      setShelfItems(updatedShelf);
      const updatedConflicts = await api.checkRoutineConflicts();
      setConflictReport(updatedConflicts);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add product to shelf.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromShelf = async (shelfItemId: number) => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      await api.removeFromShelf(shelfItemId);
      const updatedShelf = await api.getUserShelf();
      setShelfItems(updatedShelf);
      const updatedConflicts = await api.checkRoutineConflicts();
      setConflictReport(updatedConflicts);
      setSuccessMsg("Product removed from shelf.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove item.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSlot = async (shelfItemId: number, newSlots: RoutineSlotAssignment[]) => {
    setActionLoading(true);
    try {
      await api.updateShelfItem(shelfItemId, { assigned_slots: newSlots });
      const updatedShelf = await api.getUserShelf();
      setShelfItems(updatedShelf);
      const updatedConflicts = await api.checkRoutineConflicts();
      setConflictReport(updatedConflicts);
      setAssignSlotModalItem(null);
      setSuccessMsg("Routine slot assignment updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update routine slot.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdBrand.trim()) {
      setErrorMsg("Please provide both a product name and brand.");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    try {
      const activesList = newProdActives
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const inciList = newProdInci
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await api.createProduct({
        name: newProdName.trim(),
        brand: newProdBrand.trim(),
        category: newProdCategory,
        routine_slot_default: newProdSlot,
        price: parseFloat(newProdPrice) || 28,
        volume: newProdVolume.trim() || "30 ml / 1.0 fl oz",
        description:
          newProdDescription.trim() ||
          `Clinical ${newProdCategory.toLowerCase()} formulated with ${activesList.join(", ")} for targeted barrier and skin health support.`,
        skin_types: newProdSkinTypes.length > 0 ? newProdSkinTypes : ["All"],
        target_concerns: newProdConcerns.length > 0 ? newProdConcerns : ["Compromised Barrier"],
        key_actives: activesList.length > 0 ? activesList : ["Niacinamide", "Ceramide NP"],
        inci_ingredients:
          inciList.length > 0
            ? inciList
            : ["Aqua/Water", "Glycerin", "Niacinamide", "Ceramide NP", "Panthenol"],
        comedogenic_score: 0,
        is_fragrance_free: newProdFragranceFree,
        is_alcohol_free: true,
        is_cruelty_free: true,
        is_vegan: true,
        how_to_use: "Apply evenly to clean skin in your assigned routine step.",
      });

      if (newProdAddToShelf) {
        await api.addToShelf(created.id, [newProdSlot], "Added via custom product form");
      }

      await loadData();
      setIsAddProductOpen(false);
      setNewProdName("");
      setNewProdBrand("");
      setNewProdDescription("");
      setSuccessMsg(
        newProdAddToShelf
          ? `Added "${created.name}" to Personalized Recommendations & your Skincare Shelf!`
          : `Added "${created.name}" to Personalized Recommendations & Clinical Catalog!`
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add new product.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSkinTypeSelection = (st: string) => {
    setNewProdSkinTypes((prev) =>
      prev.includes(st) ? prev.filter((item) => item !== st) : [...prev, st]
    );
  };

  const toggleConcernSelection = (c: string) => {
    setNewProdConcerns((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  // Filter recommendations
  const filteredRecommendations = recommendations.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    if (selectedConcern !== "All" && !p.target_concerns.some((c) => c.toLowerCase().includes(selectedConcern.toLowerCase()))) return false;
    if (fragranceFreeOnly && !p.is_fragrance_free) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.key_actives.some((a) => a.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Filter catalog
  const filteredCatalog = catalog.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    if (selectedConcern !== "All" && !p.target_concerns.some((c) => c.toLowerCase().includes(selectedConcern.toLowerCase()))) return false;
    if (fragranceFreeOnly && !p.is_fragrance_free) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.key_actives.some((a) => a.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Check if product is already in user shelf
  const isProductInShelf = (productId: number) => {
    return shelfItems.some((s) => s.product_id === productId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-[#EAE6DE] rounded-2xl p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#8C857B] font-medium">
              <span>Formulation Intelligence</span>
              <span aria-hidden="true">·</span>
              <span>Dermatological Safety Screening</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E2C29]">
              Personalized Recommendations & Shelf
            </h1>
            <p className="text-xs text-[#6E685E] max-w-2xl leading-relaxed">
              Every formula is clinically scored against your skin phototype, active barrier state, and target concerns with automated allergen quarantine and conflict validation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              id="add-new-product-btn"
              onClick={() => setIsAddProductOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>
            <button
              onClick={() => onNavigate("/routine")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#2E2C29] border border-[#EAE6DE] transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#5A6D5C]" />
              <span>View Active Routine</span>
            </button>
            <button
              onClick={() => onNavigate("/ingredients")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#2E2C29] border border-[#EAE6DE] transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#5A6D5C]" />
              <span>INCI Scanner</span>
            </button>
          </div>
        </div>

        {/* User Skin Biology Strip */}
        {profileSummary && (
          <div className="mt-5 pt-5 border-t border-[#F2EDE4] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#8C857B] block text-[11px]">Skin Type</span>
              <span className="font-semibold text-[#2E2C29]">{profileSummary.skin_type}</span>
            </div>
            <div>
              <span className="text-[#7A746B] block text-[11px]">Barrier Status</span>
              <span className="font-semibold text-[#5A6D5C] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5A6D5C]" />
                {profileSummary.barrier_state}
              </span>
            </div>
            <div>
              <span className="text-[#7A746B] block text-[11px]">Primary Active Match</span>
              <span className="font-semibold text-[#333333]">{profileSummary.predicted_primary_active}</span>
            </div>
            <div>
              <span className="text-[#7A746B] block text-[11px]">Allergen Exclusions</span>
              <span className="font-semibold text-[#B85D52]">
                {profileSummary.allergies?.length > 0
                  ? `${profileSummary.allergies.length} Flagged (${profileSummary.allergies.join(", ")})`
                  : "None flagged"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Routine Conflict Warning Banner if shelf has active clashes */}
      {conflictReport && conflictReport.has_conflicts && (
        <div className="bg-[#FAF3F2] border border-[#B85D52]/30 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#F4DCD9] text-[#B85D52] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-[#B85D52]">
                  Routine Formulation Conflict Warning ({conflictReport.conflict_count} Detected)
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#F4DCD9] text-[#B85D52] font-semibold">
                  {conflictReport.overall_safety_rating}
                </span>
              </div>
              <div className="space-y-2 text-xs text-[#6B4B48] mt-2">
                {conflictReport.conflicts.map((c, idx) => (
                  <div key={idx} className="bg-white/80 rounded-xl p-3 border border-[#B85D52]/20 space-y-1">
                    <div className="font-semibold text-[#B85D52] flex items-center justify-between">
                      <span>[{c.type}] {c.slot ? `Slot: ${c.slot}` : ""}</span>
                      <span className="text-[10px] font-mono uppercase bg-[#F4DCD9] px-1.5 py-0.5 rounded">{c.severity} Severity</span>
                    </div>
                    <p>{c.description}</p>
                    <p className="text-[#333333] font-medium pt-1">
                      <span className="text-[#5A6D5C] font-semibold">Clinical Action: </span>{c.clinical_recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Synergies detected banner */}
      {conflictReport && conflictReport.synergies && conflictReport.synergies.length > 0 && (
        <div className="bg-[#F0F5F1] border border-[#8BA88E]/40 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E0EBE2] text-[#5A6D5C] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#5A6D5C] block">
                {conflictReport.synergies.length} High-Affinity Routine Synergies Active on Your Shelf
              </span>
              <span className="text-[#6B7A6C]">
                {conflictReport.synergies.map((s) => `${s.product1} + ${s.product2} (${s.benefit})`).join(" · ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="bg-[#F0F5F1] text-[#3B4D3D] text-xs font-medium px-4 py-3 rounded-xl border border-[#8BA88E]/40 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#5A6D5C]" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-[#FAF3F2] text-[#B85D52] text-xs font-medium px-4 py-3 rounded-xl border border-[#B85D52]/30 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#B85D52]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Segmented Control Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#EAE6DE] pb-4">
        <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "recommendations"
                ? "bg-white text-[#2E2C29] shadow-2xs"
                : "text-[#6E685E] hover:text-[#2E2C29]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>Personalized Matches ({recommendations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "catalog"
                ? "bg-white text-[#2E2C29] shadow-2xs"
                : "text-[#6E685E] hover:text-[#2E2C29]"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>Clinical Catalog ({catalog.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("shelf")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "shelf"
                ? "bg-white text-[#2E2C29] shadow-2xs"
                : "text-[#6E685E] hover:text-[#2E2C29]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#5A6D5C]" />
            <span>My Shelf ({shelfItems.length})</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#7A746B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brand, name, or active..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E0D5] rounded-xl text-xs focus:outline-none focus:border-[#5A6D5C] text-[#333333]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A746B] hover:text-[#333333]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar (Category & Concerns) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[#7A746B] text-[11px] font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === c.value
                  ? "bg-[#5A6D5C] text-white"
                  : "bg-white border border-[#E5E0D5] text-[#7A746B] hover:text-[#333333]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[#7A746B] text-[11px] font-semibold uppercase tracking-wider shrink-0">
              Concern:
            </span>
            {commonConcerns.map((con) => (
              <button
                key={con}
                onClick={() => setSelectedConcern(con)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  selectedConcern === con
                    ? "bg-[#333333] text-white"
                    : "bg-[#F7F4EE] text-[#7A746B] hover:text-[#333333]"
                }`}
              >
                {con}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-[#7A746B] cursor-pointer shrink-0 select-none">
            <input
              type="checkbox"
              checked={fragranceFreeOnly}
              onChange={(e) => setFragranceFreeOnly(e.target.checked)}
              className="rounded border-[#E5E0D5] text-[#5A6D5C] focus:ring-[#5A6D5C]"
            />
            <span>Fragrance-Free Only</span>
          </label>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F5F1] text-[#5A6D5C] flex items-center justify-center mx-auto border border-[#8BA88E]/30 animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold uppercase text-[#7A746B] tracking-wider">
            Scoring Formulations Against Your Skin Profile...
          </p>
        </div>
      )}

      {/* TAB 1: AI RECOMMENDATIONS */}
      {!isLoading && activeTab === "recommendations" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#7A746B]">
            <span>
              Showing {filteredRecommendations.length} tailored formulas ranked by clinical compatibility score
            </span>
            <span>Sorted by: Highest Match %</span>
          </div>

          {filteredRecommendations.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E5E0D5] rounded-3xl p-8 space-y-3">
              <ShoppingBag className="w-8 h-8 text-[#7A746B] mx-auto opacity-50" />
              <h3 className="font-serif font-bold text-base text-[#333333]">No products match this filter</h3>
              <p className="text-xs text-[#7A746B] max-w-sm mx-auto">
                Try selecting "All Categories" or clearing the search keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecommendations.map((prod) => {
                const inShelf = isProductInShelf(prod.id);
                const isTopMatch = prod.match_score >= 85;
                const isContraindicated = prod.allergen_warning;

                return (
                  <div
                    key={prod.id}
                    className={`bg-white border rounded-3xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                      isContraindicated
                        ? "border-[#B85D52]/40 bg-[#FAF3F2]/30"
                        : isTopMatch
                        ? "border-[#5A6D5C]/40 ring-1 ring-[#5A6D5C]/15"
                        : "border-[#E5E0D5]"
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Header with Match Score */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-mono text-[#7A746B] uppercase tracking-wider block">
                            {prod.brand}
                          </span>
                          <h3 className="font-serif font-bold text-base text-[#333333] leading-snug line-clamp-1">
                            {prod.name}
                          </h3>
                        </div>

                        {/* Match Gauge */}
                        <div
                          className={`text-right shrink-0 px-2.5 py-1 rounded-xl border text-center ${
                            isContraindicated
                              ? "bg-[#FAF3F2] border-[#B85D52]/30 text-[#B85D52]"
                              : isTopMatch
                              ? "bg-[#F0F5F1] border-[#8BA88E]/40 text-[#5A6D5C]"
                              : "bg-[#F7F4EE] border-[#E5E0D5] text-[#7A746B]"
                          }`}
                        >
                          <span className="font-serif font-bold text-base block leading-none">
                            {isContraindicated ? "ALERT" : `${prod.match_score}%`}
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-wider block text-[#7A746B]">
                            {isContraindicated ? "Excluded" : "Match"}
                          </span>
                        </div>
                      </div>

                      {/* Category & Routine Slot */}
                      <div className="flex items-center gap-2 text-xs text-[#7A746B]">
                        <span className="font-medium text-[#333333]">{prod.category}</span>
                        <span>·</span>
                        <span>{prod.routine_fit}</span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[#7A746B] line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>

                      {/* Key Actives */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono uppercase text-[#7A746B] font-semibold block">
                          Key Clinical Actives:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {prod.key_actives.map((act, aIdx) => (
                            <span
                              key={aIdx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-[#F7F4EE] text-[#333333] border border-[#E5E0D5]"
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Clinical Match Justification */}
                      <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#E5E0D5] text-xs space-y-1">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[#5A6D5C] block flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#5A6D5C]" /> Why Formulated For You:
                        </span>
                        {prod.match_reasons.slice(0, 2).map((reason, rIdx) => (
                          <p key={rIdx} className="text-[#555555] text-[11px] leading-tight">
                            • {reason}
                          </p>
                        ))}
                      </div>

                      {/* Allergen & Safety Guarantee Badges */}
                      <div className="flex items-center gap-2 text-[11px]">
                        {isContraindicated ? (
                          <span className="text-[#B85D52] font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Flagged allergen: {prod.flagged_allergens.join(", ")}
                          </span>
                        ) : (
                          <span className="text-[#5A6D5C] font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#5A6D5C]" /> 100% Free from your allergens
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Pricing & Actions */}
                    <div className="pt-4 mt-4 border-t border-[#E5E0D5] flex items-center justify-between">
                      <div>
                        <span className="font-serif font-bold text-sm text-[#333333]">
                          ${prod.price.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-[#7A746B] block">{prod.volume}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedProduct(prod)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#7A746B] hover:text-[#333333] hover:bg-[#F2EDE4] transition-colors cursor-pointer"
                        >
                          INCI Details
                        </button>

                        <button
                          onClick={() => handleAddToShelf(prod)}
                          disabled={actionLoading || inShelf || isContraindicated}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            inShelf
                              ? "bg-[#F0F5F1] text-[#5A6D5C] border border-[#8BA88E]/40"
                              : isContraindicated
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-[#5A6D5C] text-white hover:bg-[#4A5D4C] shadow-xs"
                          }`}
                        >
                          {inShelf ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>On Shelf</span>
                            </>
                          ) : isContraindicated ? (
                            <span>Unsafe</span>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Shelf</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FULL PRODUCT CATALOG */}
      {!isLoading && activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#7A746B]">
            <span>Browsing full dermatology catalog ({filteredCatalog.length} clinical formulations)</span>
            <span>All formulas tested & rated</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalog.map((prod) => {
              const inShelf = isProductInShelf(prod.id);
              return (
                <div
                  key={prod.id}
                  className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-[#7A746B] uppercase tracking-wider block">
                          {prod.brand}
                        </span>
                        <h3 className="font-serif font-bold text-base text-[#333333] leading-snug">
                          {prod.name}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#5A6D5C] bg-[#F0F5F1] px-2 py-0.5 rounded-md border border-[#8BA88E]/30">
                        {prod.category}
                      </span>
                    </div>

                    <p className="text-xs text-[#7A746B] line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#7A746B] font-semibold block">
                        Target Skin Types:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {prod.skin_types.map((st, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#F7F4EE] text-[#555555]"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#7A746B] font-semibold block">
                        Key Actives:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {prod.key_actives.map((act, aIdx) => (
                          <span
                            key={aIdx}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-[#F0F5F1] text-[#3B4D3D] font-medium border border-[#8BA88E]/30"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E5E0D5] flex items-center justify-between">
                    <div>
                      <span className="font-serif font-bold text-sm text-[#333333]">
                        ${prod.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-[#7A746B] block">{prod.volume}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProduct(prod)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#7A746B] hover:text-[#333333] hover:bg-[#F2EDE4] transition-colors cursor-pointer"
                      >
                        INCI Details
                      </button>

                      <button
                        onClick={() => handleAddToShelf(prod)}
                        disabled={actionLoading || inShelf}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          inShelf
                            ? "bg-[#F0F5F1] text-[#5A6D5C] border border-[#8BA88E]/40"
                            : "bg-[#5A6D5C] text-white hover:bg-[#4A5D4C] shadow-xs"
                        }`}
                      >
                        {inShelf ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>On Shelf</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MY SKINCARE SHELF */}
      {!isLoading && activeTab === "shelf" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#7A746B]">
            <div>
              <span className="font-bold text-[#333333]">Active Product Shelf</span> · {shelfItems.length} Products Assigned to Daily Routine Slots
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Product to Shelf</span>
              </button>
              <button
                onClick={() => onNavigate("/routine")}
                className="text-[#5A6D5C] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Daily Routine View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {shelfItems.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E5E0D5] rounded-3xl p-8 space-y-3">
              <Layers className="w-8 h-8 text-[#7A746B] mx-auto opacity-50" />
              <h3 className="font-serif font-bold text-base text-[#333333]">Your Skincare Shelf is Empty</h3>
              <p className="text-xs text-[#7A746B] max-w-sm mx-auto">
                Explore your tailored AI recommendations and add products to start tracking your morning and evening routines.
              </p>
              <button
                onClick={() => setActiveTab("recommendations")}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#5A6D5C] text-white text-xs font-semibold rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5" /> Browse Recommendations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shelfItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E5E0D5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-[#7A746B] uppercase tracking-wider block">
                          {item.product.brand}
                        </span>
                        <h3 className="font-serif font-bold text-base text-[#333333] leading-snug">
                          {item.product.name}
                        </h3>
                        <span className="text-xs text-[#7A746B]">{item.product.category} · {item.product.volume}</span>
                      </div>

                      <button
                        onClick={() => handleRemoveFromShelf(item.id)}
                        disabled={actionLoading}
                        className="text-[#7A746B] hover:text-[#B85D52] p-1.5 rounded-lg hover:bg-[#FAF3F2] transition-colors cursor-pointer"
                        title="Remove from Shelf"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Assigned Routine Slots */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#7A746B] font-semibold block">
                        Assigned Routine Slots:
                      </span>
                      <div className="flex flex-wrap gap-2 items-center">
                        {item.assigned_slots.map((slot, sIdx) => {
                          const isAm = slot.startsWith("AM");
                          const isPm = slot.startsWith("PM");
                          return (
                            <span
                              key={sIdx}
                              className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 ${
                                isAm
                                  ? "bg-[#FFF9E6] border-[#E8D49E] text-[#7A5B14]"
                                  : isPm
                                  ? "bg-[#F0F2FA] border-[#C8D1EB] text-[#2F447A]"
                                  : "bg-[#F7F4EE] border-[#E5E0D5] text-[#333333]"
                              }`}
                            >
                              {isAm ? <Sun className="w-3 h-3 text-[#D9A321]" /> : isPm ? <Moon className="w-3 h-3 text-[#53689E]" /> : null}
                              <span>{slot.replace("_", " Step ")}</span>
                            </span>
                          );
                        })}

                        <button
                          onClick={() => setAssignSlotModalItem(item)}
                          className="text-[11px] font-semibold text-[#5A6D5C] hover:underline px-2 py-0.5"
                        >
                          Change Slots
                        </button>
                      </div>
                    </div>

                    {/* Key Actives */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#7A746B] font-semibold block">
                        Actives Applied:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.product.key_actives.map((act, aIdx) => (
                          <span
                            key={aIdx}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-[#F7F4EE] text-[#333333]"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* User Notes */}
                    {item.notes && (
                      <p className="text-xs text-[#555555] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E5E0D5] italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-[#7A746B]">
                    <span>Opened: {item.opened_date || "Recently"}</span>
                    <button
                      onClick={() => setSelectedProduct(item.product)}
                      className="text-[#5A6D5C] font-semibold hover:underline"
                    >
                      View INCI & Safety
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PRODUCT INCI DETAILS & SAFETY ANALYSIS */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-xl border border-[#E5E0D5]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#7A746B] uppercase tracking-wider block">
                  {selectedProduct.brand} · {selectedProduct.category}
                </span>
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#333333]">
                  {selectedProduct.name}
                </h2>
                <span className="text-xs text-[#7A746B]">{selectedProduct.volume} · ${selectedProduct.price.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-[#F2EDE4] hover:bg-[#E5E0D5] flex items-center justify-center text-[#7A746B] hover:text-[#333333] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description & How to use */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-semibold uppercase text-[#7A746B]">Formula Summary:</h4>
              <p className="text-xs text-[#555555] leading-relaxed">{selectedProduct.description}</p>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5E0D5] space-y-1 text-xs">
              <span className="font-semibold text-[#333333] block">Clinical Application Instructions:</span>
              <p className="text-[#555555]">{selectedProduct.how_to_use}</p>
            </div>

            {/* Safety Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[#F7F4EE] p-2.5 rounded-xl text-center border border-[#E5E0D5]">
                <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Comedogenic</span>
                <span className="font-bold text-[#333333]">{selectedProduct.comedogenic_score} / 5</span>
              </div>
              <div className="bg-[#F7F4EE] p-2.5 rounded-xl text-center border border-[#E5E0D5]">
                <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Fragrance</span>
                <span className="font-bold text-[#5A6D5C]">{selectedProduct.is_fragrance_free ? "100% Free" : "Contains"}</span>
              </div>
              <div className="bg-[#F7F4EE] p-2.5 rounded-xl text-center border border-[#E5E0D5]">
                <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Alcohol</span>
                <span className="font-bold text-[#5A6D5C]">{selectedProduct.is_alcohol_free ? "Denat Free" : "Contains"}</span>
              </div>
              <div className="bg-[#F7F4EE] p-2.5 rounded-xl text-center border border-[#E5E0D5]">
                <span className="text-[10px] text-[#7A746B] block uppercase font-mono">Cruelty Free</span>
                <span className="font-bold text-[#5A6D5C]">{selectedProduct.is_cruelty_free ? "Verified" : "No"}</span>
              </div>
            </div>

            {/* Full INCI Ingredients List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-semibold uppercase text-[#7A746B]">
                  Full INCI Ingredients ({selectedProduct.inci_ingredients.length}):
                </h4>
                <span className="text-[10px] text-[#5A6D5C] font-mono">Medical Lab Grade</span>
              </div>
              <div className="bg-[#FDFBF7] border border-[#E5E0D5] p-3.5 rounded-2xl max-h-40 overflow-y-auto text-xs text-[#555555] leading-relaxed">
                {selectedProduct.inci_ingredients.join(", ")}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E0D5]">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7A746B] hover:text-[#333333]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleAddToShelf(selectedProduct);
                  setSelectedProduct(null);
                }}
                disabled={isProductInShelf(selectedProduct.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isProductInShelf(selectedProduct.id)
                    ? "bg-[#F0F5F1] text-[#5A6D5C] border border-[#8BA88E]/40"
                    : "bg-[#5A6D5C] text-white hover:bg-[#4A5D4C]"
                }`}
              >
                {isProductInShelf(selectedProduct.id) ? "Already on Shelf" : "Add to Shelf"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN ROUTINE SLOTS */}
      {assignSlotModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-xl border border-[#E5E0D5]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#333333]">
                  Assign Routine Slots
                </h3>
                <p className="text-xs text-[#7A746B]">{assignSlotModalItem.product.name}</p>
              </div>
              <button
                onClick={() => setAssignSlotModalItem(null)}
                className="w-7 h-7 rounded-full bg-[#F2EDE4] flex items-center justify-center text-[#7A746B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#7A746B]">
              Select which morning, evening, or weekly steps you apply this product in:
            </p>

            <div className="space-y-2">
              {[
                { slot: "AM_1" as RoutineSlotAssignment, label: "Morning Step 1 (Cleanser)" },
                { slot: "AM_2" as RoutineSlotAssignment, label: "Morning Step 2 (Serum / Active)" },
                { slot: "AM_3" as RoutineSlotAssignment, label: "Morning Step 3 (Moisturizer)" },
                { slot: "AM_4" as RoutineSlotAssignment, label: "Morning Step 4 (SPF Shield)" },
                { slot: "PM_1" as RoutineSlotAssignment, label: "Evening Step 1 (Cleanse / Double Cleanse)" },
                { slot: "PM_2" as RoutineSlotAssignment, label: "Evening Step 2 (Target Treatment / Active)" },
                { slot: "PM_3" as RoutineSlotAssignment, label: "Evening Step 3 (Night Barrier Cream)" },
                { slot: "WEEKLY" as RoutineSlotAssignment, label: "Weekly Exfoliant / Treatment Mask" },
              ].map(({ slot, label }) => {
                const isChecked = assignSlotModalItem.assigned_slots.includes(slot);
                return (
                  <label
                    key={slot}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-[#F0F5F1] border-[#5A6D5C] text-[#333333]"
                        : "bg-white border-[#E5E0D5] text-[#7A746B] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <span className="font-medium">{label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        let newSlots = [...assignSlotModalItem.assigned_slots];
                        if (e.target.checked) {
                          newSlots.push(slot);
                        } else {
                          newSlots = newSlots.filter((s) => s !== slot);
                        }
                        setAssignSlotModalItem({
                          ...assignSlotModalItem,
                          assigned_slots: newSlots,
                        });
                      }}
                      className="rounded border-[#E5E0D5] text-[#5A6D5C] focus:ring-[#5A6D5C]"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D5]">
              <button
                onClick={() => setAssignSlotModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7A746B]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateSlot(assignSlotModalItem.id, assignSlotModalItem.assigned_slots)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#5A6D5C] text-white hover:bg-[#4A5D4C]"
              >
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW PRODUCT TO PERSONALIZED RECOMMENDATIONS & SHELF */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-xl border border-[#EAE6DE]">
            <div className="flex items-start justify-between border-b border-[#F2EDE4] pb-4">
              <div>
                <span className="text-xs text-[#5A6D5C] font-semibold block">
                  Personalized Recommendations & Shelf
                </span>
                <h2 className="font-serif font-bold text-xl text-[#2E2C29]">
                  Add New Skincare Product
                </h2>
                <p className="text-xs text-[#6E685E] mt-0.5">
                  Add a new formulation to score against your skin profile and include on your shelf.
                </p>
              </div>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#EAE6DE] flex items-center justify-center text-[#6E685E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g., Barrier Repair Peptide Serum"
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    placeholder="e.g., DermBiotic Labs"
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Category
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  >
                    <option value="Cleanser">Cleanser</option>
                    <option value="Toner">Toner</option>
                    <option value="Serum">Serum</option>
                    <option value="Moisturizer">Moisturizer</option>
                    <option value="Sunscreen">Sunscreen</option>
                    <option value="Treatment & Exfoliant">Treatment & Exfoliant</option>
                    <option value="Eye Cream">Eye Cream</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Routine Step Slot
                  </label>
                  <select
                    value={newProdSlot}
                    onChange={(e) => setNewProdSlot(e.target.value as RoutineSlotAssignment)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  >
                    <option value="AM_1">AM Step 1 (Cleanse)</option>
                    <option value="AM_2">AM Step 2 (Serum)</option>
                    <option value="AM_3">AM Step 3 (Moisturize)</option>
                    <option value="AM_4">AM Step 4 (SPF)</option>
                    <option value="PM_1">PM Step 1 (Cleanse)</option>
                    <option value="PM_2">PM Step 2 (Treatment)</option>
                    <option value="PM_3">PM Step 3 (Night Cream)</option>
                    <option value="WEEKLY">Weekly Exfoliant/Mask</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Volume
                  </label>
                  <input
                    type="text"
                    value={newProdVolume}
                    onChange={(e) => setNewProdVolume(e.target.value)}
                    placeholder="30 ml / 1.0 fl oz"
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  />
                </div>
              </div>

              {/* Skin Types */}
              <div>
                <label className="block font-semibold text-[#2E2C29] mb-1.5">
                  Suitable Skin Types
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["All", "Combination", "Oily", "Dry", "Sensitive", "Normal"].map((st) => {
                    const active = newProdSkinTypes.includes(st);
                    return (
                      <button
                        type="button"
                        key={st}
                        onClick={() => toggleSkinTypeSelection(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? "bg-[#5A6D5C] text-white border-[#5A6D5C]"
                            : "bg-[#FAF8F5] text-[#6E685E] border-[#EAE6DE] hover:text-[#2E2C29]"
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Concerns */}
              <div>
                <label className="block font-semibold text-[#2E2C29] mb-1.5">
                  Target Skin Concerns
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {commonConcerns
                    .filter((c) => c !== "All")
                    .map((concern) => {
                      const active = newProdConcerns.includes(concern);
                      return (
                        <button
                          type="button"
                          key={concern}
                          onClick={() => toggleConcernSelection(concern)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            active
                              ? "bg-[#2E2C29] text-white border-[#2E2C29]"
                              : "bg-[#FAF8F5] text-[#6E685E] border-[#EAE6DE] hover:text-[#2E2C29]"
                          }`}
                        >
                          {concern}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Key Clinical Actives (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newProdActives}
                    onChange={(e) => setNewProdActives(e.target.value)}
                    placeholder="Niacinamide, Ceramide NP, Panthenol"
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#2E2C29] mb-1">
                    Full INCI Ingredients (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newProdInci}
                    onChange={(e) => setNewProdInci(e.target.value)}
                    placeholder="Aqua/Water, Glycerin, Niacinamide..."
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2E2C29] mb-1">
                  Clinical Description
                </label>
                <textarea
                  rows={2}
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  placeholder="Describe how this product supports the skin barrier or targets concerns..."
                  className="w-full px-3 py-2 rounded-lg border border-[#EAE6DE] bg-[#FAF8F5] focus:bg-white focus:border-[#5A6D5C] focus:outline-none text-[#2E2C29]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F2EDE4]">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProdAddToShelf}
                      onChange={(e) => setNewProdAddToShelf(e.target.checked)}
                      className="rounded border-[#EAE6DE] text-[#5A6D5C] focus:ring-[#5A6D5C]"
                    />
                    <span className="font-semibold text-[#2E2C29]">
                      Also add directly to My Skincare Shelf
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[#6E685E]">
                    <input
                      type="checkbox"
                      checked={newProdFragranceFree}
                      onChange={(e) => setNewProdFragranceFree(e.target.checked)}
                      className="rounded border-[#EAE6DE] text-[#5A6D5C] focus:ring-[#5A6D5C]"
                    />
                    <span>100% Fragrance-Free</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6E685E] hover:text-[#2E2C29] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white transition-colors cursor-pointer"
                  >
                    {actionLoading ? "Adding Product..." : "Add Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
