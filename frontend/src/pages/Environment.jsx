import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { trackingService } from '../services/tracking';
import { weatherService } from '../services/weatherService';
import {
  Sun,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Save,
  Cloud,
  ShieldAlert,
  MapPin,
  Navigation,
  RefreshCw,
  Droplets,
  Wind,
  Sparkles,
  Thermometer,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import { DailyTrackingNav } from '../components/ui/DailyTrackingNav';

const Environment = () => {
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [uv, setUv] = useState('MODERATE');
  const [pollution, setPollution] = useState('LOW');
  const [outdoorTime, setOutdoorTime] = useState(60); // minutes
  const [climate, setClimate] = useState('TEMPERATE');

  // Live Weather Telemetry State
  const [liveWeather, setLiveWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [autoApplied, setAutoApplied] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchRecords = async () => {
    try {
      const data = await trackingService.getEnvironment();
      setRecords(data || []);

      const todayLog = (data || []).find((r) => r.record_date === todayStr);
      if (todayLog) {
        setTodayRecord(todayLog);
        setUv(todayLog.uv_exposure);
        setPollution(todayLog.pollution_exposure);
        setOutdoorTime(todayLog.outdoor_time_minutes);
        setClimate(todayLog.climate);
      } else {
        setTodayRecord(null);
      }
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Live Weather Telemetry
  const fetchLiveWeather = useCallback(async (params = {}) => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const data = await weatherService.getLiveTelemetry(params);
      setLiveWeather(data);
    } catch (err) {
      setWeatherError(err.response?.data?.detail || err.message || 'Failed to fetch live weather data.');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    // Load initial weather baseline (auto queries profile location or default)
    fetchLiveWeather();
  }, [fetchLiveWeather]);

  // Handle GPS Auto-Detect
  const handleAutoDetectGPS = async () => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const coords = await weatherService.detectBrowserLocation();
      await fetchLiveWeather({ lat: coords.lat, lon: coords.lon });
    } catch (err) {
      setWeatherError(err.message || 'Could not access device location.');
      setWeatherLoading(false);
    }
  };

  // Handle City Search
  const handleCitySearch = (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    fetchLiveWeather({ city: cityInput.trim() });
  };

  // Apply Live Readings to Form
  const handleApplyLiveReadings = () => {
    if (!liveWeather?.classified_exposure) return;
    const { uv_exposure, pollution_exposure, climate: liveClimate } = liveWeather.classified_exposure;
    setUv(uv_exposure);
    setPollution(pollution_exposure);
    setClimate(liveClimate);
    setAutoApplied(true);
    setTimeout(() => setAutoApplied(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    const payload = {
      uv_exposure: uv,
      pollution_exposure: pollution,
      outdoor_time_minutes: parseInt(outdoorTime) || 0,
      climate,
      record_date: todayStr,
    };

    try {
      if (todayRecord) {
        const updated = await trackingService.updateEnvironment(todayRecord.id, payload);
        setTodayRecord(updated);
      } else {
        const created = await trackingService.createEnvironment(payload);
        setTodayRecord(created);
      }
      setSuccess(true);
      await fetchRecords();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save environmental log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    try {
      await trackingService.deleteEnvironment(id);
      if (todayRecord && todayRecord.id === id) {
        setTodayRecord(null);
        setUv('MODERATE');
        setPollution('LOW');
        setOutdoorTime(60);
        setClimate('TEMPERATE');
      }
      await fetchRecords();
    } catch (err) {
      setError('Failed to delete log.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-8 w-8 border-3 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[var(--color-text-muted)] font-medium">Loading environmental metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        badge="Exposome Biometrics"
        title="Environmental Exposure & Live UV Telemetry"
        subtitle="Real-time satellite & ground sensor telemetry tracks UV index, ambient humidity, temperature, and particulate pollution to calibrate antioxidant and barrier defense."
      />

      {/* Daily Tracking Stepper Bar */}
      <DailyTrackingNav currentStep="environment" showBottomBar={false} />

      {/* Live Satellite Weather & UV Radar Panel */}
      <div className="bg-gradient-to-br from-[var(--color-surface-1)] via-white to-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-sm)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Sun size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Live Meteorological & Atmospheric Feed
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Open-Meteo
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
                <MapPin size={12} className="text-[var(--color-brand)]" />
                <span>{liveWeather?.location_label || 'Resolving location...'}</span>
              </p>
            </div>
          </div>

          {/* Quick Auto-Detect & Search Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoDetectGPS}
              disabled={weatherLoading}
              className="px-3 py-1.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] text-xs font-semibold rounded-[var(--radius-lg)] border border-[var(--color-border)] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              title="Detect device GPS coordinates"
            >
              <Navigation size={13} className={weatherLoading ? 'animate-spin' : 'text-[var(--color-brand)]'} />
              <span>Auto-Detect GPS</span>
            </button>

            <form onSubmit={handleCitySearch} className="flex items-center gap-1">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Search city (e.g. Mumbai, Delhi)..."
                className="px-3 py-1.5 bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand)] w-44"
              />
              <button
                type="submit"
                disabled={weatherLoading || !cityInput.trim()}
                className="px-2.5 py-1.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-medium rounded-[var(--radius-lg)] transition-all disabled:opacity-50"
              >
                Lookup
              </button>
            </form>
          </div>
        </div>

        {weatherError && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-[var(--radius-lg)] text-xs flex gap-2 items-center">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
            <span>{weatherError}</span>
          </div>
        )}

        {/* Real-time Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {/* UV Tile */}
          <div className="p-3.5 bg-white rounded-xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
              <span className="flex items-center gap-1">
                <Sun size={14} className="text-amber-500" /> UV Index
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  liveWeather?.classified_exposure?.uv_exposure === 'HIGH'
                    ? 'bg-rose-50 text-rose-700'
                    : liveWeather?.classified_exposure?.uv_exposure === 'MODERATE'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {liveWeather?.classified_exposure?.uv_exposure || 'MODERATE'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--color-text-primary)] font-mono">
                {liveWeather?.raw_telemetry?.uv_index?.toFixed(1) ?? '—'}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">solar irradiance</span>
            </div>
          </div>

          {/* Humidity Tile */}
          <div className="p-3.5 bg-white rounded-xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
              <span className="flex items-center gap-1">
                <Droplets size={14} className="text-blue-500" /> Humidity
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                {liveWeather?.classified_exposure?.climate || 'TEMPERATE'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--color-text-primary)] font-mono">
                {liveWeather?.raw_telemetry?.humidity_pct !== undefined
                  ? `${Math.round(liveWeather.raw_telemetry.humidity_pct)}%`
                  : '—'}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">relative</span>
            </div>
          </div>

          {/* Temperature Tile */}
          <div className="p-3.5 bg-white rounded-xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
              <span className="flex items-center gap-1">
                <Thermometer size={14} className="text-orange-500" /> Temperature
              </span>
              <span className="text-[10px] font-mono text-[var(--color-text-muted)]">2m surface</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--color-text-primary)] font-mono">
                {liveWeather?.raw_telemetry?.temperature_c !== undefined
                  ? `${liveWeather.raw_telemetry.temperature_c.toFixed(1)}°C`
                  : '—'}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">ambient</span>
            </div>
          </div>

          {/* Air Quality Tile */}
          <div className="p-3.5 bg-white rounded-xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
              <span className="flex items-center gap-1">
                <Wind size={14} className="text-emerald-500" /> Air Quality
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  liveWeather?.classified_exposure?.pollution_exposure === 'HIGH'
                    ? 'bg-rose-50 text-rose-700'
                    : liveWeather?.classified_exposure?.pollution_exposure === 'MODERATE'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {liveWeather?.classified_exposure?.pollution_exposure || 'LOW'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--color-text-primary)] font-mono">
                {liveWeather?.raw_telemetry?.pm2_5 !== undefined
                  ? `${Math.round(liveWeather.raw_telemetry.pm2_5)}`
                  : '—'}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">µg/m³ PM2.5</span>
            </div>
          </div>
        </div>

        {/* Clinical Advice & Auto-Fill Action */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand)]">
              <ShieldCheck size={14} />
              <span>Targeted Exposome Skincare Protocols</span>
            </div>
            <ul className="text-[11px] text-[var(--color-text-secondary)] space-y-0.5 list-disc list-inside">
              {liveWeather?.clinical_advice && liveWeather.clinical_advice.length > 0 ? (
                liveWeather.clinical_advice.map((item, idx) => <li key={idx}>{item}</li>)
              ) : (
                <li>Maintain daily broad-spectrum SPF 30+ barrier coverage and keep skin hydrated.</li>
              )}
            </ul>
          </div>

          <button
            onClick={handleApplyLiveReadings}
            disabled={!liveWeather}
            className="self-start md:self-auto px-4 py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Sparkles size={14} />
            <span>{autoApplied ? 'Readings Applied to Form!' : 'Apply Live Readings to Form'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logger Form */}
        <div className="lg:col-span-1 bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
              <Sun className="text-[var(--color-brand)]" size={18} />
              <span>Log Exposome Exposure</span>
            </h3>
            <span className="text-[11px] font-mono text-[var(--color-text-muted)]">{todayStr}</span>
          </div>

          {autoApplied && (
            <div className="p-2.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-[var(--radius-lg)] text-xs flex gap-2 items-center">
              <Sparkles size={14} className="text-sky-600 flex-shrink-0" />
              <span>Populated form with live local readings!</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[var(--radius-lg)] text-xs space-y-1.5">
              <div className="flex gap-2 items-center">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Environmental exposure entry saved!</span>
              </div>
              <div className="pl-6">
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 underline text-xs">
                  <LayoutDashboard size={13} />
                  <span>All Daily Tracking Complete! Return to Dashboard →</span>
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-[var(--radius-lg)] text-xs flex gap-2 items-center">
              <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 text-[11px]">
                  UV Exposure
                </label>
                <select
                  value={uv}
                  onChange={(e) => setUv(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
                >
                  <option value="LOW">Low (Index 0-2)</option>
                  <option value="MODERATE">Moderate (Index 3-5)</option>
                  <option value="HIGH">High (Index 6+)</option>
                </select>
              </div>
              <div>
                <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 text-[11px]">
                  Pollution Level
                </label>
                <select
                  value={pollution}
                  onChange={(e) => setPollution(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
                >
                  <option value="LOW">Low (Clean)</option>
                  <option value="MODERATE">Moderate (Suburban)</option>
                  <option value="HIGH">High (Dense Urban)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 text-[11px]">
                  Outdoor (min)
                </label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={outdoorTime}
                  onChange={(e) => setOutdoorTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
                />
              </div>
              <div>
                <label className="block text-[var(--color-text-secondary)] uppercase tracking-wider mb-1 text-[11px]">
                  Climate Type
                </label>
                <select
                  value={climate}
                  onChange={(e) => setClimate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-xs text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15"
                >
                  <option value="TEMPERATE">Temperate</option>
                  <option value="DRY">Dry / Arid</option>
                  <option value="HUMID">Humid / Tropical</option>
                  <option value="COLD">Cold / Freezing</option>
                  <option value="HOT">Hot / Intense Sun</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 mt-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-bold rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={14} />
                  <span>{todayRecord ? 'Update Exposure Entry' : 'Save Exposure Entry'}</span>
                </>
              )}
            </button>

            {/* In-form step navigation: Last entry connects back to Dashboard */}
            <div className="pt-3 flex items-center justify-between border-t border-[var(--color-border)] mt-4">
              <Link
                to="/hydration"
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 font-semibold transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Prev: Hydration</span>
              </Link>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow transition-all group"
              >
                <LayoutDashboard size={14} />
                <span>Finish & Go to Dashboard</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </form>
        </div>

        {/* History Card */}
        <div className="lg:col-span-2 bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-sm)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-base text-[var(--color-text-primary)]">Environmental History Logs</h3>
            <span className="text-xs text-[var(--color-text-muted)]">{records.length} records</span>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">UV Level</th>
                  <th className="py-2.5 px-3">Pollution</th>
                  <th className="py-2.5 px-3">Climate</th>
                  <th className="py-2.5 px-3">Sun Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {records.length > 0 ? (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[var(--color-text-primary)]">{rec.record_date}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                            rec.uv_exposure === 'HIGH'
                              ? 'bg-rose-50 text-rose-700'
                              : rec.uv_exposure === 'MODERATE'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {rec.uv_exposure}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[var(--color-text-secondary)]">{rec.pollution_exposure}</td>
                      <td className="py-3 px-3 font-semibold text-[var(--color-text-primary)]">{rec.climate}</td>
                      <td className="py-3 px-3 text-[var(--color-text-secondary)]">{rec.outdoor_time_minutes} min</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-[var(--color-text-muted)] italic">
                      No environmental logs found. Log your UV & climate exposure above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Tracking Navigation Flow Bar */}
      <DailyTrackingNav currentStep="environment" showStepper={false} showBottomBar={true} />
    </div>
  );
};

export default Environment;
