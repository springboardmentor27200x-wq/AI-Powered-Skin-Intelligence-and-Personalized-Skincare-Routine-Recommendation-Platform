import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sun,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Info,
  Flame,
  Droplets,
  Eye,
  FileText,
  Printer,
  X,
  Compass,
  MapPin,
  Check,
  ChevronRight,
  TrendingDown,
  Camera,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

// FITZPATRICK TYPES DATABASE
const FITZPATRICK_TYPES = [
  {
    type: 'I',
    name: 'Type I: Extremely Fair',
    desc: 'Always burns easily, never tans. High risk of severe photodamage & erythema.',
    med: 20, // mJ/cm^2 baseline
    baseBurnMins: 10,
    hex: '#FBE9E7',
    textColor: '#8D2034',
  },
  {
    type: 'II',
    name: 'Type II: Fair / Light',
    desc: 'Burns easily, tans minimally with difficulty. High susceptibility to solar elastosis.',
    med: 30,
    baseBurnMins: 15,
    hex: '#F8D8CE',
    textColor: '#9E3A4B',
  },
  {
    type: 'III',
    name: 'Type III: Medium / Olive Undertone',
    desc: 'Burns moderately, tans gradually to light brown. Moderate hyperpigmentation risk.',
    med: 45,
    baseBurnMins: 22,
    hex: '#EFC9B6',
    textColor: '#8C4D35',
  },
  {
    type: 'IV',
    name: 'Type IV: Olive / Mediterranean',
    desc: 'Burns minimally, tans easily to moderate brown. Prone to post-inflammatory hyperpigmentation (PIH).',
    med: 60,
    baseBurnMins: 30,
    hex: '#D7A78A',
    textColor: '#6E3C22',
  },
  {
    type: 'V',
    name: 'Type V: Brown / South Asian & Latin',
    desc: 'Rarely burns, tans profusely to dark brown. High risk of melasma & pigmentary changes under UVA/Visible light.',
    med: 90,
    baseBurnMins: 45,
    hex: '#A57353',
    textColor: '#422412',
  },
  {
    type: 'VI',
    name: 'Type VI: Deep / Dark Pigmented',
    desc: 'Never burns, deeply pigmented. Protected against UVB erythema, but vulnerable to UVA-induced melasma & cellular degradation.',
    med: 130,
    baseBurnMins: 60,
    hex: '#5E3E2B',
    textColor: '#FFFFFF',
  },
];

// SUNSCREEN FORMULATION DATABASE
const FORMULATIONS = {
  mineral: {
    id: 'mineral',
    name: 'Mineral Physical Shield (Zinc Oxide 20% + TiO2 5%)',
    tag: 'Physical Reflector',
    uva_pf: 24,
    pa: 'PA++++',
    crit_wl: 382,
    hev_blue: 68,
    active: 'Zinc Oxide 20.0%, Titanium Dioxide 5.0%',
    pros: 'Photostable, immediate protection, ideal for sensitive skin and post-procedure barriers.',
    cons: 'May leave slight white cast on deeper Fitzpatrick types unless tinted.',
    absorptionProfile: [99.5, 99.2, 98.8, 97.5, 96.0, 94.2, 91.5, 88.0, 82.0, 75.0, 68.0],
  },
  chemical: {
    id: 'chemical',
    name: 'Chemical Matrix (Avobenzone 3% + Octocrylene 7% + Octisalate 5%)',
    tag: 'Organic Absorber',
    uva_pf: 18,
    pa: 'PA+++',
    crit_wl: 374,
    hev_blue: 32,
    active: 'Avobenzone 3.0%, Octocrylene 7.0%, Octisalate 5.0%, Homosalate 8.0%',
    pros: 'Invisible clear finish on all skin tones, lightweight texture, excellent sweat bonding.',
    cons: 'Requires 15 min pre-activation; can trigger stinging in sensitized ocular zones.',
    absorptionProfile: [99.8, 99.6, 99.1, 95.0, 92.0, 89.0, 82.0, 71.0, 55.0, 40.0, 32.0],
  },
  hybrid: {
    id: 'hybrid',
    name: 'Modern Advanced Hybrid (Tinosorb M + Tinosorb S + Uvinul A Plus)',
    tag: 'Clinical Gold Standard',
    uva_pf: 38,
    pa: 'PA++++',
    crit_wl: 388,
    hev_blue: 84,
    active: 'Tinosorb S (4%), Tinosorb M (5%), Uvinul A Plus (3%), Iscotrizinol (2%)',
    pros: 'Broadest continuous spectral coverage (290nm - 420nm), high photostability, zero endocrine disruption.',
    cons: 'Premium clinical formulation cost.',
    absorptionProfile: [99.9, 99.8, 99.6, 99.2, 98.6, 97.9, 96.5, 94.0, 90.0, 86.0, 84.0],
  },
};

// CITY PRESETS WITH GEOLOCATION UV PROFILES
const CITY_PRESETS = [
  { name: 'Miami, USA', uv: 9.5, temp: '31°C', lat: '25.76° N' },
  { name: 'Sydney, Australia', uv: 11.2, temp: '28°C', lat: '33.86° S' },
  { name: 'Dubai, UAE', uv: 10.8, temp: '38°C', lat: '25.20° N' },
  { name: 'Tokyo, Japan', uv: 6.4, temp: '24°C', lat: '35.67° N' },
  { name: 'London, UK', uv: 3.8, temp: '19°C', lat: '51.50° N' },
  { name: 'Singapore', uv: 11.8, temp: '32°C', lat: '1.35° N' },
  { name: 'Mumbai, India', uv: 9.8, temp: '33°C', lat: '19.07° N' },
  { name: 'Los Angeles, USA', uv: 8.2, temp: '26°C', lat: '34.05° N' },
];

