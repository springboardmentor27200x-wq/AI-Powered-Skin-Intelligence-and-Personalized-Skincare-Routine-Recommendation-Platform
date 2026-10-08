/**
 * DermaIQ Clinical Active Interaction & Allergy Safety Engine
 * Evaluates active ingredient combinations against patient allergies,
 * sensitivities, Fitzpatrick phototype, and 5-pillar barrier health scores.
 */

export const CLINICAL_ACTIVES = [
  {
    id: 'retinol',
    name: 'Retinol / Tretinoin (Retinoid)',
    category: 'Retinoid',
    photosensitizing: true,
    barrierIntensive: true,
    contraindicatedAllergies: ['retinoid', 'vitamin a'],
    description: 'Gold-standard cell turnover & anti-aging active. Requires gradual acclimation.'
  },
  {
    id: 'salicylic_acid',
    name: 'Salicylic Acid (BHA 2%)',
    category: 'Exfoliant',
    photosensitizing: false,
    barrierIntensive: true,
    contraindicatedAllergies: ['salicylate', 'aspirin', 'bha'],
    description: 'Lipid-soluble pore decongestant. Keratolytic and anti-inflammatory.'
  },
  {
    id: 'glycolic_acid',
    name: 'Glycolic / Lactic Acid (AHA 5-10%)',
    category: 'Exfoliant',
    photosensitizing: true,
    barrierIntensive: true,
    contraindicatedAllergies: ['aha', 'glycolic', 'lactic acid'],
    description: 'Water-soluble superficial chemical exfoliant for texture & dullness.'
  },
  {
    id: 'benzoyl_peroxide',
    name: 'Benzoyl Peroxide (2.5-5%)',
    category: 'Antibacterial',
    photosensitizing: true,
    barrierIntensive: true,
    contraindicatedAllergies: ['peroxide', 'benzoyl'],
    description: 'Topical antibacterial targeting Cutibacterium acnes with keratolytic action.'
  },
  {
    id: 'vitamin_c',
    name: 'Vitamin C (L-Ascorbic Acid 15%)',
    category: 'Antioxidant',
    photosensitizing: false,
    barrierIntensive: false,
    contraindicatedAllergies: ['ascorbic', 'vitamin c'],
    description: 'Potent antioxidant defending against photo-damage and melanin synthesis.'
  },
  {
    id: 'niacinamide',
    name: 'Niacinamide (Vitamin B3 5%)',
    category: 'Barrier & Soothing',
    photosensitizing: false,
    barrierIntensive: false,
    contraindicatedAllergies: ['niacin', 'nicotinamide'],
    description: 'Restores lipid barrier, regulates sebum, and soothes inflammatory redness.'
  },
  {
    id: 'azelaic_acid',
    name: 'Azelaic Acid (10-15%)',
    category: 'Depigmenting & Anti-inflammatory',
    photosensitizing: false,
    barrierIntensive: false,
    contraindicatedAllergies: ['azelaic'],
    description: 'Inhibits tyrosinase, reduces post-inflammatory hyperpigmentation, calms rosacea.'
  },
  {
    id: 'hyaluronic_acid',
    name: 'Hyaluronic Acid Multi-Molecular',
    category: 'Hydrator',
    photosensitizing: false,
    barrierIntensive: false,
    contraindicatedAllergies: ['hyaluronate'],
    description: 'Humectant binding up to 1000x its weight in water for cellular turgor.'
  },
  {
    id: 'ceramides',
    name: 'Ceramide Complex (NP, AP, EOP) + Panthenol',
    category: 'Barrier Repair',
    photosensitizing: false,
    barrierIntensive: false,
    contraindicatedAllergies: [],
    description: 'Biomimetic stratum corneum lipid replenishment and TEWL reduction.'
  },
  {
    id: 'hydroquinone',
    name: 'Hydroquinone (2-4%)',
    category: 'Depigmenting',
    photosensitizing: true,
    barrierIntensive: true,
    contraindicatedAllergies: ['hydroquinone', 'phenol'],
    description: 'Prescription-strength tyrosinase inhibitor for recalcitrant melasma.'
  },
  {
    id: 'centella',
    name: 'Centella Asiatica / Madecassoside',
    category: 'Barrier & Soothing',
    photosensitizing: false,
    barrierIntensive: false,
    contraindicatedAllergies: ['centella', 'gotu kola', 'asteraceae'],
    description: 'Calms dermal micro-inflammation and accelerates re-epithelialization.'
  },
  {
    id: 'zinc_pca',
    name: 'Zinc PCA (1%)',
    category: 'Sebum Regulator',
    photosensitizing: false,
    barrierIntensive: false,
    contraindicatedAllergies: ['zinc'],
    description: 'Zinc-pyrrolidone carboxylic acid controlling sebum secretion without stripping.'
  }
];

/**
 * Cross-references chosen actives against patient allergies, sensitivities,
 * Fitzpatrick phototype, and barrier health score.
 */
