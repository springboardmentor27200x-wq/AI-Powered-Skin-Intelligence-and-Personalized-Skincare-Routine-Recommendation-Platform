/**
 * Daily Lifestyle, Sleep, Hydration & Environmental Tracker Controller - Milestone 1
 * Strictly isolates and persists tracking metrics per authenticated user account.
 */

function getDefaultTrackingState() {
  return {
    hydration_total_ml: 0,
    hydration_target_ml: 2500,
    hydration_percentage: 0,
    sleep_hours: 0,
    sleep_quality: 'GOOD',
    wake_feeling: 'Refreshed',
    stress_level: 5,
    diet_quality_score: 5,
    sun_exposure_hours: 0,
    uv_index: 0,
    dust_pollution_exposure: 'Low',
    weather_condition: 'Temperate',
    lifestyle_impact_score: 50
  };
}

class TrackingController {
  constructor() {
    this.currentSummary = getDefaultTrackingState();
    this.initEvents();
  }

  resetTracking() {
    this.currentSummary = getDefaultTrackingState();
    this.renderSummary(this.currentSummary);
  }

  initEvents() {
    // Quick Hydration Buttons
    const add250Btn = document.getElementById('btn-add-250-water');
    if (add250Btn) add250Btn.addEventListener('click', () => this.addWater(250));

    const add500Btn = document.getElementById('btn-add-500-water');
    if (add500Btn) add500Btn.addEventListener('click', () => this.addWater(500));

    const resetWaterBtn = document.getElementById('btn-reset-water');
    if (resetWaterBtn) resetWaterBtn.addEventListener('click', () => this.resetWater());

    // Sleep Quality Selector
    document.querySelectorAll('.quality-pill:not(.feeling-pill)').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.quality-pill:not(.feeling-pill)').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Wake Feeling Selector (Good vs Tired)
    document.querySelectorAll('.feeling-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.feeling-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Sleep Save Button
    const saveSleepBtn = document.getElementById('btn-save-sleep');
    if (saveSleepBtn) saveSleepBtn.addEventListener('click', () => this.saveSleepLog());

    // Sleep Slider
    const sleepSlider = document.getElementById('sleep-duration-slider');
    if (sleepSlider) {
      sleepSlider.addEventListener('input', (e) => {
        const valBadge = document.getElementById('sleep-duration-val');
        if (valBadge) valBadge.textContent = `${e.target.value} hrs`;
      });
    }

    // Lifestyle Sliders & Save
    const stressSlider = document.getElementById('stress-level-slider');
    if (stressSlider) {
      stressSlider.addEventListener('input', (e) => {
        const badge = document.getElementById('stress-level-val');
        if (badge) badge.textContent = `${e.target.value} / 10`;
      });
    }

    const dietSlider = document.getElementById('diet-quality-slider');
    if (dietSlider) {
      dietSlider.addEventListener('input', (e) => {
        const badge = document.getElementById('diet-quality-val');
        if (badge) badge.textContent = `${e.target.value} / 10`;
      });
    }

    const saveLifestyleBtn = document.getElementById('btn-save-lifestyle');
    if (saveLifestyleBtn) saveLifestyleBtn.addEventListener('click', () => this.saveLifestyleLog());

    // Environment Slider & Save
    const sunSlider = document.getElementById('env-sun-hours-slider');
    if (sunSlider) {
      sunSlider.addEventListener('input', (e) => {
        const badge = document.getElementById('env-sun-hours-val');
        if (badge) badge.textContent = `${e.target.value} hrs`;
      });
    }

    const saveEnvBtn = document.getElementById('btn-save-environment');
    if (saveEnvBtn) saveEnvBtn.addEventListener('click', () => this.saveEnvironmentLog());
  }

  async loadTodayData() {
    if (!window.api.token) {
      this.resetTracking();
      return;
    }
    try {
      const summary = await window.api.getTrackingSummary();
      if (summary) {
        this.currentSummary = summary;
        this.renderSummary(summary);
      } else {
        this.resetTracking();
      }
    } catch (err) {
      console.warn('Could not load today tracking for current account:', err);
      this.resetTracking();
    }
  }

  renderSummary(summary) {
    if (!summary) return;

    // Hydration Dial
    const dialRing = document.getElementById('hydration-dial-ring');
    const amountEl = document.getElementById('hydration-current-amount');
    const targetEl = document.getElementById('hydration-target-amount');
    const pctEl = document.getElementById('hydration-percent-text');

    const pct = summary.hydration_percentage || 0;
    const currentMl = summary.hydration_total_ml || 0;
    const targetMl = summary.hydration_target_ml || 2500;

    if (dialRing) dialRing.style.setProperty('--percent', pct);
    if (amountEl) amountEl.textContent = `${currentMl} ml`;
    if (targetEl) targetEl.textContent = `Target: ${targetMl} ml`;
    if (pctEl) pctEl.textContent = `${pct}%`;

    // Sleep card
    const sleepHours = summary.sleep_hours || 0;
    const sleepQuality = summary.sleep_quality || 'GOOD';
    const wakeFeeling = summary.wake_feeling || 'Refreshed';

    const sleepHoursEl = document.getElementById('summary-sleep-hours');
    const sleepQualityEl = document.getElementById('summary-sleep-quality');
    if (sleepHoursEl) sleepHoursEl.textContent = sleepHours > 0 ? `${sleepHours}h` : 'No Log';
    if (sleepQualityEl) sleepQualityEl.textContent = sleepHours > 0 ? `${sleepQuality} • ${wakeFeeling}` : 'Not logged today';

    const sleepSlider = document.getElementById('sleep-duration-slider');
    const sleepBadge = document.getElementById('sleep-duration-val');
    if (sleepSlider) sleepSlider.value = sleepHours || 7.5;
    if (sleepBadge) sleepBadge.textContent = `${sleepHours || 7.5} hrs`;

    document.querySelectorAll('.quality-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.quality === sleepQuality);
    });

    document.querySelectorAll('.feeling-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.feeling === wakeFeeling);
    });

