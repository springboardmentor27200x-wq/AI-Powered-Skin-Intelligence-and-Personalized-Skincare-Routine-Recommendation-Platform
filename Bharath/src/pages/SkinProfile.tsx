import React, { useState, useEffect } from "react";
import { SkinProfile as SkinProfileType } from "../types";
import { api } from "../services/api";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  X,
  RefreshCw,
  Info,
  Shield,
  HelpCircle,
} from "lucide-react";

export const SkinProfile: React.FC = () => {
  const [skinType, setSkinType] = useState<string>("Combination");
  const [ageGroup, setAgeGroup] = useState<string>("25-34");
  const [skinConcerns, setSkinConcerns] = useState<string[]>(["Acne", "Hyperpigmentation"]);
  const [allergies, setAllergies] = useState<string[]>(["Synthetic Fragrance"]);
  const [sensitivities, setSensitivities] = useState<string[]>(["High-strength Glycolic Acid"]);

  const [customConcernInput, setCustomConcernInput] = useState("");
  const [customAllergyInput, setCustomAllergyInput] = useState("");
  const [customSensitivityInput, setCustomSensitivityInput] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNewProfile, setIsNewProfile] = useState(false);

  const skinTypeOptions = [
    { value: "Dry", label: "Dry", desc: "Flaky, tight, lacks moisture" },
    { value: "Oily", label: "Oily", desc: "Excess sebum, shiny, prone to enlarged pores" },
    { value: "Combination", label: "Combination", desc: "Oily T-zone, normal/dry cheeks" },
    { value: "Normal", label: "Normal", desc: "Well-balanced, minimal blemishes" },
    { value: "Sensitive", label: "Sensitive", desc: "Easily irritated, redness prone" },
  ];

  const ageGroupOptions = [
    "Under 18",
    "18-24",
    "25-34",
    "35-44",
    "45-54",
    "55+",
  ];

  const predefinedConcerns = [
    "Acne",
    "Hyperpigmentation",
    "Fine Lines & Wrinkles",
    "Dryness / Dehydration",
    "Redness & Rosacea",
    "Dullness",
    "Large Pores",
    "Uneven Texture",
    "Dark Circles",
    "Loss of Elasticity",
  ];

  const predefinedAllergies = [
    "Synthetic Fragrance",
    "Essential Oils",
    "Parabens & Preservatives",
    "Sulfates (SLS/SLES)",
    "Nut Oils / Almond Extract",
    "Lanolin",
    "Chemical Sunscreen Actives",
  ];

  const predefinedSensitivities = [
    "High-strength Glycolic Acid",
    "Pure Vitamin C (L-Ascorbic)",
    "Prescription Retinoids",
    "Direct Sunlight / Heat",
    "Alcohol Denat",
    "Physical Scrubs",
  ];

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getSkinProfile();
      if (data) {
        setSkinType(data.skin_type || "Combination");
        setAgeGroup(data.age_group || "25-34");
        setSkinConcerns(data.skin_concerns || []);
        setAllergies(data.allergies || []);
        setSensitivities(data.sensitivities || []);
        setIsNewProfile(false);
      }
    } catch (err: any) {
      // If 404, it means no profile exists yet
      setIsNewProfile(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const toggleConcern = (concern: string) => {
    if (skinConcerns.includes(concern)) {
      setSkinConcerns(skinConcerns.filter((c) => c !== concern));
    } else {
      setSkinConcerns([...skinConcerns, concern]);
    }
  };

  const addCustomConcern = () => {
    if (customConcernInput.trim() && !skinConcerns.includes(customConcernInput.trim())) {
      setSkinConcerns([...skinConcerns, customConcernInput.trim()]);
      setCustomConcernInput("");
    }
  };

  const toggleAllergy = (allergy: string) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter((a) => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const addCustomAllergy = () => {
    if (customAllergyInput.trim() && !allergies.includes(customAllergyInput.trim())) {
      setAllergies([...allergies, customAllergyInput.trim()]);
      setCustomAllergyInput("");
    }
  };

  const toggleSensitivity = (sensitivity: string) => {
    if (sensitivities.includes(sensitivity)) {
      setSensitivities(sensitivities.filter((s) => s !== sensitivity));
    } else {
      setSensitivities([...sensitivities, sensitivity]);
    }
  };

  const addCustomSensitivity = () => {
    if (customSensitivityInput.trim() && !sensitivities.includes(customSensitivityInput.trim())) {
      setSensitivities([...sensitivities, customSensitivityInput.trim()]);
      setCustomSensitivityInput("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!skinType) {
      setErrorMessage("Please select your skin type.");
      return;
    }

    if (!ageGroup) {
      setErrorMessage("Please select your age group.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: SkinProfileType = {
        skin_type: skinType,
        age_group: ageGroup,
        skin_concerns: skinConcerns,
        allergies: allergies,
        sensitivities: sensitivities,
      };

      if (isNewProfile) {
        await api.createSkinProfile(payload);
        setIsNewProfile(false);
      } else {
        await api.updateSkinProfile(payload);
      }

      setSuccessMessage("Skin profile updated successfully in PostgreSQL database!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save skin profile. Please retry.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#5A6D5C] mx-auto mb-3" />
        <p className="text-xs text-[#7A746B] font-medium">Loading skin profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F0F5F1] border border-[#8BA88E]/40 text-[#5A6D5C] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Skin Profile Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#333333] tracking-tight">
            Skin Profile Configuration
          </h1>
          <p className="text-xs text-[#7A746B] mt-1 font-medium">
            Specify your fundamental skin type, age category, target concerns, and product sensitivities.
          </p>
        </div>

        <button
          id="skin-profile-reload-btn"
          type="button"
          onClick={loadProfile}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E0D5] bg-[#FAF7F2] hover:bg-[#F2EDE4] text-[#4A4742] text-xs font-medium self-start sm:self-auto transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#5A6D5C]" />
          <span>Reload</span>
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div
          id="skin-profile-success-alert"
          className="p-4 rounded-2xl bg-[#F0F5F1] border border-[#8BA88E]/40 text-[#5A6D5C] text-xs flex items-center gap-3"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5A6D5C]" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          id="skin-profile-error-alert"
          className="p-4 rounded-2xl bg-[#FAF0EE] border border-[#E8D2CC] text-[#B85D52] text-xs flex items-center gap-3"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#B85D52]" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. Skin Type Selection */}
        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-[#333333]">1. Primary Skin Type</h2>
              <p className="text-xs text-[#7A746B] mt-0.5">Select the category that best describes your baseline skin.</p>
            </div>
            <span className="text-xs font-medium text-[#5A6D5C] bg-[#F0F5F1] px-2.5 py-1 rounded-full border border-[#8BA88E]/40">
              Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {skinTypeOptions.map((option) => {
              const isSelected = skinType === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  id={`skin-type-option-${option.value.toLowerCase()}`}
                  onClick={() => setSkinType(option.value)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#5A6D5C] bg-[#5A6D5C] text-white shadow-xs"
                      : "border-[#E5E0D5] hover:border-[#8BA88E] hover:bg-[#FAF7F2] text-[#333333]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{option.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#E8EFE9]" />}
                  </div>
                  <p className={`text-xs ${isSelected ? "text-[#E8EFE9]" : "text-[#7A746B]"}`}>
                    {option.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Age Group */}
        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 sm:p-7 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-serif font-bold text-[#333333]">2. Age Group</h2>
            <p className="text-xs text-[#7A746B] mt-0.5">Helps contextualize baseline cellular turnover and lipid barrier needs.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
            {ageGroupOptions.map((grp) => {
              const isSelected = ageGroup === grp;
              return (
                <button
                  type="button"
                  key={grp}
                  id={`age-group-option-${grp.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setAgeGroup(grp)}
                  className={`py-3 px-3 rounded-xl font-medium text-xs border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#5A6D5C] border-[#5A6D5C] text-white shadow-xs"
                      : "bg-[#FAF7F2] border-[#E5E0D5] text-[#4A4742] hover:bg-[#F2EDE4]"
                  }`}
                >
                  {grp}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Skin Concerns */}
        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 sm:p-7 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-serif font-bold text-[#333333]">3. Skin Concerns</h2>
            <p className="text-xs text-[#7A746B] mt-0.5">Select all specific skin challenges you are actively targeting.</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {predefinedConcerns.map((concern) => {
              const isSelected = skinConcerns.includes(concern);
              return (
                <button
                  type="button"
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#5A6D5C] border-[#5A6D5C] text-white shadow-xs"
                      : "bg-[#FAF7F2] border-[#E5E0D5] text-[#4A4742] hover:bg-[#F2EDE4]"
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#E8EFE9]" />}
                  <span>{concern}</span>
                </button>
              );
            })}
          </div>

          {/* Custom concern addition */}
          <div className="pt-2 flex gap-2 max-w-md">
            <input
              id="custom-concern-input"
              type="text"
              placeholder="Add other custom concern..."
              value={customConcernInput}
              onChange={(e) => setCustomConcernInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomConcern();
                }
              }}
              className="flex-1 px-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-[#333333] placeholder-[#9E978C] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
            />
            <button
              id="add-custom-concern-btn"
              type="button"
              onClick={addCustomConcern}
              className="px-3.5 py-2 bg-[#F2EDE4] hover:bg-[#EAE4D8] text-[#333333] rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#5A6D5C]" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* 4. Allergies & Sensitivities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allergies */}
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-serif font-bold text-[#333333]">4. Known Allergies</h2>
              <p className="text-xs text-[#7A746B] mt-0.5">Ingredients causing allergic contact dermatitis.</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {predefinedAllergies.map((allergy) => {
                const isSelected = allergies.includes(allergy);
                return (
                  <button
                    type="button"
                    key={allergy}
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FAF0EE] border-[#E8D2CC] text-[#B85D52]"
                        : "bg-[#FAF7F2] border-[#E5E0D5] text-[#4A4742] hover:bg-[#F2EDE4]"
                    }`}
                  >
                    {allergy}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                id="custom-allergy-input"
                type="text"
                placeholder="Add custom allergen..."
                value={customAllergyInput}
                onChange={(e) => setCustomAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomAllergy();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-[#333333] placeholder-[#9E978C] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
              />
              <button
                id="add-custom-allergy-btn"
                type="button"
                onClick={addCustomAllergy}
                className="px-3 py-2 bg-[#F2EDE4] hover:bg-[#EAE4D8] text-[#333333] rounded-xl text-xs font-medium cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Sensitivities */}
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-serif font-bold text-[#333333]">5. Sensitivities</h2>
              <p className="text-xs text-[#7A746B] mt-0.5">Actives or environments causing irritation or flushing.</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {predefinedSensitivities.map((sens) => {
                const isSelected = sensitivities.includes(sens);
                return (
                  <button
                    type="button"
                    key={sens}
                    onClick={() => toggleSensitivity(sens)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FBF6EE] border-[#EBDDCB] text-[#B89358]"
                        : "bg-[#FAF7F2] border-[#E5E0D5] text-[#4A4742] hover:bg-[#F2EDE4]"
                    }`}
                  >
                    {sens}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                id="custom-sensitivity-input"
                type="text"
                placeholder="Add custom sensitivity..."
                value={customSensitivityInput}
                onChange={(e) => setCustomSensitivityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSensitivity();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5E0D5] rounded-xl text-[#333333] placeholder-[#9E978C] focus:bg-white focus:border-[#5A6D5C] focus:outline-none"
              />
              <button
                id="add-custom-sensitivity-btn"
                type="button"
                onClick={addCustomSensitivity}
                className="px-3 py-2 bg-[#F2EDE4] hover:bg-[#EAE4D8] text-[#333333] rounded-xl text-xs font-medium cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E0D5]">
          <button
            id="skin-profile-save-btn"
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white font-medium text-sm transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Skin Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