export default function UVProtectionTestingLab({ user, profile }) {
  // Test Controls State
  const [selectedFitzi, setSelectedFitzi] = useState(1); // Default Fitzpatrick Type II (index 1)
  const [testSpf, setTestSpf] = useState(50);
  const [formulationKey, setFormulationKey] = useState('hybrid');
  const [uvIndex, setUvIndex] = useState(8);
  const [altitudeMeters, setAltitudeMeters] = useState(0); // 0m to 3000m
  const [surfaceReflection, setSurfaceReflection] = useState('normal'); // 'normal' (4%), 'sand' (15%), 'water' (25%), 'snow' (80%)
  const [cloudCover, setCloudCover] = useState('clear'); // 'clear' (1.0), 'scattered' (0.8), 'overcast' (0.35)

  // Application Dosage Simulation (Standard: 2.0 mg/cm^2)
  const [appliedDosage, setAppliedDosage] = useState(2.0); // 0.2 to 2.5 mg/cm^2
  const [waterSweatExposureMins, setWaterSweatExposureMins] = useState(0); // 0, 40, 80 mins
  const [frictionStress, setFrictionStress] = useState(false); // Mask rubbing / towel
  const [hoursSinceApplication, setHoursSinceApplication] = useState(1.5); // 0 to 6 hours

  // UV Camera Face Simulation States
  const [viewMode, setViewMode] = useState('woods_lamp'); // 'visible', 'woods_lamp', 'protected_uv', 'split'
  const [splitPosition, setSplitPosition] = useState(50); // 0% to 100%
  const [coverageScenario, setCoverageScenario] = useState('full'); // 'full', 'missed_eyes_nose', 'sheer', 'unprotected'

  // Reapplication Timer State
  const [reapplyMinutesLeft, setReapplyMinutesLeft] = useState(72);
  const [reapplyLogged, setReapplyLogged] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Export Modal State
  const [showDossierModal, setShowDossierModal] = useState(false);

  // Active City
  const [selectedCity, setSelectedCity] = useState(CITY_PRESETS[0]);

  const fitz = FITZPATRICK_TYPES[selectedFitzi];
  const currentFormula = FORMULATIONS[formulationKey];

  // ============================================================
  // MATHEMATICAL DERMATOLOGY CALCULATIONS
  // ============================================================

  // 1. Altitude UV Increase: +4% per 300m
  const altitudeMultiplier = 1 + (altitudeMeters / 300) * 0.04;

  // 2. Reflection Multiplier
  const reflectionMultiplier = useMemo(() => {
    switch (surfaceReflection) {
      case 'sand': return 1.15;
      case 'water': return 1.25;
      case 'snow': return 1.80;
      default: return 1.04;
    }
  }, [surfaceReflection]);

  // 3. Cloud Multiplier
  const cloudMultiplier = useMemo(() => {
    switch (cloudCover) {
      case 'overcast': return 0.35;
      case 'scattered': return 0.80;
      default: return 1.0;
    }
  }, [cloudCover]);

  // Effective Ambient UV Index
  const effectiveUvi = Math.max(0.5, (uvIndex * altitudeMultiplier * reflectionMultiplier * cloudMultiplier));

  // 4. Effective Real-World SPF based on Application Thickness & Degradation
  // Real SPF follows exponential power law: Real SPF = Test SPF ^ (Applied Dosage / 2.0)
  const theoreticalSpf = Math.max(1, Math.pow(testSpf, appliedDosage / 2.0));

  // Water / Sweat Degradation
  const waterDegradationFactor = Math.max(0.3, 1 - (waterSweatExposureMins / 80) * 0.45);
  // Friction & Time decay
  const frictionFactor = frictionStress ? 0.75 : 1.0;
  const timeDecayFactor = Math.max(0.2, 1 - (hoursSinceApplication / 4) * 0.55);

  const realWorldSpf = Math.max(1, theoreticalSpf * waterDegradationFactor * frictionFactor * timeDecayFactor);

  // 5. Transmittance and Photon Blockage %
  const uvbBlockPercent = ((1 - 1 / realWorldSpf) * 100);
  const uvbPenetrationPercent = (100 / realWorldSpf);

  // 6. Minimal Erythema Dose & Burn Time Calculation
  // Unprotected Safe Burn Time = (fitz.baseBurnMins * 10) / effectiveUvi
  const unprotectedBurnMins = Math.max(2, Math.round((fitz.baseBurnMins * 10) / effectiveUvi));
  const protectedBurnMins = Math.min(960, Math.round(unprotectedBurnMins * realWorldSpf));

  // 7. DNA Cyclobutane Pyrimidine Dimer (CPD) Photodamage Risk Index (0 - 100)
  const cpdRiskScore = Math.min(
    100,
    Math.round(((effectiveUvi / 12) * (100 - uvbBlockPercent) * 4) + (hoursSinceApplication > 2 ? 25 : 5))
  );

  // Reapplication countdown decrement simulation
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setReapplyMinutesLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 60000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleLogReapply = () => {
    setReapplyLogged(true);
    setReapplyMinutesLeft(120);
    setHoursSinceApplication(0);
    setTimeout(() => setReapplyLogged(false), 4000);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setUvIndex(city.uv);
  };

  // ============================================================
  // CHART 1: SPECTRAL TRANSMITTANCE & OPTICAL ABSORPTION CURVE
  // ============================================================
  const wavelengths = ['290nm (UVB)', '305nm (UVB)', '320nm (UVA II)', '335nm (UVA II)', '350nm (UVA I)', '365nm (UVA I)', '380nm (Deep UVA)', '395nm (Border)', '405nm (HEV)', '415nm (Blue)', '430nm (Violet)'];

  const spectralChartData = {
    labels: wavelengths,
    datasets: [
      {
        label: `${currentFormula.name} (% Absorption)`,
        data: currentFormula.absorptionProfile.map((val) => {
          // Adjust absorption based on real world thickness
          const adjusted = val * (appliedDosage / 2.0) * waterDegradationFactor * timeDecayFactor;
          return Math.min(99.9, Math.max(10, adjusted)).toFixed(1);
        }),
        borderColor: '#C0637A',
        backgroundColor: 'rgba(192, 99, 122, 0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#C0637A',
        pointRadius: 5,
      },
      {
        label: 'Unprotected Epidermal UV Influx (0% Shield)',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#E2E8F0',
        borderDash: [5, 5],
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Critical Wavelength Threshold (λc ≥ 370nm)',
        data: [90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90],
        borderColor: '#B8924A',
        borderDash: [3, 3],
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const spectralChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (v) => `${v}%`,
          font: { size: 11, family: 'Inter' },
          color: '#718096',
        },
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        title: {
          display: true,
          text: 'Photon Absorption / Shielding Efficiency (%)',
          font: { size: 12, weight: '600' },
          color: '#4A5568',
        },
      },
      x: {
        ticks: { font: { size: 10, family: 'Inter' }, color: '#718096' },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12, family: 'Inter' }, boxWidth: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#1A1219',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  // ============================================================
  // CHART 2: DIURNAL HOURLY UV CURVE & SOLAR NOON
  // ============================================================
  const hours = ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM (Solar Noon)', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'];
  const hourlyUvValues = hours.map((h, i) => {
    // Parabolic bell curve peak at index 6 (12 PM)
    const normalized = Math.max(0, 1 - Math.pow((i - 6) / 5.5, 2));
    return parseFloat((normalized * effectiveUvi).toFixed(1));
  });

  const hourlyChartData = {
    labels: hours,
    datasets: [
      {
        label: `Simulated Hourly UV Index (${selectedCity.name})`,
        data: hourlyUvValues,
        borderColor: '#B8924A',
        backgroundColor: 'rgba(184, 146, 74, 0.15)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: hourlyUvValues.map((v) => (v >= 8 ? '#9B3D56' : v >= 6 ? '#C0637A' : '#B8924A')),
        pointRadius: 4,
      },
      {
        label: 'WHO Clinical Threshold for Mandatory Sunscreen (UVI ≥ 3)',
        data: new Array(hours.length).fill(3.0),
        borderColor: '#E53E3E',
        borderDash: [6, 4],
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const hourlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: Math.max(14, Math.ceil(effectiveUvi + 2)),
        ticks: { font: { size: 11 }, color: '#718096' },
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        title: { display: true, text: 'UV Index Scale (UVI)', font: { size: 12, weight: '600' } },
      },
      x: { ticks: { font: { size: 10 } }, grid: { display: false } },
    },
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
    },
  };

  return (
    <div className="uv-testing-lab-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* ========================================================
          HERO BANNER & DIAGNOSTIC CONTROLS
      ======================================================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFFDFD 0%, #FDF2F4 50%, #FAF0EE 100%)',
          borderRadius: 24,
          padding: '30px 32px',
          border: '1px solid rgba(192, 99, 122, 0.25)',
          boxShadow: '0 10px 30px rgba(192, 99, 122, 0.08)',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative background ring */}
        <div
          style={{
            position: 'absolute',
            right: -60,
            top: -60,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184, 146, 74, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div style={{ maxWidth: 680 }}>
            <div className="flex items-center gap-2 mb-2">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: 'rgba(192, 99, 122, 0.12)',
                  color: '#C0637A',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                <Sparkles size={13} /> Module 11: Photodamage & UV Defense Lab
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(184, 146, 74, 0.15)',
                  color: '#B8924A',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ISO 24443 & FDA Broad Spectrum Testing
              </span>
            </div>

            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: '#1A1219',
                margin: '0 0 10px 0',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
              }}
            >
              UV Photoprotection & Photodamage Testing Suite
            </h1>

            <p style={{ margin: 0, fontSize: 14, color: '#6A5862', lineHeight: 1.6 }}>
              Simulate high-irradiance solar environments, examine dermal melanin fluorescence with the virtual Wood’s Lamp UV camera, test chemical vs physical filter broad-spectrum transmittance, and calculate Fitzpatrick Minimal Erythema Dose (MED) burn thresholds.
            </p>
          </div>

          {/* QUICK TELEMETRY CARDS */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '16px 20px',
                border: '1px solid rgba(192, 99, 122, 0.2)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                minWidth: 150,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7E6C75', textTransform: 'uppercase' }}>
                Effective UV Index
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: effectiveUvi >= 8 ? '#9B3D56' : effectiveUvi >= 5 ? '#C0637A' : '#B8924A',
                  marginTop: 2,
                }}
              >
                {effectiveUvi.toFixed(1)} <span style={{ fontSize: 13, fontWeight: 600 }}>UVI</span>
              </div>
              <div style={{ fontSize: 11, color: '#6A5862', marginTop: 2 }}>
                {effectiveUvi >= 8 ? 'Very High / Extreme' : effectiveUvi >= 6 ? 'High Hazard' : 'Moderate'}
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '16px 20px',
                border: '1px solid rgba(184, 146, 74, 0.25)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                minWidth: 160,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7E6C75', textTransform: 'uppercase' }}>
                Effective Real SPF
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#B8924A', marginTop: 2 }}>
                SPF {realWorldSpf.toFixed(1)}
              </div>
              <div style={{ fontSize: 11, color: '#6A5862', marginTop: 2 }}>
                {uvbBlockPercent.toFixed(1)}% Photon Shield
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDossierModal(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 20px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: '0 6px 18px rgba(192, 99, 122, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: 140,
                gap: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <FileText size={18} />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          GRID ROW 1: WOOD'S LAMP UV CAMERA SCANNER & BURN CALCULATOR
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* LEFT COLUMN: MULTI-SPECTRAL UV CAMERA SCANNER (7 cols) */}
        <div
          className="lg:col-span-7"
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            border: '1px solid rgba(192, 99, 122, 0.2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera size={20} color="#C0637A" />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1A1219' }}>
                Virtual Wood’s Lamp & UV Camera Scanner
              </h2>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: '#FDE8EE',
                color: '#C0637A',
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              365nm UV Fluorescence
            </span>
          </div>

          {/* VIEW MODE TABS */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl mb-4 overflow-x-auto">
            {[
              { id: 'visible', label: '1. Visible Light (Natural)' },
              { id: 'woods_lamp', label: '2. Unprotected UV Lamp (Melanin Deep Scan)' },
              { id: 'protected_uv', label: '3. SPF 50 Shield (Black UV Absorption)' },
              { id: 'split', label: '4. Split Comparison Slider' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setViewMode(m.id)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 9,
                  fontSize: 12,
                  fontWeight: viewMode === m.id ? 700 : 500,
                  background: viewMode === m.id ? '#FFFFFF' : 'transparent',
                  color: viewMode === m.id ? '#C0637A' : '#4A5568',
                  boxShadow: viewMode === m.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* INTERACTIVE FACE VISUALIZER CANVAS */}
          <div
            style={{
              position: 'relative',
              height: 380,
              borderRadius: 16,
              overflow: 'hidden',
              background: '#0D080C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
            }}
          >
            {/* BASE SVG CLINICAL FACE ANATOMY */}
            <svg
              viewBox="0 0 400 400"
              style={{
                width: '100%',
                height: '100%',
                maxHeight: 380,
              }}
            >
              <defs>
                {/* Visible Skin Tone Gradient */}
                <radialGradient id="visSkinGrad" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor={fitz.hex} />
                  <stop offset="85%" stopColor={fitz.hex} stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#C98B6D" />
                </radialGradient>

                {/* Wood's Lamp Subdermal Photodamage Glow */}
                <radialGradient id="uvWoodsGrad" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="#2E113A" />
                  <stop offset="70%" stopColor="#1B0925" />
                  <stop offset="100%" stopColor="#0B030F" />
                </radialGradient>

                {/* Pitch Black Sunscreen Absorption Shield */}
                <radialGradient id="spfShieldGrad" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="#08080C" />
                  <stop offset="85%" stopColor="#030305" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>

                {/* Clip Path for Split Slider */}
                <clipPath id="splitClip">
                  <rect x="0" y="0" width={`${splitPosition * 4}`} height="400" />
                </clipPath>
              </defs>

              {/* LAYER A: UNDERLYING WOOD'S LAMP / UNPROTECTED DAMAGE */}
              <g>
                {/* Face Silhouette */}
                <ellipse cx="200" cy="200" rx="125" ry="160" fill="url(#uvWoodsGrad)" stroke="#4A154B" strokeWidth="2" />
                {/* Ears */}
                <ellipse cx="70" cy="200" rx="14" ry="32" fill="#1B0925" />
                <ellipse cx="330" cy="200" rx="14" ry="32" fill="#1B0925" />

                {/* Subdermal Deep Melanin Clusters / Freckles (Revealed by Wood's Lamp) */}
                <g fill="#61230B" opacity="0.9">
                  {/* Nose bridge & Forehead solar spots */}
                  <circle cx="195" cy="180" r="3" />
                  <circle cx="206" cy="185" r="4.5" />
                  <circle cx="188" cy="190" r="3.5" />
                  <circle cx="210" cy="175" r="2.5" />
                  <circle cx="192" cy="135" r="5" />
                  <circle cx="215" cy="140" r="4" />
                  <circle cx="178" cy="145" r="4" />
                  <circle cx="225" cy="130" r="3" />
                  {/* Cheek Lentigines */}
                  <circle cx="145" cy="210" r="6" />
                  <circle cx="135" cy="225" r="4.5" />
                  <circle cx="155" cy="230" r="7" />
                  <circle cx="125" cy="215" r="3.5" />
                  <circle cx="255" cy="210" r="6.5" />
                  <circle cx="268" cy="225" r="5" />
                  <circle cx="245" cy="230" r="6" />
                  <circle cx="275" cy="218" r="4" />
                </g>

                {/* Eyebrows, Eyes, Nose & Lip Contours */}
                <path d="M 130 150 Q 155 140 180 150" stroke="#7A3D7E" strokeWidth="3" fill="none" />
                <path d="M 220 150 Q 245 140 270 150" stroke="#7A3D7E" strokeWidth="3" fill="none" />
                <ellipse cx="155" cy="165" rx="16" ry="9" fill="#0C0410" stroke="#9A50A0" strokeWidth="1.5" />
                <ellipse cx="245" cy="165" rx="16" ry="9" fill="#0C0410" stroke="#9A50A0" strokeWidth="1.5" />
                <circle cx="155" cy="165" r="5" fill="#E2E8F0" />
                <circle cx="245" cy="165" r="5" fill="#E2E8F0" />
                {/* Nose */}
                <path d="M 200 160 L 195 215 Q 200 225 205 215 Z" fill="#2E113A" stroke="#7A3D7E" strokeWidth="1.5" />
                {/* Lips */}
                <path d="M 165 260 Q 200 252 235 260 Q 200 275 165 260" fill="#3D1426" stroke="#9E3A5A" strokeWidth="1.5" />
              </g>

              {/* LAYER B: PROTECTED WITH SUNSCREEN OR VISIBLE LIGHT (Rendered conditionally or with ClipPath) */}
              {(viewMode === 'visible' || viewMode === 'protected_uv' || viewMode === 'split') && (
                <g clipPath={viewMode === 'split' ? 'url(#splitClip)' : undefined}>
                  {/* Protected Mode: Sunscreen film absorbs UV light -> renders as pitch-black shield */}
                  {viewMode === 'protected_uv' || (viewMode === 'split' && splitPosition > 0) ? (
                    <g>
                      <ellipse cx="200" cy="200" rx="125" ry="160" fill="url(#spfShieldGrad)" stroke="#1F1B24" strokeWidth="3" />
                      <ellipse cx="70" cy="200" rx="14" ry="32" fill="#0A090D" />
                      <ellipse cx="330" cy="200" rx="14" ry="32" fill="#0A090D" />

                      {/* Sunscreen film sheen overlay */}
                      <ellipse cx="200" cy="180" rx="100" ry="110" fill="rgba(192, 99, 122, 0.08)" />

                      {/* Facial Contours in Deep Black UV Camera */}
                      <path d="M 130 150 Q 155 140 180 150" stroke="#332E38" strokeWidth="3" fill="none" />
                      <path d="M 220 150 Q 245 140 270 150" stroke="#332E38" strokeWidth="3" fill="none" />
                      <ellipse cx="155" cy="165" rx="16" ry="9" fill="#000000" stroke="#443D4C" strokeWidth="1.5" />
                      <ellipse cx="245" cy="165" rx="16" ry="9" fill="#000000" stroke="#443D4C" strokeWidth="1.5" />
                      <circle cx="155" cy="165" r="4" fill="#FFFFFF" />
                      <circle cx="245" cy="165" r="4" fill="#FFFFFF" />
                      <path d="M 165 260 Q 200 252 235 260 Q 200 275 165 260" fill="#151218" stroke="#332E38" strokeWidth="1.5" />

                      {/* Coverage Scenario: Missed Areas (e.g. Under Eyes or Nose Tip) */}
                      {coverageScenario === 'missed_eyes_nose' && (
                        <g>
                          {/* Exposed under-eye zone */}
                          <ellipse cx="155" cy="182" rx="20" ry="8" fill="#3E1447" opacity="0.9" />
                          <ellipse cx="245" cy="182" rx="20" ry="8" fill="#3E1447" opacity="0.9" />
                          {/* Exposed nose tip */}
                          <circle cx="200" cy="218" r="14" fill="#3E1447" opacity="0.9" />
                          <text x="200" y="240" fill="#FF8BA7" fontSize="9" textAnchor="middle" fontWeight="bold">
                            ⚠️ Missed Zone
                          </text>
                        </g>
                      )}
                    </g>
                  ) : null}

                  {/* Visible Light Mode (Natural Daylight) */}
                  {viewMode === 'visible' && (
                    <g>
                      <ellipse cx="200" cy="200" rx="125" ry="160" fill="url(#visSkinGrad)" stroke="#B87D65" strokeWidth="2" />
                      <ellipse cx="70" cy="200" rx="14" ry="32" fill={fitz.hex} />
                      <ellipse cx="330" cy="200" rx="14" ry="32" fill={fitz.hex} />
                      {/* Facial Contours */}
                      <path d="M 130 150 Q 155 140 180 150" stroke="#4A2818" strokeWidth="3.5" fill="none" />
                      <path d="M 220 150 Q 245 140 270 150" stroke="#4A2818" strokeWidth="3.5" fill="none" />
                      <ellipse cx="155" cy="165" rx="16" ry="9" fill="#FFFFFF" stroke="#683820" strokeWidth="1" />
                      <ellipse cx="245" cy="165" rx="16" ry="9" fill="#FFFFFF" stroke="#683820" strokeWidth="1" />
                      <circle cx="155" cy="165" r="7" fill="#422412" />
                      <circle cx="245" cy="165" r="7" fill="#422412" />
                      <circle cx="157" cy="163" r="2.5" fill="#FFFFFF" />
                      <circle cx="247" cy="163" r="2.5" fill="#FFFFFF" />
                      <path d="M 200 160 L 194 215 Q 200 225 206 215 Z" fill="#D99778" stroke="#B87050" strokeWidth="1" />
                      <path d="M 165 260 Q 200 252 235 260 Q 200 278 165 260" fill="#D46F7E" stroke="#A84C5C" strokeWidth="1" />
                    </g>
                  )}
                </g>
              )}

              {/* SPLIT SLIDER DIVIDER LINE */}
              {viewMode === 'split' && (
                <g>
                  <line
                    x1={`${splitPosition * 4}`}
                    y1="0"
                    x2={`${splitPosition * 4}`}
                    y2="400"
                    stroke="#C0637A"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                  <circle cx={`${splitPosition * 4}`} cy="200" r="14" fill="#C0637A" stroke="#FFFFFF" strokeWidth="2" />
                  <text x={`${splitPosition * 4}`} y="204" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
                    ⇄
                  </text>
                </g>
              )}
            </svg>

            {/* OVERLAY BADGES & HUD */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'rgba(26, 18, 25, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(192, 99, 122, 0.3)',
                color: '#FFFFFF',
                fontSize: 11,
              }}
            >
              {viewMode === 'visible' && '👁️ Visible Daylight Surface'}
              {viewMode === 'woods_lamp' && '🟣 Wood’s Lamp 365nm: Hidden Sunspots & Melanin'}
              {viewMode === 'protected_uv' && '🛡️ UV Camera: Full SPF 50 Broad Spectrum Absorption'}
              {viewMode === 'split' && `Left: SPF Shield (${splitPosition}%) | Right: Unprotected Photodamage`}
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                background: 'rgba(26, 18, 25, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(184, 146, 74, 0.3)',
                color: '#B8924A',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Photon Absorption: {uvbBlockPercent.toFixed(1)}%
            </div>
          </div>

          {/* SPLIT SLIDER CONTROL (when split view is active) */}
          {viewMode === 'split' && (
            <div className="mt-4 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>◀ Slide Left (Show Unprotected Damage)</span>
                <span>Slide Right (Show Full Sunscreen Film) ▶</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={splitPosition}
                onChange={(e) => setSplitPosition(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>
          )}

          {/* COVERAGE ANOMALY TESTER */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-600">
              Simulation Coverage Profile:
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCoverageScenario('full')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: coverageScenario === 'full' ? '#C0637A' : '#E2E8F0',
                  background: coverageScenario === 'full' ? '#FDE8EE' : '#FFFFFF',
                  color: coverageScenario === 'full' ? '#C0637A' : '#4A5568',
                }}
              >
                ✓ 100% Full Face Shield
              </button>
              <button
                type="button"
                onClick={() => setCoverageScenario('missed_eyes_nose')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: coverageScenario === 'missed_eyes_nose' ? '#9B3D56' : '#E2E8F0',
                  background: coverageScenario === 'missed_eyes_nose' ? '#FFF5F5' : '#FFFFFF',
                  color: coverageScenario === 'missed_eyes_nose' ? '#9B3D56' : '#4A5568',
                }}
              >
                ⚠️ Missed Spots (Periorbital & Nose Tip)
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FITZPATRICK & MED BURN-TIME CALCULATOR (5 cols) */}
        <div
          className="lg:col-span-5 flex flex-col justify-between"
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            border: '1px solid rgba(192, 99, 122, 0.2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame size={20} color="#B8924A" />
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1A1219' }}>
                  Fitzpatrick & MED Burn Threshold
                </h2>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#B8924A',
                  background: 'rgba(184, 146, 74, 0.12)',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                Minimal Erythema Dose
              </span>
            </div>

            {/* FITZPATRICK SELECTOR */}
            <div className="mb-4">
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Patient Fitzpatrick Skin Phototype
              </label>
              <div className="grid grid-cols-6 gap-1.5 mb-2">
                {FITZPATRICK_TYPES.map((f, idx) => (
                  <button
                    key={f.type}
                    type="button"
                    onClick={() => setSelectedFitzi(idx)}
                    style={{
                      padding: '8px 2px',
                      borderRadius: 10,
                      border: '2px solid',
                      borderColor: selectedFitzi === idx ? '#C0637A' : '#E2E8F0',
                      background: f.hex,
                      color: f.textColor,
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: selectedFitzi === idx ? '0 0 0 3px rgba(192, 99, 122, 0.25)' : 'none',
                    }}
                  >
                    {f.type}
                  </button>
                ))}
              </div>
              <div
                style={{
                  background: '#FDF2F4',
                  borderRadius: 12,
                  padding: '10px 14px',
                  border: '1px solid rgba(192, 99, 122, 0.15)',
                  fontSize: 12,
                  color: '#4A2832',
                }}
              >
                <strong>{fitz.name}:</strong> {fitz.desc} (Baseline MED: {fitz.med} mJ/cm²)
              </div>
            </div>

            {/* REAL-TIME BURN TIME COMPARISON TILES */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div
                style={{
                  background: '#FFF5F5',
                  borderRadius: 14,
                  padding: '14px 16px',
                  border: '1px solid rgba(229, 62, 62, 0.2)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9B3D56', textTransform: 'uppercase' }}>
                  Unprotected Burn Time
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#E53E3E', marginTop: 4 }}>
                  ~{unprotectedBurnMins} <span style={{ fontSize: 13, fontWeight: 600 }}>mins</span>
                </div>
                <div style={{ fontSize: 10.5, color: '#718096', marginTop: 2 }}>
                  Direct solar erythema onset
                </div>
              </div>

              <div
                style={{
                  background: '#F0FFF4',
                  borderRadius: 14,
                  padding: '14px 16px',
                  border: '1px solid rgba(56, 161, 105, 0.25)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#276749', textTransform: 'uppercase' }}>
                  Protected Safe Time
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#38A169', marginTop: 4 }}>
                  ~{protectedBurnMins} <span style={{ fontSize: 13, fontWeight: 600 }}>mins</span>
                </div>
                <div style={{ fontSize: 10.5, color: '#718096', marginTop: 2 }}>
                  With real-world SPF {realWorldSpf.toFixed(1)}
                </div>
              </div>
            </div>

            {/* CPD PHOTODAMAGE RISK GAUGE */}
            <div
              style={{
                background: '#FAF5FF',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid rgba(159, 122, 234, 0.25)',
                marginBottom: 5,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontSize: 12, fontWeight: 700, color: '#553C9A' }}>
                  DNA CPD Photodamage & Solar Elastosis Risk
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: cpdRiskScore > 60 ? '#E53E3E' : '#553C9A' }}>
                  {cpdRiskScore}/100 Risk Index
                </span>
              </div>
              <div style={{ height: 8, background: '#E9D8FD', borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${cpdRiskScore}%`,
                    background:
                      cpdRiskScore > 70
                        ? 'linear-gradient(90deg, #9F7AEA 0%, #E53E3E 100%)'
                        : 'linear-gradient(90deg, #68D391 0%, #9F7AEA 100%)',
                    transition: 'width 0.4s ease-out',
                  }}
                />
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: 11, color: '#6B46C1', lineHeight: 1.4 }}>
                {cpdRiskScore < 30
                  ? '✓ Excellent cellular defense. Minimal reactive oxygen species (ROS) formation.'
                  : cpdRiskScore < 65
                    ? '⚠️ Moderate oxidative stress detected. Pyrimidine dimer repair mechanisms active.'
                    : '🚨 High DNA damage velocity. Immediate reapplication of broad-spectrum antioxidants & SPF required.'}
              </p>
            </div>
          </div>

          {/* REAPPLICATION COUNTDOWN CARD */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1A1219 0%, #2A1724 100%)',
              borderRadius: 16,
              padding: '18px 20px',
              color: '#FFFFFF',
              marginTop: 14,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold uppercase tracking-wider">
                  <Clock size={13} /> Reapplication Protocol Timer
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 3 }}>
                  {reapplyMinutesLeft} <span style={{ fontSize: 13, fontWeight: 500, color: '#E2E8F0' }}>mins until next layer</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogReapply}
                style={{
                  background: reapplyLogged ? '#38A169' : 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(192, 99, 122, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                {reapplyLogged ? <CheckCircle2 size={16} /> : <RefreshCw size={16} />}
                <span>{reapplyLogged ? 'Logged!' : 'Log Reapply'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          GRID ROW 2: SPECTRAL TRANSMITTANCE MATRIX & FORMULATION COMPARATOR
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* SPECTRAL ABSORPTION CHART (7 cols) */}
        <div
          className="lg:col-span-7"
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            border: '1px solid rgba(192, 99, 122, 0.2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={20} color="#C0637A" />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1A1219' }}>
                Spectral Transmittance & Photon Absorption Curve
              </h2>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#C0637A',
                background: '#FDE8EE',
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              290nm – 430nm Spectrum
            </span>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: 12.5, color: '#6A5862' }}>
            High-performance broad-spectrum filters absorb both erythemal UVB ($290-320\,\text{nm}$) and photoaging UVA I/II ($320-400\,\text{nm}$).
          </p>

          <div style={{ height: 260 }}>
            <Line data={spectralChartData} options={spectralChartOptions} />
          </div>

          {/* SPECTRAL BENCHMARKS */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#718096', fontWeight: 600 }}>Critical Wavelength (λc)</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1219', marginTop: 2 }}>
                {currentFormula.crit_wl} nm
              </div>
              <div style={{ fontSize: 10, color: '#38A169', fontWeight: 700 }}>✓ Passes ISO (≥370nm)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#718096', fontWeight: 600 }}>UVA-PF / PPD Rating</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#C0637A', marginTop: 2 }}>
                {currentFormula.uva_pf} ({currentFormula.pa})
              </div>
              <div style={{ fontSize: 10, color: '#C0637A', fontWeight: 700 }}>High Anti-Melasma</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#718096', fontWeight: 600 }}>HEV Blue Light Shield</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#B8924A', marginTop: 2 }}>
                {currentFormula.hev_blue}%
              </div>
              <div style={{ fontSize: 10, color: '#B8924A', fontWeight: 700 }}>Screen / Sun Defense</div>
            </div>
          </div>
        </div>

        {/* FORMULATION & DOSAGE TESTING SUITE (5 cols) */}
        <div
          className="lg:col-span-5"
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            border: '1px solid rgba(192, 99, 122, 0.2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={20} color="#B8924A" />
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1A1219' }}>
                  Filter Chemistry & Thickness Tester
                </h2>
              </div>
            </div>

            {/* FORMULATION SELECTOR TABS */}
            <div className="space-y-2 mb-4">
              {Object.values(FORMULATIONS).map((f) => (
                <div
                  key={f.id}
                  onClick={() => setFormulationKey(f.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid',
                    borderColor: formulationKey === f.id ? '#C0637A' : '#E2E8F0',
                    background: formulationKey === f.id ? '#FDF2F4' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: formulationKey === f.id ? '#C0637A' : '#1A1219' }}>
                      {f.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: formulationKey === f.id ? '#C0637A' : '#EDF2F7',
                        color: formulationKey === f.id ? '#FFFFFF' : '#4A5568',
                      }}
                    >
                      {f.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#6A5862', marginTop: 3 }}>
                    <strong>Active Actives:</strong> {f.active}
                  </div>
                </div>
              ))}
            </div>

            {/* APPLICATION THICKNESS SLIDER */}
            <div className="p-3.5 bg-slate-50 rounded-16 border border-slate-200/80 mb-4" style={{ borderRadius: 14 }}>
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2D3748' }}>
                  Application Thickness (mg/cm²)
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: appliedDosage >= 2.0 ? '#38A169' : '#E53E3E' }}>
                  {appliedDosage.toFixed(1)} mg/cm² {appliedDosage >= 2.0 ? '(Standard)' : '(Under-applied)'}
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={appliedDosage}
                onChange={(e) => setAppliedDosage(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.4 (Sheer drop: Real SPF ~3)</span>
                <span>2.0 (Clinical Standard: Full SPF {testSpf})</span>
                <span>2.5 (Heavy shield)</span>
              </div>
            </div>

            {/* ENVIRONMENTAL STRESSORS */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4A5568', marginBottom: 4 }}>
                  💧 Sweat / Water
                </div>
                <select
                  value={waterSweatExposureMins}
                  onChange={(e) => setWaterSweatExposureMins(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E0',
                    fontSize: 11,
                  }}
                >
                  <option value={0}>0 min (Dry environment)</option>
                  <option value={40}>40 min (Moderate sweat)</option>
                  <option value={80}>80 min (Water immersion)</option>
                </select>
              </div>

              <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4A5568', marginBottom: 4 }}>
                  ⏳ Elapsed Time
                </div>
                <select
                  value={hoursSinceApplication}
                  onChange={(e) => setHoursSinceApplication(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E0',
                    fontSize: 11,
                  }}
                >
                  <option value={0.5}>30 mins ago (Fresh)</option>
                  <option value={1.5}>1.5 hours ago</option>
                  <option value={3.0}>3.0 hours ago (Degraded)</option>
                  <option value={5.0}>5.0 hours ago (Exhausted)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SPF RATING SELECTOR BUTTONS */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span style={{ fontSize: 12, fontWeight: 700, color: '#718096' }}>Base SPF Label:</span>
            <div className="flex items-center gap-1.5">
              {[15, 30, 50, 100].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTestSpf(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: testSpf === s ? '#C0637A' : '#CBD5E0',
                    background: testSpf === s ? '#C0637A' : '#FFFFFF',
                    color: testSpf === s ? '#FFFFFF' : '#4A5568',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          GRID ROW 3: REAL-TIME GEOLOCATION & HOURLY UV CURVE
      ======================================================== */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: 24,
          border: '1px solid rgba(192, 99, 122, 0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          marginBottom: 28,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass size={20} color="#B8924A" />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1A1219' }}>
                Diurnal Solar Irradiance & Hourly UV Curve Simulation
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: '#6A5862' }}>
              Select a global city preset or adjust environmental modifiers (altitude, reflection, cloud cover).
            </p>
          </div>

          {/* CITY PRESET SELECTOR */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CITY_PRESETS.map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => handleCitySelect(city)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: selectedCity.name === city.name ? 700 : 500,
                  border: '1px solid',
                  borderColor: selectedCity.name === city.name ? '#B8924A' : '#E2E8F0',
                  background: selectedCity.name === city.name ? 'rgba(184, 146, 74, 0.15)' : '#FFFFFF',
                  color: selectedCity.name === city.name ? '#B8924A' : '#4A5568',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {city.name} (UVI {city.uv})
              </button>
            ))}
          </div>
        </div>

        {/* ENVIRONMENTAL MODIFIERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-rose-50/40 rounded-16 border border-rose-100/80 mb-5" style={{ borderRadius: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#4A2832', display: 'block', marginBottom: 4 }}>
              Base Ambient UV Index: {uvIndex}
            </label>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={uvIndex}
              onChange={(e) => setUvIndex(Number(e.target.value))}
              className="w-full accent-rose-600"
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#4A2832', display: 'block', marginBottom: 4 }}>
              Altitude: {altitudeMeters}m (+{((altitudeMultiplier - 1) * 100).toFixed(0)}% UV)
            </label>
            <input
              type="range"
              min="0"
              max="3000"
              step="100"
              value={altitudeMeters}
              onChange={(e) => setAltitudeMeters(Number(e.target.value))}
              className="w-full accent-rose-600"
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#4A2832', display: 'block', marginBottom: 4 }}>
              Surface Reflection
            </label>
            <select
              value={surfaceReflection}
              onChange={(e) => setSurfaceReflection(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #CBD5E0',
                fontSize: 11,
              }}
            >
              <option value="normal">Normal Soil / Grass (+4%)</option>
              <option value="sand">Beach Sand (+15%)</option>
              <option value="water">Open Water / Pool (+25%)</option>
              <option value="snow">Glacier / Snow (+80%)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#4A2832', display: 'block', marginBottom: 4 }}>
              Cloud Cover
            </label>
            <select
              value={cloudCover}
              onChange={(e) => setCloudCover(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #CBD5E0',
                fontSize: 11,
              }}
            >
              <option value="clear">Clear Sky (100% Irradiance)</option>
              <option value="scattered">Scattered Clouds (80% Irradiance)</option>
              <option value="overcast">Overcast Sky (35% Irradiance)</option>
            </select>
          </div>
        </div>

        {/* HOURLY CHART CONTAINER */}
        <div style={{ height: 250 }}>
          <Line data={hourlyChartData} options={hourlyChartOptions} />
        </div>
      </div>

      {/* ========================================================
          MODAL: CLINICAL PHOTOPROTECTION DOSSIER & CERTIFICATE
      ======================================================== */}
      {showDossierModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(26, 18, 25, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              padding: 32,
              border: '1px solid rgba(192, 99, 122, 0.3)',
            }}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  ✦
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1A1219' }}>
                    Clinical Photoprotection & UV Defense Dossier
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#718096' }}>
                    ISO 24443 Broad Spectrum Verification & MED Report
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDossierModal(false)}
                style={{
                  background: '#F7FAFC',
                  border: 'none',
                  borderRadius: 999,
                  width: 36,
                  height: 36,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#718096',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* DOSSIER BODY */}
            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-12 text-xs">
                <div>
                  <strong className="text-slate-900 block">Patient Profile:</strong>
                  {user?.full_name || 'Verified User'}
                </div>
                <div>
                  <strong className="text-slate-900 block">Phototype:</strong>
                  {fitz.name}
                </div>
                <div>
                  <strong className="text-slate-900 block">Baseline MED:</strong>
                  {fitz.med} mJ/cm²
                </div>
                <div>
                  <strong className="text-slate-900 block">Effective Real SPF:</strong>
                  SPF {realWorldSpf.toFixed(1)}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1A1219', margin: '0 0 6px 0' }}>
                  1. Spectral Transmittance & UVA Protection Factor (PPD)
                </h4>
                <p style={{ fontSize: 12.5, color: '#4A5568', margin: 0, lineHeight: 1.5 }}>
                  The evaluated formulation (<strong>{currentFormula.name}</strong>) demonstrates an absorption efficiency of <strong>{uvbBlockPercent.toFixed(1)}%</strong> with a critical wavelength of <strong>{currentFormula.crit_wl} nm</strong>. This satisfies both FDA Broad Spectrum requirements ($\lambda_c \ge 370\,\text{nm}$) and COLIPA/ISO UVA ratio criteria ($\text{UVA - PF} \ge \frac{1}{3}\text{SPF}$).
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1A1219', margin: '0 0 6px 0' }}>
                  2. Minimal Erythema Dose & Burn Safety Window
                </h4>
                <p style={{ fontSize: 12.5, color: '#4A5568', margin: 0, lineHeight: 1.5 }}>
                  Under ambient solar irradiance (Effective UV Index {effectiveUvi.toFixed(1)}), the patient's unprotected burn onset is <strong>{unprotectedBurnMins} minutes</strong>. With standard $2.0\,\text{mg / cm}^2$ application, safe threshold extends to <strong>~{protectedBurnMins} minutes</strong>.
                </p>
              </div>

              <div style={{ background: '#FFF5F5', padding: 14, borderRadius: 12, border: '1px solid rgba(229, 62, 62, 0.2)' }}>
                <strong style={{ color: '#9B3D56', fontSize: 13, display: 'block', marginBottom: 4 }}>
                  Clinical Dermatologist Regimen Recommendation:
                </strong>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#4A2832', lineHeight: 1.5 }}>
                  <li>Apply two full finger-lengths (2.0 mg/cm²) of Broad Spectrum SPF 50+ PA++++ each morning as the final skincare layer.</li>
                  <li>Incorporate an antioxidant serum (15% L-Ascorbic Acid + Ferulic Acid) underneath SPF to neutralize breakthrough UVA free radicals.</li>
                  <li>Reapply every 2 hours if outdoors, after swimming (&gt; 40 min), or heavy perspiration.</li>
                </ul>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #C0637A 0%, #9B3D56 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Printer size={16} /> Print / Save Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
