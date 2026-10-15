export const SKIN_TYPES = [
  { id: 'Normal', label: 'Normal', description: 'Balanced, not overly oily or dry' },
  { id: 'Dry', label: 'Dry', description: 'Feels tight, prone to flaking and dullness' },
  { id: 'Oily', label: 'Oily', description: 'Excess sebum, visible shine, enlarged pores' },
  { id: 'Combination', label: 'Combination', description: 'Oily T-zone (forehead/nose) and dry cheeks' },
  { id: 'Sensitive', label: 'Sensitive', description: 'Easily irritated, prone to redness and stinging' },
];

export const AGE_GROUPS = [
  'Under 18',
  '18–24',
  '25–34',
  '35–44',
  '45–54',
  '55+',
];

export const SKIN_CONCERNS = [
  'Acne',
  'Hyperpigmentation',
  'Dark Spots',
  'Dry Skin',
  'Oily Skin',
  'Sensitive Skin',
  'Wrinkles',
  'Fine Lines',
  'Redness',
  'Uneven Skin Tone',
];

export const ACTIVITY_LEVELS = [
  { id: 'Sedentary', label: 'Sedentary', desc: 'Little to no regular physical exercise' },
  { id: 'Light', label: 'Light', desc: '1–2 light workouts or walks per week' },
  { id: 'Moderate', label: 'Moderate', desc: '3–4 moderate exercise sessions per week' },
  { id: 'High', label: 'High', desc: '5+ intense athletic sessions or physical work' },
];

export const SMOKING_OPTIONS = ['Never', 'Occasionally', 'Regularly'];

export const ALCOHOL_OPTIONS = ['None', 'Occasionally', 'Frequently'];

export const OUTDOOR_EXPOSURE_OPTIONS = [
  'Low (<1 hour daily)',
  'Moderate (1–3 hours daily)',
  'High (3+ hours daily)',
];

export const EXPOSURE_LEVELS = ['Low', 'Moderate', 'High'];

export const ENVIRONMENT_TYPES = [
  'Indoor (Air Conditioned / Climate Controlled)',
  'Indoor (Natural / Ventilated)',
  'Urban (High traffic / city)',
  'Suburban / Rural',
  'Industrial / High Dust',
];

export const SLEEP_QUALITY_OPTIONS = [
  { id: 'Poor', label: 'Poor', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Fair', label: 'Fair', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Good', label: 'Good', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Excellent', label: 'Excellent', color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

export const SLEEP_CONSISTENCY_OPTIONS = [
  'Consistent',
  'Somewhat Inconsistent',
  'Very Inconsistent',
  'Variable Shift Worker',
];

export const USER_ROLES = {
  USER: 'USER',
  SKINCARE_CONSULTANT: 'SKINCARE_CONSULTANT',
  DERMATOLOGIST: 'DERMATOLOGIST',
  ADMINISTRATOR: 'ADMINISTRATOR',
};
