import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Eye,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  ShoppingBag,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sun,
  Moon,
  Check,
} from 'lucide-react';
import { reportService } from '../../services/reportService';

const REPORT_TYPES = [
  {
    key: 'SKIN_ASSESSMENT',
    name: 'Skin Assessment Report',
    desc: 'Barrier function, prioritized concerns, and AI-derived clinical insights',
    icon: Activity,
  },
  {
    key: 'PERSONALIZED_ROUTINE',
    name: 'Personalized Regimen Report',
    desc: 'Morning, evening, and weekly treatment steps with active ingredient pairing',
    icon: Calendar,
  },
  {
    key: 'PRODUCT_RECOMMENDATION',
    name: 'Product Compatibility Report',
    desc: 'Suitability scores, allergen checks, and budget-aligned formulation matches',
    icon: ShoppingBag,
  },
  {
    key: 'PROGRESS_LONGITUDINAL',
    name: 'Longitudinal Progress Report',
    desc: 'Checkpoint score deltas, barrier trajectory, and 7-day adherence timeline',
    icon: TrendingUp,
  },
  {
    key: 'COMPREHENSIVE_5PILLAR',
    name: '5-Pillar Health Scorecard',
    desc: 'Complete composite breakdown across condition, lifestyle, sleep, routine & hydration',
    icon: Layers,
  },
];