export const evaluateClinicalSafety = (selectedActiveIds = [], patientProfile = {}) => {
  const warnings = [];
  const recommendations = [];

  const actives = CLINICAL_ACTIVES.filter(a => selectedActiveIds.includes(a.id));
  if (actives.length === 0) {
    return {
      riskLevel: 'SAFE',
      isSafe: true,
      warnings: [],
      recommendations: ['Select one or more active compounds to analyze pharmacological interactions.']
    };
  }

  // 1. Check patient documented allergies & sensitivities
  const allergies = (patientProfile.allergies || []).map(a => (typeof a === 'string' ? a.toLowerCase() : (a.name || '').toLowerCase()));
  const sensitivities = (patientProfile.sensitivities || []).map(s => (typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()));
  const allContraindications = [...allergies, ...sensitivities];

  for (const active of actives) {
    const hasDirectAllergy = active.contraindicatedAllergies.some(allergen => 
      allContraindications.some(c => c.includes(allergen) || allergen.includes(c))
    );
    if (hasDirectAllergy) {
      warnings.push({
        type: 'CONTRAINDICATION',
        severity: 'danger',
        title: `Direct Allergy Conflict: ${active.name}`,
        message: `Patient has documented allergy/sensitivity to "${active.contraindicatedAllergies.join(', ')}". Prescription of ${active.name} is medically contraindicated.`
      });
    }
  }

  // 2. Pairwise Active-to-Active Conflicts
  const activeIds = actives.map(a => a.id);

  // Retinoid + Chemical Exfoliant (AHA/BHA)
  if (activeIds.includes('retinol') && (activeIds.includes('salicylic_acid') || activeIds.includes('glycolic_acid'))) {
    warnings.push({
      type: 'INTERACTION',
      severity: 'warning',
      title: 'High Cumulative Irritation Risk: Retinoid + Chemical Acid',
      message: 'Co-administering Retinoids with direct AHA/BHA exfoliants severely increases transepidermal water loss (TEWL) and barrier disruption. Advise cycling on alternate evenings.'
    });
  }

  // Benzoyl Peroxide + Pure Tretinoin / Retinol
  if (activeIds.includes('benzoyl_peroxide') && activeIds.includes('retinol')) {
    warnings.push({
      type: 'INTERACTION',
      severity: 'warning',
      title: 'Oxidative Degradation: Benzoyl Peroxide + Retinoid',
      message: 'Benzoyl peroxide can oxidize and deactivate non-encapsulated tretinoin if applied simultaneously. Advise Benzoyl Peroxide in AM and Retinoid in PM.'
    });
  }

  // Vitamin C (L-Ascorbic) + Direct AHA/BHA
  if (activeIds.includes('vitamin_c') && (activeIds.includes('salicylic_acid') || activeIds.includes('glycolic_acid'))) {
    warnings.push({
      type: 'INTERACTION',
      severity: 'warning',
      title: 'Low pH Layering Irritation: Pure Vitamin C + Exfoliating Acid',
      message: 'Layering low-pH L-Ascorbic Acid (pH ~3.0) with AHA/BHA in the same session may trigger dermal erythema on reactive skin. Separate into morning and evening.'
    });
  }

  // Retinoid + Hydroquinone
  if (activeIds.includes('retinol') && activeIds.includes('hydroquinone')) {
    recommendations.push(
      'Synergistic depigmentation protocol: Limit continuous hydroquinone therapy to 3-month cycles followed by a 1-month holiday with Azelaic Acid to avoid ochronosis.'
    );
  }

  // 3. Barrier Health Suitability
  const barrierScore = patientProfile.barrier_score ?? 
    (patientProfile.latest_assessment?.pillar_scores?.barrier_score ?? 
    patientProfile.latest_assessment?.barrier_score);

  const hasBarrierIntensive = actives.some(a => a.barrierIntensive);
  if (barrierScore !== undefined && barrierScore !== null && Number(barrierScore) < 50 && hasBarrierIntensive) {
    warnings.push({
      type: 'BARRIER',
      severity: 'warning',
      title: 'Compromised Stratum Corneum Barrier Detected (Score < 50)',
      message: `Patient's barrier score is currently ${barrierScore}/100. Introducing aggressive exfoliants or retinoids risks barrier collapse. Prescribe Ceramides + Panthenol replenishment first.`
    });
  }

  // 4. Photosensitivity & Fitzpatrick Phototype Alert
  const hasPhotosensitizing = actives.some(a => a.photosensitizing);
  const fitzpatrick = (patientProfile.fitzpatrick_type || '').toUpperCase();
  const isHigherFitzpatrick = fitzpatrick.includes('IV') || fitzpatrick.includes('V') || fitzpatrick.includes('VI');

  if (hasPhotosensitizing) {
    recommendations.push(
      'Photosensitizing active present: Broad-Spectrum SPF 50+ PA++++ is medically required daily.'
    );
    if (isHigherFitzpatrick) {
      warnings.push({
        type: 'PHOTOSENSITIVITY',
        severity: 'info',
        title: 'Fitzpatrick Phototype III-VI PIH Risk',
        message: 'Higher Fitzpatrick phototypes have elevated risk of Post-Inflammatory Hyperpigmentation (PIH) upon acid or retinoid-induced inflammation. Recommend conservative titrations.'
      });
    }
  }

  // Overall Risk Level Determination
  const hasDanger = warnings.some(w => w.severity === 'danger');
  const hasWarning = warnings.some(w => w.severity === 'warning');

  const riskLevel = hasDanger ? 'CONTRAINDICATED' : (hasWarning ? 'CAUTION' : 'SAFE');
  const isSafe = !hasDanger;

  return {
    riskLevel,
    isSafe,
    warnings,
    recommendations
  };
};
