import React, { useState, useEffect } from 'react';
import { api } from './api';

export default function LifestyleLogger({ onLogSubmitted, onClose }) {
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [sleepHours, setSleepHours] = useState(7.0);
  const [sleepQuality, setSleepQuality] = useState('Good');
  const [waterIntakeMl, setWaterIntakeMl] = useState(2000);
  const [uvExposure, setUvExposure] = useState('Moderate');
  const [pollutionExposure, setPollutionExposure] = useState('Low');
  const [stressLevel, setStressLevel] = useState('Medium');
  const [sunscreenApplied, setSunscreenApplied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadTodayLog = async () => {
    try {
      const data = await api.getTodayLog();
      // If today's log exists, prefill it!
      setSleepHours(data.sleep_hours);
      setSleepQuality(data.sleep_quality);
      setWaterIntakeMl(data.water_intake_ml);
      setUvExposure(data.uv_exposure || 'Moderate');
      setPollutionExposure(data.pollution_exposure || 'Low');
      setStressLevel(data.stress_level || 'Medium');
      setSunscreenApplied(data.sunscreen_applied);
    } catch (err) {
      // If it returns 404, we just use defaults. No action needed.
    }
  };

  useEffect(() => {
    loadTodayLog();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const data = await api.saveLifestyleLog({
        log_date: logDate,
        sleep_hours: parseFloat(sleepHours),
        sleep_quality: sleepQuality,
        water_intake_ml: parseInt(waterIntakeMl),
        uv_exposure: uvExposure,
        pollution_exposure: pollutionExposure,
        stress_level: stressLevel,
        sunscreen_applied: sunscreenApplied
      });
      setSuccess(true);
      setTimeout(() => {
        onLogSubmitted(data);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to submit lifestyle log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Daily Lifestyle Logger</h2>
          <button type="button" onClick={onClose} className="close-modal-btn">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Log saved successfully!</div>}

        <form onSubmit={handleSubmit} className="modal-form" id="lifestyle-log-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="logDate">Log Date</label>
              <input
                id="logDate"
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="sleepHours">Sleep Duration (Hours)</label>
              <input
                id="sleepHours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sleepQuality">Sleep Quality</label>
              <select
                id="sleepQuality"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(e.target.value)}
                required
              >
                <option value="Poor">Poor</option>
                <option value="Fair">Fair</option>
                <option value="Good">Good</option>
                <option value="Excellent">Excellent</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="waterIntake">Water Intake (ml)</label>
              <input
                id="waterIntake"
                type="number"
                min="0"
                step="50"
                value={waterIntakeMl}
                onChange={(e) => setWaterIntakeMl(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="uvExposure">UV Exposure Level</label>
              <select
                id="uvExposure"
                value={uvExposure}
                onChange={(e) => setUvExposure(e.target.value)}
              >
                <option value="None">None</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="pollutionExposure">Pollution Level</label>
              <select
                id="pollutionExposure"
                value={pollutionExposure}
                onChange={(e) => setPollutionExposure(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stressLevel">Stress Level</label>
              <select
                id="stressLevel"
                value={stressLevel}
                onChange={(e) => setStressLevel(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="sunscreenApplied" className="checkbox-label">
                <input
                  id="sunscreenApplied"
                  type="checkbox"
                  checked={sunscreenApplied}
                  onChange={(e) => setSunscreenApplied(e.target.checked)}
                />
                <span>Applied Sunscreen Today</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" className="save-btn" disabled={loading} id="lifestyle-log-submit">
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
