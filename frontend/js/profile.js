/**
 * Skin Profile Assessment & Management Controller - Milestone 1
 * Strictly isolates and persists skin profile data per authenticated user account.
 */

const ALL_CONCERNS = [
  'Acne', 'Hyperpigmentation', 'Dark Spots', 'Dry Skin', 
  'Oily Skin', 'Sensitive Skin', 'Wrinkles', 'Fine Lines', 
  'Redness', 'Uneven Skin Tone', 'Enlarged Pores', 'Dullness'
];

const ALL_ALLERGIES = [
  'Synthetic Fragrance', 'Essential Oils', 'Parabens', 
  'Sulfates (SLS/SLES)', 'Salicylates', 'Alcohol Denat', 
  'Chemical Sunscreens (Oxybenzone)', 'Nut Oils'
];

const ALL_GOALS = [
  'Clear Acne & Blemishes', 'Fade Dark Spots', 'Anti-Aging & Firming',
  'Deep Hydration & Glow', 'Soothe Redness & Calming', 'Pore Tightening & Texture'
];

function getDefaultProfileState() {
  return {
    age: 25,
    age_group: '25-34',
    skin_type: 'COMBINATION',
    oil_characteristics: '',
    concerns: [],
    allergies: [],
    sensitivities: [],
    skin_goals: [],
    working_routine: 'Desk/Screen work indoors',
    exercise_frequency: '3-4 times a week',
    exercise_duration_mins: 30,
    stress_level: 5,
    baseline_water_intake_ml: 2000,
    baseline_sleep_hours: 7.5,
    sun_exposure_level: 'Moderate (1-3 hours)',
    climate_type: 'Temperate',
    notes: ''
  };
}

class ProfileController {
  constructor() {
    this.currentStep = 1;
    this.profileData = getDefaultProfileState();
    this.hasSavedProfile = false;
    this.initEvents();
  }

  resetProfile() {
    this.profileData = getDefaultProfileState();
    this.hasSavedProfile = false;
    this.currentStep = 1;
    this.renderProfileSummary(null);
    this.populateWizardInputs();
  }

  initEvents() {
    // Exact Age Input
    const ageInput = document.getElementById('wizard-age-input');
    if (ageInput) {
      ageInput.addEventListener('input', (e) => {
        this.profileData.age = parseInt(e.target.value) || 25;
      });
    }

    // Oil Characteristics
    const oilSelect = document.getElementById('wizard-oil-characteristics');
    if (oilSelect) {
      oilSelect.addEventListener('change', (e) => {
        this.profileData.oil_characteristics = e.target.value;
      });
    }

    // Working Routine
    const workSelect = document.getElementById('wizard-work-routine');
    if (workSelect) {
      workSelect.addEventListener('change', (e) => {
        this.profileData.working_routine = e.target.value;
      });
    }

    // Exercise Frequency & Duration
    const exFreqSelect = document.getElementById('wizard-exercise-freq');
    if (exFreqSelect) {
      exFreqSelect.addEventListener('change', (e) => {
        this.profileData.exercise_frequency = e.target.value;
      });
    }

    const exDurInput = document.getElementById('wizard-exercise-dur');
    if (exDurInput) {
      exDurInput.addEventListener('input', (e) => {
        this.profileData.exercise_duration_mins = parseInt(e.target.value) || 30;
      });
    }

    // Stress slider
    const stressRange = document.getElementById('wizard-stress-range');
    if (stressRange) {
      stressRange.addEventListener('input', (e) => {
        const valBadge = document.getElementById('wizard-stress-val');
        if (valBadge) valBadge.textContent = `${e.target.value} / 10`;
        this.profileData.stress_level = parseInt(e.target.value);
      });
    }

    // Baseline ranges
    const waterRange = document.getElementById('wizard-water-range');
    if (waterRange) {
      waterRange.addEventListener('input', (e) => {
        const valBadge = document.getElementById('wizard-water-val');
        if (valBadge) valBadge.textContent = `${e.target.value} ml`;
        this.profileData.baseline_water_intake_ml = parseInt(e.target.value);
      });
    }

    const sleepRange = document.getElementById('wizard-sleep-range');
    if (sleepRange) {
      sleepRange.addEventListener('input', (e) => {
        const valBadge = document.getElementById('wizard-sleep-val');
        if (valBadge) valBadge.textContent = `${e.target.value} hrs`;
        this.profileData.baseline_sleep_hours = parseFloat(e.target.value);
      });
    }

    // Wizard Next & Prev buttons
    const nextBtn = document.getElementById('btn-wizard-next');
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());