    // Stress & Diet
    const stressVal = summary.stress_level || 5;
    const dietVal = summary.diet_quality_score || 5;

    const stressSlider = document.getElementById('stress-level-slider');
    const stressBadge = document.getElementById('stress-level-val');
    if (stressSlider) stressSlider.value = stressVal;
    if (stressBadge) stressBadge.textContent = `${stressVal} / 10`;

    const dietSlider = document.getElementById('diet-quality-slider');
    const dietBadge = document.getElementById('diet-quality-val');
    if (dietSlider) dietSlider.value = dietVal;
    if (dietBadge) dietBadge.textContent = `${dietVal} / 10`;

    // Environmental
    const sunHours = summary.sun_exposure_hours || 0;
    const sunSlider = document.getElementById('env-sun-hours-slider');
    const sunBadge = document.getElementById('env-sun-hours-val');
    if (sunSlider) sunSlider.value = sunHours;
    if (sunBadge) sunBadge.textContent = `${sunHours} hrs`;

    const dustSelect = document.getElementById('env-dust-select');
    if (dustSelect && summary.dust_pollution_exposure) dustSelect.value = summary.dust_pollution_exposure;

    const weatherSelect = document.getElementById('env-weather-select');
    if (weatherSelect && summary.weather_condition) weatherSelect.value = summary.weather_condition;

    // Lifestyle Impact Score (Stat card)
    const impactEl = document.getElementById('stat-lifestyle-score');
    if (impactEl) impactEl.textContent = `${Math.round(summary.lifestyle_impact_score || 50)}`;

    const uvEl = document.getElementById('stat-uv-index');
    if (uvEl) uvEl.textContent = `${summary.uv_index || 0}`;
  }

  async addWater(amount) {
    try {
      await window.api.logHydration(amount);
      showToast(`Added +${amount} ml water to your database account`);
      await this.loadTodayData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async resetWater() {
    try {
      await window.api.setHydrationTotal(0);
      showToast('Reset your hydration to 0 ml');
      await this.loadTodayData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async saveSleepLog() {
    const hours = parseFloat(document.getElementById('sleep-duration-slider').value);
    const activeQualityPill = document.querySelector('.quality-pill.active');
    const quality = activeQualityPill ? activeQualityPill.dataset.quality : 'GOOD';
    const activeFeelingPill = document.querySelector('.feeling-pill.active');
    const feeling = activeFeelingPill ? activeFeelingPill.dataset.feeling : 'Good & Refreshed';
    const notes = document.getElementById('sleep-notes') ? document.getElementById('sleep-notes').value : '';

    try {
      await window.api.logSleep({
        sleep_duration_hours: hours,
        sleep_quality: quality,
        wake_feeling: feeling,
        notes: notes
      });
      showToast('Sleep metrics recorded to your account!');
      await this.loadTodayData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async saveLifestyleLog() {
    const work = document.getElementById('tracking-work-routine') ? document.getElementById('tracking-work-routine').value : 'Desk/Screen work indoors';
    const exFreq = document.getElementById('tracking-exercise-freq') ? document.getElementById('tracking-exercise-freq').value : '3-4 times a week';
    const exercise = parseInt(document.getElementById('exercise-mins-input').value || 30);
    const stress = parseInt(document.getElementById('stress-level-slider').value);
    const diet = parseInt(document.getElementById('diet-quality-slider').value);
    const smoking = document.getElementById('smoking-status-select') ? document.getElementById('smoking-status-select').value : 'Non-smoker';

    try {
      await window.api.logLifestyle({
        working_routine: work,
        exercise_frequency: exFreq,
        exercise_minutes: exercise,
        stress_level: stress,
        diet_quality_score: diet,
        smoking_status: smoking
      });
      showToast('Lifestyle metrics saved to your account!');
      await this.loadTodayData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async saveEnvironmentLog() {
    const sunHours = parseFloat(document.getElementById('env-sun-hours-slider').value);
    const uv = parseFloat(document.getElementById('env-uv-input') ? document.getElementById('env-uv-input').value : 4.5);
    const dust = document.getElementById('env-dust-select').value;
    const weather = document.getElementById('env-weather-select').value;

    try {
      await window.api.logEnvironment({
        sun_exposure_hours: sunHours,
        uv_index: uv,
        dust_pollution_exposure: dust,
        weather_condition: weather,
        pollution_aqi: 45,
        humidity_percent: 55.0
      });
      showToast('Environmental exposure saved to your account!');
      await this.loadTodayData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

window.tracking = new TrackingController();
