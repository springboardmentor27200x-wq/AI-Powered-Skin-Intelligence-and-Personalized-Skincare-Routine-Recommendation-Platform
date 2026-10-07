import React, { useState } from 'react';
import { api } from './api';

export default function SkinProfileWizard({ onProfileComplete }) {
  const [step, setStep] = useState(1);
  const [skinType, setSkinType] = useState('Combination');
  const [ageGroup, setAgeGroup] = useState('25-34');
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [sensitivityInput, setSensitivityInput] = useState('');
  const [sensitivities, setSensitivities] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const skinTypes = ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive'];
  const ageGroups = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'];
  
  const commonConcerns = [
    'Acne', 'Hyperpigmentation', 'Dark Spots', 'Dry Skin', 
    'Oily Skin', 'Sensitive Skin', 'Wrinkles', 'Fine Lines', 
    'Redness', 'Uneven Skin Tone'
  ];

  const handleConcernToggle = (concern) => {
    if (selectedConcerns.includes(concern)) {
      setSelectedConcerns(selectedConcerns.filter(c => c !== concern));
    } else {
      setSelectedConcerns([...selectedConcerns, concern]);
    }
  };

  const handleAddAllergy = (e) => {
    e.preventDefault();
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleAddSensitivity = (e) => {
    e.preventDefault();
    if (sensitivityInput.trim() && !sensitivities.includes(sensitivityInput.trim())) {
      setSensitivities([...sensitivities, sensitivityInput.trim()]);
      setSensitivityInput('');
    }
  };

  const removeAllergy = (item) => {
    setAllergies(allergies.filter(a => a !== item));
  };

  const removeSensitivity = (item) => {
    setSensitivities(sensitivities.filter(s => s !== item));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.saveProfile({
        skin_type: skinType,
        age_group: ageGroup,
        skin_concerns: selectedConcerns,
        allergies,
        sensitivities
      });
      onProfileComplete(data);
    } catch (err) {
      setError(err.message || 'Failed to save skin profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-container">
      <div className="wizard-card">
        {/* Progress indicator */}
        <div className="wizard-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        <div className="wizard-header">
          <h2>Skin Profile Setup</h2>
          <p className="wizard-subtitle">Help us customize your personalized skincare planner</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* STEP 1: Skin Type & Age */}
        {step === 1 && (
          <div className="wizard-step" id="wizard-step-1">
            <h3>Step 1: Skin Type & Age Group</h3>
            
            <div className="form-group">
              <label>Select Your Skin Type</label>
              <div className="radio-grid">
                {skinTypes.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`choice-card ${skinType === t ? 'selected' : ''}`}
                    onClick={() => setSkinType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Select Your Age Group</label>
              <div className="radio-grid">
                {ageGroups.map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`choice-card ${ageGroup === g ? 'selected' : ''}`}
                    onClick={() => setAgeGroup(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="wizard-nav">
              <span className="spacer"></span>
              <button 
                type="button" 
                className="nav-btn next-btn" 
                onClick={() => setStep(2)}
                id="wizard-next-1"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Skin Concerns */}
        {step === 2 && (
          <div className="wizard-step" id="wizard-step-2">
            <h3>Step 2: Skin Concerns</h3>
            <p className="step-desc">Select all the concerns you would like to address (select all that apply)</p>
            
            <div className="concerns-grid">
              {commonConcerns.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`concern-chip ${selectedConcerns.includes(c) ? 'selected' : ''}`}
                  onClick={() => handleConcernToggle(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="wizard-nav">
              <button 
                type="button" 
                className="nav-btn prev-btn" 
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button 
                type="button" 
                className="nav-btn next-btn" 
                onClick={() => setStep(3)}
                id="wizard-next-2"
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Allergies & Sensitivities */}
        {step === 3 && (
          <div className="wizard-step" id="wizard-step-3">
            <h3>Step 3: Allergies & Sensitivities</h3>
            <p className="step-desc">Let us know if there are specific ingredients or chemicals we should avoid</p>

            <div className="form-group">
              <label htmlFor="allergy-input">Allergies (e.g. Parabens, Fragrance)</label>
              <div className="inline-form">
                <input
                  id="allergy-input"
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="Type an allergy and press Add"
                />
                <button type="button" onClick={handleAddAllergy} className="add-item-btn">Add</button>
              </div>
              <div className="tags-container">
                {allergies.map(a => (
                  <span key={a} className="tag-badge">
                    {a}
                    <button type="button" onClick={() => removeAllergy(a)} className="remove-tag">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sensitivity-input">Sensitivities (e.g. Alcohol, Lanolin)</label>
              <div className="inline-form">
                <input
                  id="sensitivity-input"
                  type="text"
                  value={sensitivityInput}
                  onChange={(e) => setSensitivityInput(e.target.value)}
                  placeholder="Type a sensitivity and press Add"
                />
                <button type="button" onClick={handleAddSensitivity} className="add-item-btn">Add</button>
              </div>
              <div className="tags-container">
                {sensitivities.map(s => (
                  <span key={s} className="tag-badge sensitivity-badge">
                    {s}
                    <button type="button" onClick={() => removeSensitivity(s)} className="remove-tag">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="wizard-nav">
              <button 
                type="button" 
                className="nav-btn prev-btn" 
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button 
                type="button" 
                className="nav-btn finish-btn" 
                onClick={handleSubmit}
                disabled={loading}
                id="wizard-finish"
              >
                {loading ? 'Submitting...' : 'Complete Profile ✦'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