    const prevBtn = document.getElementById('btn-wizard-prev');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());

    const saveBtn = document.getElementById('btn-wizard-save');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveProfile());
  }

  async loadProfile() {
    if (!window.api.token) {
      this.resetProfile();
      return;
    }
    try {
      const profile = await window.api.getMyProfile();
      if (profile && profile.skin_type) {
        this.hasSavedProfile = true;
        this.profileData = {
          ...getDefaultProfileState(),
          ...profile
        };
        this.renderProfileSummary(profile);
      } else {
        this.hasSavedProfile = false;
        this.profileData = getDefaultProfileState();
        this.renderProfileSummary(null);
      }
      this.populateWizardInputs();
    } catch (err) {
      console.warn('No existing skin profile found for current user account:', err);
      this.resetProfile();
    }
  }

  populateWizardInputs() {
    // Exact Age
    const ageInput = document.getElementById('wizard-age-input');
    if (ageInput) ageInput.value = this.profileData.age || 25;

    // Skin type selection
    document.querySelectorAll('.skin-type-opt').forEach(opt => {
      const type = opt.dataset.type;
      opt.classList.toggle('selected', type === this.profileData.skin_type);
      opt.onclick = () => {
        document.querySelectorAll('.skin-type-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.profileData.skin_type = type;
      };
    });

    // Age group
    const ageGroupSelect = document.getElementById('wizard-age-group');
    if (ageGroupSelect) {
      ageGroupSelect.value = this.profileData.age_group || '25-34';
      ageGroupSelect.onchange = (e) => { this.profileData.age_group = e.target.value; };
    }

    // Oil characteristics
    const oilSelect = document.getElementById('wizard-oil-characteristics');
    if (oilSelect) {
      oilSelect.value = this.profileData.oil_characteristics || '';
    }

    // Concerns Cloud
    const concernsContainer = document.getElementById('wizard-concerns-cloud');
    if (concernsContainer) {
      concernsContainer.innerHTML = ALL_CONCERNS.map(c => {
        const isActive = (this.profileData.concerns || []).includes(c);
        return `<div class="tag-chip ${isActive ? 'active' : ''}" onclick="window.profile.toggleConcern('${c}', this)">${c}</div>`;
      }).join('');
    }

    // Goals Cloud
    const goalsContainer = document.getElementById('wizard-goals-cloud');
    if (goalsContainer) {
      goalsContainer.innerHTML = ALL_GOALS.map(g => {
        const isActive = (this.profileData.skin_goals || []).includes(g);
        return `<div class="tag-chip ${isActive ? 'active' : ''}" onclick="window.profile.toggleGoal('${g}', this)">${g}</div>`;
      }).join('');
    }

    // Allergies Cloud
    const allergiesContainer = document.getElementById('wizard-allergies-cloud');
    if (allergiesContainer) {
      allergiesContainer.innerHTML = ALL_ALLERGIES.map(a => {
        const isActive = (this.profileData.allergies || []).includes(a);
        return `<div class="tag-chip ${isActive ? 'active' : ''}" onclick="window.profile.toggleAllergy('${a}', this)">${a}</div>`;
      }).join('');
    }

    // Working & Exercise Habits
    const workSelect = document.getElementById('wizard-work-routine');
    if (workSelect) workSelect.value = this.profileData.working_routine || 'Desk/Screen work indoors';

    const exFreqSelect = document.getElementById('wizard-exercise-freq');
    if (exFreqSelect) exFreqSelect.value = this.profileData.exercise_frequency || '3-4 times a week';

    const exDurInput = document.getElementById('wizard-exercise-dur');
    if (exDurInput) exDurInput.value = this.profileData.exercise_duration_mins || 30;

    const stressRange = document.getElementById('wizard-stress-range');
    const stressVal = document.getElementById('wizard-stress-val');
    if (stressRange && stressVal) {
      stressRange.value = this.profileData.stress_level || 5;
      stressVal.textContent = `${stressRange.value} / 10`;
    }

    // Climate & Sun exposure
    const sunSelect = document.getElementById('wizard-sun-exposure');
    if (sunSelect) {
      sunSelect.value = this.profileData.sun_exposure_level || 'Moderate (1-3 hours)';
      sunSelect.onchange = (e) => { this.profileData.sun_exposure_level = e.target.value; };
    }

    const climateSelect = document.getElementById('wizard-climate');
    if (climateSelect) {
      climateSelect.value = this.profileData.climate_type || 'Temperate';
      climateSelect.onchange = (e) => { this.profileData.climate_type = e.target.value; };
    }

    const waterRange = document.getElementById('wizard-water-range');
    const waterVal = document.getElementById('wizard-water-val');
    if (waterRange && waterVal) {
      waterRange.value = this.profileData.baseline_water_intake_ml || 2000;
      waterVal.textContent = `${waterRange.value} ml`;
    }

    const sleepRange = document.getElementById('wizard-sleep-range');
    const sleepVal = document.getElementById('wizard-sleep-val');
    if (sleepRange && sleepVal) {
      sleepRange.value = this.profileData.baseline_sleep_hours || 7.5;
      sleepVal.textContent = `${sleepRange.value} hrs`;
    }

    const notesInput = document.getElementById('wizard-notes-input');
    if (notesInput) notesInput.value = this.profileData.notes || '';
  }

  toggleConcern(item, el) {
    if (!this.profileData.concerns) this.profileData.concerns = [];
    if (this.profileData.concerns.includes(item)) {
      this.profileData.concerns = this.profileData.concerns.filter(x => x !== item);
      el.classList.remove('active');
    } else {
      this.profileData.concerns.push(item);
      el.classList.add('active');
    }
  }

  toggleGoal(item, el) {
    if (!this.profileData.skin_goals) this.profileData.skin_goals = [];
    if (this.profileData.skin_goals.includes(item)) {
      this.profileData.skin_goals = this.profileData.skin_goals.filter(x => x !== item);
      el.classList.remove('active');
    } else {
      this.profileData.skin_goals.push(item);
      el.classList.add('active');
    }
  }

  toggleAllergy(item, el) {
    if (!this.profileData.allergies) this.profileData.allergies = [];
    if (this.profileData.allergies.includes(item)) {
      this.profileData.allergies = this.profileData.allergies.filter(x => x !== item);
      el.classList.remove('active');
    } else {
      this.profileData.allergies.push(item);
      el.classList.add('active');
    }
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.setStep(this.currentStep + 1);
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.setStep(this.currentStep - 1);
    }
  }

  setStep(step) {
    this.currentStep = step;

    // Update progress pills
    document.querySelectorAll('.wizard-step-pill').forEach((pill, idx) => {
      const pStep = idx + 1;
      pill.classList.toggle('active', pStep === step);
      pill.classList.toggle('completed', pStep < step);
    });

    // Show active step section
    document.querySelectorAll('.wizard-step-content').forEach((sec, idx) => {
      sec.style.display = (idx + 1 === step) ? 'block' : 'none';
    });

    const prevBtn = document.getElementById('btn-wizard-prev');
    const nextBtn = document.getElementById('btn-wizard-next');
    const saveBtn = document.getElementById('btn-wizard-save');

    if (prevBtn) prevBtn.style.display = (step === 1) ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.style.display = (step === 4) ? 'none' : 'inline-flex';
    if (saveBtn) saveBtn.style.display = (step === 4) ? 'inline-flex' : 'none';
  }

  async saveProfile() {
    const notesInput = document.getElementById('wizard-notes-input');
    if (notesInput) this.profileData.notes = notesInput.value;

    try {
      const saved = await window.api.saveProfile(this.profileData);
      this.hasSavedProfile = true;
      showToast('Skin profile stored securely in database!');
      this.renderProfileSummary(saved);
      if (window.app) window.app.navigate('dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  renderProfileSummary(profile) {
    const typeEl = document.getElementById('summary-skin-type');
    const ageEl = document.getElementById('summary-age-group');
    const oilEl = document.getElementById('summary-oil-characteristics');
    const workEl = document.getElementById('summary-working-routine');
    const exEl = document.getElementById('summary-exercise-habits');
    const concernsWrap = document.getElementById('summary-concerns-tags');
    const allergiesWrap = document.getElementById('summary-allergies-tags');
    const goalsWrap = document.getElementById('summary-goals-tags');

    if (profile && profile.skin_type) {
      if (typeEl) typeEl.textContent = profile.skin_type;
      if (ageEl) ageEl.textContent = `${profile.age || 25} yrs (${profile.age_group || '25-34'})`;
      if (oilEl) oilEl.textContent = profile.oil_characteristics || 'Normal / Balanced';
      if (workEl) workEl.textContent = profile.working_routine || 'Desk Work';
      if (exEl) exEl.textContent = `${profile.exercise_frequency || '3-4 times a week'} (${profile.exercise_duration_mins || 30}m)`;

      if (concernsWrap) {
        concernsWrap.innerHTML = (profile.concerns && profile.concerns.length > 0)
          ? profile.concerns.map(c => `<span class="tag-chip active" style="font-size:0.75rem; padding:3px 8px;">${c}</span>`).join('')
          : '<span style="color:var(--text-muted); font-size:0.8rem;">No primary concerns reported</span>';
      }

      if (allergiesWrap) {
        allergiesWrap.innerHTML = (profile.allergies && profile.allergies.length > 0)
          ? profile.allergies.map(a => `<span class="tag-chip" style="font-size:0.75rem; padding:3px 8px; border-color: #ef4444; color:#dc2626; background:rgba(239,68,68,0.06);">Allergen: ${a}</span>`).join('')
          : '<span style="color:var(--text-muted); font-size:0.8rem;">None reported</span>';
      }

      if (goalsWrap) {
        goalsWrap.innerHTML = (profile.skin_goals && profile.skin_goals.length > 0)
          ? profile.skin_goals.map(g => `<span class="tag-chip active" style="font-size:0.75rem; padding:3px 8px; border-color: var(--accent-emerald); color:var(--accent-emerald); background:rgba(5,150,105,0.06);">${g}</span>`).join('')
          : '<span style="color:var(--text-muted); font-size:0.8rem;">General Skin Health</span>';
      }
    } else {
      // Clean empty state for user account with no profile yet
      if (typeEl) typeEl.textContent = 'Not Assessed Yet';
      if (ageEl) ageEl.textContent = '—';
      if (oilEl) oilEl.textContent = '—';
      if (workEl) workEl.textContent = '—';
      if (exEl) exEl.textContent = '—';

      if (concernsWrap) {
        concernsWrap.innerHTML = '<span style="color:var(--text-muted); font-size:0.82rem;">No assessment on file. Click "Start Skin Profile Wizard" below to personalize.</span>';
      }
      if (allergiesWrap) {
        allergiesWrap.innerHTML = '<span style="color:var(--text-muted); font-size:0.82rem;">None recorded</span>';
      }
      if (goalsWrap) {
        goalsWrap.innerHTML = '<span style="color:var(--text-muted); font-size:0.82rem;">Not configured</span>';
      }
    }
  }
}

window.profile = new ProfileController();
