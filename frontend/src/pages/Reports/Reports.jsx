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
              {/* Patient / Context Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#faf8f5] p-4 rounded-xl border border-[#f0ede8]">
                <div>
                  <span className="text-[10px] font-bold text-[#8b7355] uppercase">Patient</span>
                  <p className="text-xs font-semibold text-[#2c2417]">{previewData.user_name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8b7355] uppercase">Skin Type</span>
                  <p className="text-xs font-semibold text-[#2c2417]">{previewData.skin_type}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8b7355] uppercase">Composite Score</span>
                  <p className="text-xs font-bold text-[#8b7355]">{previewData.overall_score}/100</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8b7355] uppercase">Allergies</span>
                  <p className="text-xs font-semibold text-[#2c2417]">
                    {Array.isArray(previewData.allergies)
                      ? (previewData.allergies.length ? previewData.allergies.join(', ') : 'None Reported')
                      : (previewData.allergies ? String(previewData.allergies) : 'None Reported')}
                  </p>
                </div>
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

              {/* 5-Pillar Score Breakdown */}
              {previewData.scores && Object.keys(previewData.scores).length > 0 && (
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ede8]">
                        {[
                          { name: 'Skin Condition', key: 'skin_condition_score', weight: 0.35 },
                          { name: 'Routine Consistency', key: 'routine_consistency_score', weight: 0.20 },
                          { name: 'Lifestyle Habits', key: 'lifestyle_score', weight: 0.20 },
                          { name: 'Sleep Quality', key: 'sleep_score', weight: 0.15 },
                          { name: 'Hydration Balance', key: 'hydration_score', weight: 0.10 },
                        ].map((p) => {
                          const val = previewData.scores[p.key] ?? 0;
                          return (
                            <tr key={p.key} className="hover:bg-[#faf8f5]">
                              <td className="p-2.5 font-medium text-[#2c2417]">{p.name}</td>
                              <td className="p-2.5 font-semibold text-[#8b7355]">{val}</td>
                              <td className="p-2.5 text-[#b5a397]">{Math.round(p.weight * 100)}%</td>
                              <td className="p-2.5 font-semibold text-[#2c2417]">{(val * p.weight).toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Identified Concerns */}
              {previewData.concerns?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider mb-2.5">
                    Target Concerns ({previewData.concerns.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {previewData.concerns.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#2c2417]">{c.concern_name}</p>
                          <span className="text-[10px] text-[#8b7355]">
                            Priority: {c.priority} • Severity: {c.severity}/5
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#8b7355]">
                          {Math.round(c.confidence * 100)}% AI Match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Routine Protocol Preview */}
              {previewData.routine_steps?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#2c2417] uppercase tracking-wider mb-2.5">
                    Routine Protocol ({previewData.routine_steps.length} Steps)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewData.routine_steps.slice(0, 6).map((s, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-[#e8e4dc] bg-white text-xs">
                        <span className="text-[10px] font-bold text-[#8b7355] uppercase">
                          {s.routine_type} • Step {s.step_order}
                        </span>
                        <p className="font-semibold text-[#2c2417]">{s.title}</p>
                        {Boolean(s.key_actives) && (
                          <p className="text-[10px] text-[#8b7355]">
                            Actives: {Array.isArray(s.key_actives) ? s.key_actives.join(', ') : String(s.key_actives)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
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