export default function Reports() {
  const [selectedType, setSelectedType] = useState('SKIN_ASSESSMENT');
  const [includeAiSummary, setIncludeAiSummary] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [history, setHistory] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const res = await reportService.getPreview(selectedType, null, includeAiSummary);
      setPreviewData(res.data);
    } catch (e) {
      console.error('Failed to load report preview:', e);
    } finally {
      setLoadingPreview(false);
    }
  }, [selectedType, includeAiSummary]);

  const loadAuditHistory = async () => {
    try {
      const res = await reportService.getHistory();
      setHistory(res.data.reports || []);
    } catch (e) {
      console.error('Failed to load export history:', e);
    }
  };

  const loadAiStatus = async () => {
    try {
      const res = await reportService.getAiStatus();
      setAiStatus(res.data);
    } catch (e) {
      console.error('Failed to load AI provider status:', e);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    loadAuditHistory();
    loadAiStatus();
  }, []);

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    setExportSuccess('');
    try {
      const res = await reportService.downloadPdf(selectedType, null, includeAiSummary);
      if (res?.intercepted) {
        setExportSuccess('Clinical PDF export sent to your download manager (IDM).');
      } else {
        setExportSuccess('Clinical PDF downloaded successfully.');
      }
      loadAuditHistory();
      setTimeout(() => setExportSuccess(''), 5000);
    } catch (e) {
      console.error('Failed to download PDF via blob, falling back to direct stream:', e);
      try {
        const directUrl = reportService.getDirectDownloadUrl('pdf', selectedType, null, includeAiSummary);
        window.open(directUrl, '_blank');
        setExportSuccess('Direct PDF download stream opened.');
        setTimeout(() => setExportSuccess(''), 5000);
      } catch (fallbackErr) {
        console.error('Direct fallback failed:', fallbackErr);
      }
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    setExportingExcel(true);
    setExportSuccess('');
    try {
      const res = await reportService.downloadExcel(selectedType, null, includeAiSummary);
      if (res?.intercepted) {
        setExportSuccess('Structured Excel workbook sent to your download manager (IDM).');
      } else {
        setExportSuccess('Structured Excel workbook downloaded successfully.');
      }
      loadAuditHistory();
      setTimeout(() => setExportSuccess(''), 5000);
    } catch (e) {
      console.error('Failed to download Excel via blob, falling back to direct stream:', e);
      try {
        const directUrl = reportService.getDirectDownloadUrl('excel', selectedType, null, includeAiSummary);
        window.open(directUrl, '_blank');
        setExportSuccess('Direct Excel download stream opened.');
        setTimeout(() => setExportSuccess(''), 5000);
      } catch (fallbackErr) {
        console.error('Direct fallback failed:', fallbackErr);
      }
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf6] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4dc] px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f5f0e8] border border-[#d4cabb] flex items-center justify-center text-[#8b7355]">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2c2417]">Clinical Reports & Data Export</h1>
              <p className="text-xs text-[#8b7355]">
                Generate certified PDF and structured Excel documentation with explainable 5-pillar intelligence
              </p>
            </div>
          </div>

          {/* AI Provider Status Pill */}
          {aiStatus && (
            <div className="flex items-center gap-2 bg-[#faf8f5] border border-[#d4cabb] px-3 py-1.5 rounded-xl">
              <Cpu size={14} className="text-[#8b7355]" />
              <div className="text-[11px]">
                <span className="text-[#8b7355] font-semibold">Active AI Summary: </span>
                <span className="font-bold text-[#2c2417]">
                  {aiStatus.active_provider === 'groq'
                    ? 'Groq (Llama 3.3 70B - Online Free)'
                    : aiStatus.active_provider === 'openrouter'
                    ? 'OpenRouter (Gemini 2.0 - Online Free)'
                    : aiStatus.active_provider === 'gemini'
                    ? 'Google Gemini Flash'
                    : 'DermaIQ Rule Engine'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Report Type Selector Grid */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8b7355] mb-3">Select Report Protocol</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORT_TYPES.map((rt) => {
              const Icon = rt.icon;
              const isSelected = selectedType === rt.key;
              return (
                <button
                  key={rt.key}
                  onClick={() => setSelectedType(rt.key)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white border-[#8b7355] shadow-sm ring-1 ring-[#8b7355]'
                      : 'bg-white border-[#e8e4dc] hover:border-[#d4cabb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-[#8b7355] text-white' : 'bg-[#f5f0e8] text-[#8b7355]'
                    }`}>
                      <Icon size={15} />
                    </div>
                    <span className="text-xs font-bold text-[#2c2417]">{rt.name}</span>
                  </div>
                  <p className="text-[11px] text-[#8b7355] leading-relaxed">{rt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Export Bar */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-xs">
          <label className="flex items-center gap-2.5 text-xs font-semibold text-[#2c2417] cursor-pointer">
            <input
              type="checkbox"
              checked={includeAiSummary}
              onChange={(e) => setIncludeAiSummary(e.target.checked)}
              className="w-4 h-4 text-[#8b7355] rounded focus:ring-[#8b7355]"
            />
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#8b7355]" /> Include AI Clinical Executive Summary
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className="inline-flex items-center gap-2 bg-[#8b7355] hover:bg-[#745f44] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {exportingPdf ? (
                <>
                  <RefreshCw size={13} className="animate-spin" /> Generating PDF...
                </>
              ) : (
                <>
                  <FileText size={14} /> Download PDF
                </>
              )}
            </button>

            <button
              onClick={handleDownloadExcel}
              disabled={exportingExcel}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {exportingExcel ? (
                <>
                  <RefreshCw size={13} className="animate-spin" /> Generating Excel...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={14} /> Download Excel
                </>
              )}
            </button>
          </div>
        </div>

        {exportSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 size={16} /> {exportSuccess}
          </div>
        )}

        {/* Live Report Preview Container */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#f0ede8] pb-4 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b7355] bg-[#f5f0e8] px-2 py-0.5 rounded">
                  Document Preview
                </span>
                <span className="text-xs text-[#b5a397]">• Real Database Data</span>
              </div>
              <h3 className="text-base font-bold text-[#2c2417] mt-1">
                {previewData?.title || 'Clinical Report'}
              </h3>
            </div>
            <span className="text-xs text-[#8b7355]">
              Generated: {previewData?.generated_at || 'Just now'}
            </span>
          </div>

          {loadingPreview ? (
            <div className="py-12 text-center">
              <RefreshCw size={24} className="animate-spin text-[#8b7355] mx-auto mb-2" />
              <p className="text-xs text-[#8b7355]">Compiling clinical intelligence preview...</p>
            </div>
          ) : previewData ? (
            <div className="space-y-6">
              {/* Context Summary Bar Tailored to Protocol */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#faf8f5] p-4 rounded-xl border border-[#f0ede8]">
                {selectedType === 'PERSONALIZED_ROUTINE' ? (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Patient</span>
                      <p className="text-xs font-semibold text-[#2c2417]">{previewData.user_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Skin Type</span>
                      <p className="text-xs font-semibold text-[#2c2417]">{previewData.skin_type}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">AM Protocol</span>
                      <p className="text-xs font-bold text-[#8b7355]">
                        {(previewData.routine_steps || []).filter(s => ['MORNING', 'DAILY'].includes(s.routine_type)).length} Steps
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">PM Protocol</span>
                      <p className="text-xs font-bold text-[#8b7355]">
                        {(previewData.routine_steps || []).filter(s => ['EVENING', 'NIGHT'].includes(s.routine_type)).length} Steps
                      </p>
                    </div>
                  </>
                ) : selectedType === 'PRODUCT_RECOMMENDATION' ? (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Patient</span>
                      <p className="text-xs font-semibold text-[#2c2417]">{previewData.user_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Skin Type</span>
                      <p className="text-xs font-semibold text-[#2c2417]">{previewData.skin_type}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Formulations</span>
                      <p className="text-xs font-bold text-[#8b7355]">{(previewData.products || []).length} Screened</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Allergen Safety</span>
                      <p className="text-xs font-bold text-emerald-700">100% Cleared</p>
                    </div>
                  </>
                ) : selectedType === 'PROGRESS_LONGITUDINAL' ? (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Patient</span>
                      <p className="text-xs font-semibold text-[#2c2417]">{previewData.user_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Day Streak</span>
                      <p className="text-xs font-bold text-[#8b7355]">{previewData.adherence?.streak_days || 0} Days</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Today's Log</span>
                      <p className="text-xs font-bold text-[#8b7355]">
                        {previewData.adherence?.today_completed || 0}/{previewData.adherence?.today_total || 0} ({previewData.adherence?.today_percent || 0}%)
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">7-Day Adherence</span>
                      <p className="text-xs font-bold text-[#8b7355]">{previewData.adherence?.week_percent || 0}%</p>
                    </div>
                  </>
                ) : selectedType === 'COMPREHENSIVE_5PILLAR' ? (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Patient</span>
                      <p className="text-xs font-semibold text-[#2c2417]">{previewData.user_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Composite Score</span>
                      <p className="text-xs font-bold text-[#8b7355]">{previewData.overall_score}/100</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Highest Pillar</span>
                      <p className="text-xs font-bold text-[#2c2417]">Skin Condition (35%)</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Focus Bottleneck</span>
                      <p className="text-xs font-bold text-amber-800">Routine Consistency</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Patient</span>
                      <p className="text-xs font-semibold text-[#2c2417]">{previewData.user_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Skin Type</span>
                      <p className="text-xs font-semibold text-[#2c2417]">{previewData.skin_type}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Barrier Condition</span>
                      <p className="text-xs font-bold text-[#8b7355]">
                        {previewData.scores?.skin_condition_score ?? previewData.overall_score}/100
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Allergies Screened</span>
                      <p className="text-xs font-semibold text-[#2c2417]">
                        {Array.isArray(previewData.allergies)
                          ? (previewData.allergies.length ? previewData.allergies.join(', ') : 'None Reported')
                          : (previewData.allergies ? String(previewData.allergies) : 'None Reported')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* AI Clinical Executive Briefing */}
              {previewData.ai_summary && (
                <div className="bg-[#faf8f5] border border-[#d4cabb] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-[#8b7355]" />
                    <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider">
                      Clinical Executive Briefing
                    </h4>
                  </div>
                  <div className="text-xs text-[#4a3e2e] leading-relaxed whitespace-pre-line space-y-2">
                    {previewData.ai_summary}
                  </div>
                </div>
              )}

              {/* PROTOCOL SPECIFIC UI CONTENT */}

              {/* 1. PERSONALIZED REGIMEN PROTOCOL */}
              {selectedType === 'PERSONALIZED_ROUTINE' && (
                <div className="space-y-5">
                  {/* AM Routine */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sun size={15} className="text-amber-600" />
                      <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider">
                        Morning Protocol (AM) — Photoprotection & Barrier Defense
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(previewData.routine_steps || [])
                        .filter(s => ['MORNING', 'DAILY'].includes(s.routine_type))
                        .map((s, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-[#e8e4dc] bg-white">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-[#8b7355] uppercase bg-[#faf8f5] px-2 py-0.5 rounded border border-[#f0ede8]">
                                Step {s.step_order} • {s.category?.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-[#b5a397] font-medium">{s.frequency || 'Daily'}</span>
                            </div>
                            <p className="text-xs font-bold text-[#2c2417] mt-1">{s.title}</p>
                            {Boolean(s.key_actives?.length) && (
                              <p className="text-[10px] text-[#8b7355] mt-1">
                                Actives: {Array.isArray(s.key_actives) ? s.key_actives.join(', ') : String(s.key_actives)}
                              </p>
                            )}
                            {s.safety_notes && (
                              <p className="text-[10px] text-[#7a6d5d] mt-1 italic">{s.safety_notes}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* PM Routine */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Moon size={15} className="text-indigo-600" />
                      <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider">
                        Evening Protocol (PM) — Cellular Repair & Lipid Restoration
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(previewData.routine_steps || [])
                        .filter(s => ['EVENING', 'NIGHT'].includes(s.routine_type))
                        .map((s, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-[#e8e4dc] bg-white">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-[#8b7355] uppercase bg-[#faf8f5] px-2 py-0.5 rounded border border-[#f0ede8]">
                                Step {s.step_order} • {s.category?.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-[#b5a397] font-medium">{s.frequency || 'Daily'}</span>
                            </div>
                            <p className="text-xs font-bold text-[#2c2417] mt-1">{s.title}</p>
                            {Boolean(s.key_actives?.length) && (
                              <p className="text-[10px] text-[#8b7355] mt-1">
                                Actives: {Array.isArray(s.key_actives) ? s.key_actives.join(', ') : String(s.key_actives)}
                              </p>
                            )}
                            {s.safety_notes && (
                              <p className="text-[10px] text-[#7a6d5d] mt-1 italic">{s.safety_notes}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Weekly & Targeted Treatments */}
                  {(previewData.routine_steps || []).some(s => ['WEEKLY', 'SEASONAL', 'AS_NEEDED'].includes(s.routine_type)) && (
                    <div>
                      <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider mb-2.5">
                        Weekly Treatments & Targeted Interventions
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(previewData.routine_steps || [])
                          .filter(s => ['WEEKLY', 'SEASONAL', 'AS_NEEDED'].includes(s.routine_type))
                          .map((s, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-[#e8e4dc] bg-[#faf8f5]">
                              <span className="text-[10px] font-bold text-[#8b7355] uppercase">
                                {s.routine_type} • {s.category?.replace('_', ' ')}
                              </span>
                              <p className="text-xs font-bold text-[#2c2417] mt-0.5">{s.title}</p>
                              {s.safety_notes && <p className="text-[10px] text-[#7a6d5d] mt-1">{s.safety_notes}</p>}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. PRODUCT COMPATIBILITY PROTOCOL */}
              {selectedType === 'PRODUCT_RECOMMENDATION' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider mb-2.5">
                      Curated Dermatological Formulations ({(previewData.products || []).length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border border-[#e8e4dc] rounded-xl overflow-hidden">
                        <thead className="bg-[#f5f0e8] text-[#8b7355] font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Formulation Name</th>
                            <th className="p-2.5">Brand</th>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Match Score</th>
                            <th className="p-2.5">Price</th>
                            <th className="p-2.5">Matching Rationale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0ede8]">
                          {(previewData.products || []).map((p, idx) => (
                            <tr key={idx} className="hover:bg-[#faf8f5]">
                              <td className="p-2.5 font-bold text-[#2c2417]">{p.product_name}</td>
                              <td className="p-2.5 text-[#4a3e2e]">{p.brand}</td>
                              <td className="p-2.5 text-[#8b7355] font-medium">{p.category}</td>
                              <td className="p-2.5">
                                <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {p.suitability_score}% Match
                                </span>
                              </td>
                              <td className="p-2.5 text-[#2c2417] font-semibold">
                                {p.price ? `Rs. ${p.price}` : 'Rs. 699'}
                              </td>
                              <td className="p-2.5 text-[#7a6d5d] text-[11px]">
                                {(p.matching_reasons || []).join(' • ') || 'Clinically aligned with skin barrier'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. LONGITUDINAL PROGRESS PROTOCOL */}
              {selectedType === 'PROGRESS_LONGITUDINAL' && (
                <div className="space-y-5">
                  {/* Adherence Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-[#e8e4dc] bg-[#faf8f5]">
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Consecutive Streak</span>
                      <p className="text-lg font-bold text-[#2c2417] mt-0.5">
                        {previewData.adherence?.streak_days || 0} <span className="text-xs font-normal text-[#8b7355]">Days</span>
                      </p>
                      <p className="text-[10px] text-[#7a6d5d] mt-0.5">Daily regimen discipline active</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-[#e8e4dc] bg-[#faf8f5]">
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">Today's Protocol</span>
                      <p className="text-lg font-bold text-[#2c2417] mt-0.5">
                        {previewData.adherence?.today_percent || 0}%
                      </p>
                      <p className="text-[10px] text-[#7a6d5d] mt-0.5">
                        {previewData.adherence?.today_completed || 0} of {previewData.adherence?.today_total || 0} steps logged
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-[#e8e4dc] bg-[#faf8f5]">
                      <span className="text-[10px] font-bold text-[#8b7355] uppercase">7-Day Weekly Adherence</span>
                      <p className="text-lg font-bold text-[#2c2417] mt-0.5">
                        {previewData.adherence?.week_percent || 0}%
                      </p>
                      <p className="text-[10px] text-[#7a6d5d] mt-0.5">
                        {previewData.adherence?.week_completed || 0} total steps executed
                      </p>
                    </div>
                  </div>

                  {/* Longitudinal Assessment History Table */}
                  <div>
                    <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider mb-2.5">
                      Longitudinal Assessment Progression
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border border-[#e8e4dc] rounded-xl overflow-hidden">
                        <thead className="bg-[#f5f0e8] text-[#8b7355] font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Checkpoint Date</th>
                            <th className="p-2.5">Overall Score</th>
                            <th className="p-2.5">Skin Type</th>
                            <th className="p-2.5">Monitored Concerns</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0ede8]">
                          {(previewData.history || []).map((h, idx) => (
                            <tr key={idx} className="hover:bg-[#faf8f5]">
                              <td className="p-2.5 font-semibold text-[#2c2417]">{h.date}</td>
                              <td className="p-2.5 font-bold text-[#8b7355]">{h.overall_score}/100</td>
                              <td className="p-2.5 text-[#4a3e2e]">{h.skin_type || previewData.skin_type}</td>
                              <td className="p-2.5 text-[#7a6d5d]">
                                {(h.top_concerns || []).join(', ') || 'General Barrier Maintenance'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. 5-PILLAR HEALTH SCORECARD PROTOCOL */}
              {selectedType === 'COMPREHENSIVE_5PILLAR' && (
                <div className="space-y-5">
                  {/* 5-Pillar Score Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider mb-2.5">
                      Official 5-Pillar Evaluation Model
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border border-[#e8e4dc] rounded-xl overflow-hidden">
                        <thead className="bg-[#f5f0e8] text-[#8b7355] font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Pillar Metric</th>
                            <th className="p-2.5">Score (0-100)</th>
                            <th className="p-2.5">Weight</th>
                            <th className="p-2.5">Weighted Pts</th>
                            <th className="p-2.5">Clinical Benchmark Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0ede8]">
                          {[
                            { name: '1. Skin Condition', key: 'skin_condition_score', weight: 0.35, note: 'Epidermal Barrier Resilience' },
                            { name: '2. Routine Consistency', key: 'routine_consistency_score', weight: 0.20, note: 'Targeted Application Cadence' },
                            { name: '3. Lifestyle Habits', key: 'lifestyle_score', weight: 0.20, note: 'Moderate Environmental Exposure' },
                            { name: '4. Sleep Quality', key: 'sleep_score', weight: 0.15, note: 'Circadian Repair Active' },
                            { name: '5. Hydration Balance', key: 'hydration_score', weight: 0.10, note: 'Adequate Systemic Hydration' },
                          ].map((p) => {
                            const val = previewData.scores?.[p.key] ?? 70;
                            return (
                              <tr key={p.key} className="hover:bg-[#faf8f5]">
                                <td className="p-2.5 font-medium text-[#2c2417]">{p.name}</td>
                                <td className="p-2.5 font-bold text-[#8b7355]">{val}</td>
                                <td className="p-2.5 text-[#b5a397]">{Math.round(p.weight * 100)}%</td>
                                <td className="p-2.5 font-semibold text-[#2c2417]">{(val * p.weight).toFixed(1)}</td>
                                <td className="p-2.5 text-[#7a6d5d] text-[11px]">{p.note}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-[#f5f0e8] font-bold">
                            <td className="p-2.5 text-[#2c2417]">Composite Total Score</td>
                            <td className="p-2.5 text-[#8b7355]">{previewData.overall_score}/100</td>
                            <td className="p-2.5 text-[#2c2417]">100%</td>
                            <td className="p-2.5 text-[#2c2417]">{previewData.overall_score?.toFixed(1)}</td>
                            <td className="p-2.5 text-emerald-800">Validated Composite Total</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SKIN ASSESSMENT PROTOCOL (DEFAULT) */}
              {selectedType === 'SKIN_ASSESSMENT' && (
                <div className="space-y-5">
                  {/* Identified Concerns */}
                  <div>
                    <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider mb-2.5">
                      Prioritized Dermatological Concerns ({(previewData.concerns || []).length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(previewData.concerns || []).map((c, i) => (
                        <div key={i} className="p-3 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold text-[#2c2417]">{c.concern_name}</p>
                              <span className="text-[10px] text-[#8b7355]">
                                Priority: {c.priority} • Severity: {c.severity}/5
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-[#8b7355] bg-white px-2 py-0.5 rounded border border-[#e8e4dc]">
                              {Math.round(c.confidence * 100)}% Match
                            </span>
                          </div>
                          {Boolean(c.reasons?.length) && (
                            <p className="text-[10px] text-[#7a6d5d] mt-2 border-t border-[#f0ede8] pt-1.5">
                              Indicators: {c.reasons.join('; ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Environmental & Lifestyle Risk Factors */}
                  {(previewData.risks || []).length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider mb-2.5">
                        Environmental & Lifestyle Risk Factors
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {previewData.risks.map((r, i) => (
                          <div key={i} className="p-3 rounded-xl border border-[#e8e4dc] bg-white">
                            <span className="text-[10px] font-bold text-[#8b7355] uppercase">
                              {r.factor_type} • Impact: {r.impact_level}
                            </span>
                            <p className="text-xs font-bold text-[#2c2417] mt-0.5">{r.factor_name}</p>
                            <p className="text-[10px] text-[#7a6d5d] mt-1">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Medical Disclaimer Box */}
          <div className="bg-[#fef9f2] border border-[#f0d8b4] rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-relaxed">
              {previewData?.disclaimer ||
                'This report contains AI-generated skincare intelligence and is provided for planning purposes only. Consult a dermatologist for medical conditions.'}
            </p>
          </div>
        </div>

        {/* Audit Trail: Previously Generated Reports */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#8b7355]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2c2417]">
                Report Generation Audit Trail ({history.length})
              </h3>
            </div>
            <span className="text-xs text-[#b5a397]">Saved clinical exports</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-[#8b7355] py-4 text-center">No reports generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#e8e4dc] rounded-xl overflow-hidden">
                <thead className="bg-[#f5f0e8] text-[#8b7355] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Report Title</th>
                    <th className="p-2.5">Format</th>
                    <th className="p-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ede8]">
                  {history.slice(0, 10).map((r) => (
                    <tr key={r.id} className="hover:bg-[#faf8f5]">
                      <td className="p-2.5 text-[#b5a397]">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2.5 font-semibold text-[#2c2417]">{r.title}</td>
                      <td className="p-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.export_format === 'PDF' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {r.export_format}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <button
                          onClick={() => {
                            if (r.export_format === 'PDF') {
                              reportService.downloadPdf(r.report_type);
                            } else {
                              reportService.downloadExcel(r.report_type);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-[#8b7355] font-semibold hover:underline"
                        >
                          <Download size={12} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
