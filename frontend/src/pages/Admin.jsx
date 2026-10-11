import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Database, Lock, Server, 
  Activity, CheckCircle2, AlertTriangle, Key, 
  RefreshCw, Layers, Cpu, Globe, Search, Filter,
  UserCheck, UserX, Shield, Clock, ArrowRight, Eye, X,
  Palette, Sliders, FileEdit, Plus, Trash2, Save, Undo2,
  Megaphone, Wrench, ExternalLink, ShieldCheck, Check,
  BarChart3, Sparkles, FileSpreadsheet, FileText, Pill,
  TrendingUp, TrendingDown, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMaintenance } from '../context/MaintenanceContext';
import { adminService } from '../services/admin';
import { useToast } from '../components/Toast';
import BrandLogo, { BrandLogoIcon } from '../components/BrandLogo';

const seededConcerns = [
  { code: 'ACNE', name: 'Acne Vulgaris', description: 'Active inflammatory and comedonal lesions, excess sebum obstruction.' },
  { code: 'HYPERPIGMENTATION', name: 'Hyperpigmentation', description: 'Uneven melanin concentration and post-inflammatory patches.' },
  { code: 'DARK_SPOTS', name: 'Dark Spots & Melasma', description: 'Localized sun and hormonal melanin deposits on epidermis.' },
  { code: 'DRY_SKIN', name: 'Xerosis / Dry Skin', description: 'Compromised lipid barrier with inadequate sebum and moisture retention.' },
  { code: 'OILY_SKIN', name: 'Seborrhea / Oily Skin', description: 'Overactive sebaceous glands producing excess follicular sebum.' },
  { code: 'SENSITIVE_SKIN', name: 'Reactive / Sensitive', description: 'Hypersensitive cutaneous barrier prone to erythema, burning, and stinging.' },
  { code: 'WRINKLES', name: 'Wrinkles & Rhytids', description: 'Deep cutaneous creases from collagen breakdown and photoaging.' },
  { code: 'FINE_LINES', name: 'Fine Lines', description: 'Superficial dehydration lines around orbital and perioral zones.' },
  { code: 'REDNESS', name: 'Erythema & Rosacea', description: 'Vascular dilation and reactive microcapillary flushing.' },
  { code: 'UNEVEN_SKIN_TONE', name: 'Dyschromia / Uneven Tone', description: 'Irregular skin texture and localized chromatic discoloration.' },
];

export default function Admin() {
  const { user } = useAuth();
  const { refreshMaintenance } = useMaintenance();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('USERS'); // USERS, PLATFORM_ANALYTICS, RECOMMENDATION_MONITORING, SYSTEM_REPORTS, UI_STUDIO, LEGAL_CMS, FEATURE_FLAGS, CONNECTIONS, CONCERNS, SYSTEM
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [connectionsList, setConnectionsList] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Platform Analytics State
  const [platformAnalytics, setPlatformAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Recommendation Monitoring State
  const [recommendationMonitoring, setRecommendationMonitoring] = useState(null);
  const [loadingRecMonitoring, setLoadingRecMonitoring] = useState(false);
  const [recAuditSearch, setRecAuditSearch] = useState('');
  const [recRoleFilter, setRecRoleFilter] = useState('');
  const [selectedAuditRec, setSelectedAuditRec] = useState(null);

  // System Reports Audit State
  const [systemReportsAudit, setSystemReportsAudit] = useState(null);
  const [loadingReportsAudit, setLoadingReportsAudit] = useState(false);
  const [reportsAuditSearch, setReportsAuditSearch] = useState('');
  const [reportFormatFilter, setReportFormatFilter] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('');
  const [selectedAuditReport, setSelectedAuditReport] = useState(null);

  // Filters
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [connStatusFilter, setConnStatusFilter] = useState('');

  // Selected User Role Editing
  const [editingRoleUser, setEditingRoleUser] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('');

  // ─── UI & BRANDING STUDIO STATE ───
  const [uiConfig, setUiConfig] = useState({
    app_name: 'DermaIQ',
    tagline: 'Personalized Skincare Intelligence',
    primary_brand_color: '#1b382d',
    accent_color: '#d4af37',
    announcement_banner_enabled: true,
    announcement_banner_text: '🔬 Neural ConcernNet 4.2 active: real-time barrier sensitivity & exposome intelligence enabled.',
    announcement_banner_type: 'INFO',
    maintenance_mode: false,
    maintenance_message: 'DermaIQ is undergoing scheduled clinical algorithm optimization. Please check back shortly.',
    footer_copyright: '© 2026 DermaIQ Intelligence & Personalized Planner - by Deep Kamble',
    support_email: 'clinical@dermaiq.ai',
  });

  // ─── LEGAL CMS POLICIES STATE ───
  const [activeLegalDoc, setActiveLegalDoc] = useState('legal_privacy'); // 'legal_privacy', 'legal_terms', 'legal_security'
  const [legalDocs, setLegalDocs] = useState({
    legal_privacy: {
      title: 'Privacy Policy & Biometric Data Safeguards',
      last_updated: 'October 2026',
      effective_date: 'October 1, 2026',
      summary: 'DermaIQ is committed to safeguarding cutaneous biometric data, lifestyle habit telemetry, and clinical care interactions in compliance with international health privacy standards, GDPR, and zero-knowledge principles.',
      sections: [],
    },
    legal_terms: {
      title: 'Terms of Clinical & Wellness Service',
      last_updated: 'October 2026',
      effective_date: 'October 1, 2026',
      summary: 'These Terms of Service govern your access to the DermaIQ platform, its AI-assisted skincare analysis, routine planner, and care circle coordination network.',
      sections: [],
    },
    legal_security: {
      title: 'Security Standards & Cryptographic Integrity',
      last_updated: 'October 2026',
      effective_date: 'October 1, 2026',
      summary: 'DermaIQ implements comprehensive defense-in-depth security standards across all database layers, neural endpoints, and clinical communication conduits.',
      sections: [],
    },
  });

  // ─── FEATURE FLAGS & AI CONTROLS ───
  const [featureFlags, setFeatureFlags] = useState({
    enable_ai_assessment: true,
    enable_professional_care_circle: true,
    enable_sleep_circadian_tracking: true,
    enable_hydration_tracking: true,
    enable_weather_environmental_telemetry: true,
    enable_community_reviews: true,
    ai_confidence_threshold: 0.75,
    max_upload_size_mb: 10,
    rate_limit_per_minute: 120,
  });

  const fetchPlatformAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await adminService.getPlatformAnalytics();
      setPlatformAnalytics(data);
      toast.success('Platform analytics updated.');
    } catch (err) {
      console.error('Failed to update platform analytics:', err);
      toast.error('Failed to load platform analytics.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchRecommendationMonitoring = async () => {
    try {
      setLoadingRecMonitoring(true);
      const data = await adminService.getRecommendationMonitoring();
      setRecommendationMonitoring(data);
      toast.success('Recommendation monitoring audit updated.');
    } catch (err) {
      console.error('Failed to update recommendation monitoring:', err);
      toast.error('Failed to load recommendation audit.');
    } finally {
      setLoadingRecMonitoring(false);
    }
  };

  const fetchSystemReportsAudit = async () => {
    try {
      setLoadingReportsAudit(true);
      const data = await adminService.getSystemReports();
      setSystemReportsAudit(data);
      toast.success('System reports audit updated.');
    } catch (err) {
      console.error('Failed to update system reports:', err);
      toast.error('Failed to load system reports.');
    } finally {
      setLoadingReportsAudit(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, healthData, settingsData, analyticsData, recMonitoringData, reportsData] = await Promise.all([
        adminService.getStats(),
        adminService.getSystemStatus(),
        adminService.getAllSettings().catch(() => null),
        adminService.getPlatformAnalytics().catch(() => null),
        adminService.getRecommendationMonitoring().catch(() => null),
        adminService.getSystemReports().catch(() => null),
      ]);
      setStats(statsData);
      setSystemHealth(healthData);
      if (analyticsData) setPlatformAnalytics(analyticsData);
      if (recMonitoringData) setRecommendationMonitoring(recMonitoringData);
      if (reportsData) setSystemReportsAudit(reportsData);

      if (settingsData) {
        if (settingsData.ui_branding) {
          setUiConfig((prev) => ({ ...prev, ...settingsData.ui_branding }));
        }
        if (settingsData.feature_controls) {
          setFeatureFlags((prev) => ({ ...prev, ...settingsData.feature_controls }));
        }
        setLegalDocs({
          legal_privacy: settingsData.legal_privacy || legalDocs.legal_privacy,
          legal_terms: settingsData.legal_terms || legalDocs.legal_terms,
          legal_security: settingsData.legal_security || legalDocs.legal_security,
        });
      }

      // Fetch users
      const userParams = {};
      if (roleFilter) userParams.role = roleFilter;
      if (statusFilter !== '') userParams.is_active = statusFilter === 'true';
      if (searchUser.trim()) userParams.search = searchUser.trim();
      const usersData = await adminService.getUsers(userParams);
      setUsersList(usersData);

      // Fetch connections
      const connData = await adminService.getConnections(connStatusFilter || null);
      setConnectionsList(connData);

    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
      toast.error('Failed to load platform administration metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminData();
    }, 200);
    return () => clearTimeout(timer);
  }, [roleFilter, statusFilter, searchUser, connStatusFilter]);

  const handleToggleStatus = async (targetUser) => {
    const newStatus = !targetUser.is_active;
    const actionLabel = newStatus ? 'activate' : 'deactivate';

    if (targetUser.id === user.id && !newStatus) {
      toast.error('Security safeguard: You cannot deactivate your own admin account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${actionLabel} account for ${targetUser.email}?`)) {
      return;
    }

    try {
      await adminService.updateUserStatus(targetUser.id, newStatus);
      toast.success(`Account ${actionLabel}d successfully.`);
      fetchAdminData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update user status.';
      toast.error(msg);
    }
  };

  const handleRoleUpdate = async () => {
    if (!editingRoleUser || !selectedNewRole) return;
    try {
      await adminService.updateUserRole(editingRoleUser.id, selectedNewRole);
      toast.success(`Updated role for ${editingRoleUser.email} to ${selectedNewRole}!`);
      setEditingRoleUser(null);
      fetchAdminData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update role.';
      toast.error(msg);
    }
  };

  // ─── UI CONFIG HANDLERS ───
  const handleSaveUiConfig = async () => {
    setSavingSettings(true);
    try {
      await adminService.updateSetting('ui_branding', uiConfig);
      refreshMaintenance?.();
      toast.success('Branding & UI configuration published successfully!');
    } catch (err) {
      console.error('Failed to save UI config:', err);
      toast.error('Failed to publish UI settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleMaintenanceImmediate = async (newVal) => {
    const updated = { ...uiConfig, maintenance_mode: newVal };
    setUiConfig(updated);
    setSavingSettings(true);
    try {
      await adminService.updateSetting('ui_branding', updated);
      refreshMaintenance?.();
      toast.success(
        newVal
          ? '🚨 Platform Maintenance Mode ACTIVATED! Standard users are now blocked.'
          : '✅ Platform Maintenance Mode DEACTIVATED! Access restored to all users.'
      );
    } catch (err) {
      console.error('Failed to update maintenance mode:', err);
      toast.error('Failed to toggle maintenance mode.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetUiConfig = async () => {
    if (!window.confirm('Reset UI and Branding settings to factory defaults?')) return;
    setSavingSettings(true);
    try {
      const res = await adminService.resetSetting('ui_branding');
      if (res?.value) setUiConfig(res.value);
      refreshMaintenance?.();
      toast.success('Branding restored to factory defaults.');
    } catch (err) {
      toast.error('Failed to reset UI settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── LEGAL CMS HANDLERS ───
  const currentDoc = legalDocs[activeLegalDoc] || { sections: [] };

  const handleUpdateLegalField = (field, val) => {
    setLegalDocs((prev) => ({
      ...prev,
      [activeLegalDoc]: {
        ...prev[activeLegalDoc],
        [field]: val,
      },
    }));
  };

  const handleAddLegalSection = () => {
    const newSec = {
      heading: `${(currentDoc.sections?.length || 0) + 1}. New Policy Clause`,
      body: 'Enter detailed regulatory stipulations, compliance obligations, or patient rights here...',
    };
    setLegalDocs((prev) => ({
      ...prev,
      [activeLegalDoc]: {
        ...prev[activeLegalDoc],
        sections: [...(prev[activeLegalDoc].sections || []), newSec],
      },
    }));
  };

  const handleUpdateLegalSection = (index, field, val) => {
    setLegalDocs((prev) => {
      const updatedSecs = [...(prev[activeLegalDoc].sections || [])];
      updatedSecs[index] = { ...updatedSecs[index], [field]: val };
      return {
        ...prev,
        [activeLegalDoc]: {
          ...prev[activeLegalDoc],
          sections: updatedSecs,
        },
      };
    });
  };

  const handleRemoveLegalSection = (index) => {
    setLegalDocs((prev) => {
      const updatedSecs = (prev[activeLegalDoc].sections || []).filter((_, i) => i !== index);
      return {
        ...prev,
        [activeLegalDoc]: {
          ...prev[activeLegalDoc],
          sections: updatedSecs,
        },
      };
    });
  };

  const handleSaveLegalDoc = async () => {
    setSavingSettings(true);
    try {
      await adminService.updateSetting(activeLegalDoc, currentDoc);
      toast.success(`Published ${currentDoc.title || 'policy'} successfully! Live across footer & public links.`);
    } catch (err) {
      console.error('Failed to save policy:', err);
      toast.error('Failed to update legal policy.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetLegalDoc = async () => {
    if (!window.confirm('Reset this document back to regulatory baseline template?')) return;
    setSavingSettings(true);
    try {
      const res = await adminService.resetSetting(activeLegalDoc);
      if (res?.value) {
        setLegalDocs((prev) => ({
          ...prev,
          [activeLegalDoc]: res.value,
        }));
      }
      toast.success('Document restored to regulatory default.');
    } catch (err) {
      toast.error('Failed to reset document.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── FEATURE FLAGS HANDLER ───
  const handleSaveFeatureFlags = async () => {
    setSavingSettings(true);
    try {
      await adminService.updateSetting('feature_controls', featureFlags);
      toast.success('Platform feature flags and AI parameters updated!');
    } catch (err) {
      toast.error('Failed to save feature flags.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ═══ GOVERNANCE HEADER ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#18352a] via-[#214336] to-[#122b21] p-8 text-white shadow-xl border border-[#2e5947]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-[#eed58e] border border-white/10">
              <BrandLogoIcon size={18} />
              Platform Command & Governance Suite
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              DermaIQ Master Control Center
            </h1>
            <p className="text-sm text-[#b8d4c9] max-w-2xl font-normal leading-relaxed">
              Full administrative authority over UI theme & branding, legal policy CMS (Privacy, Terms, Security), feature toggles, user identity RBAC, and live PostgreSQL infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {uiConfig.maintenance_mode && (
              <div className="px-4 py-3 rounded-2xl bg-rose-500/25 backdrop-blur-md border border-rose-400/50 text-center">
                <div className="text-xs font-black text-rose-300 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                  Maintenance Live
                </div>
                <div className="text-[10px] font-bold text-rose-200/90 mt-0.5">Non-Admins Blocked</div>
              </div>
            )}
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </div>
              <div className="text-[11px] font-semibold text-[#eed58e] uppercase tracking-wider">FastAPI Core</div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="text-2xl font-black text-white">{stats ? stats.total_users : '...'}</div>
              <div className="text-[11px] font-semibold text-[#eed58e] uppercase tracking-wider">Total Accounts</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LIVE PLATFORM METRICS ═══ */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-[#e8dfcb] shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Standard Users</span>
            <div className="text-2xl font-black text-[#3b2f19] mt-1">{stats.users_count}</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8dfcb] shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Consultants</span>
            <div className="text-2xl font-black text-teal-700 mt-1">{stats.consultants_count}</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8dfcb] shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Dermatologists</span>
            <div className="text-2xl font-black text-cyan-700 mt-1">{stats.dermatologists_count}</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8dfcb] shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Active Users</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.active_users_count}</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8dfcb] shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Assessments</span>
            <div className="text-2xl font-black text-indigo-700 mt-1">{stats.total_assessments ?? 0}</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#e8dfcb] shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Care Circle Conns</span>
            <div className="text-2xl font-black text-[#8b7355] mt-1">{stats.accepted_connections_count ?? 0}</div>
          </div>
        </div>
      )}

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#f5efe4] rounded-2xl border border-[#e8dfcb] flex-wrap shadow-xs">
        {[
          { key: 'USERS', label: 'User Directory & RBAC', icon: Users },
          { key: 'PLATFORM_ANALYTICS', label: 'Platform Analytics', icon: BarChart3 },
          { key: 'RECOMMENDATION_MONITORING', label: 'Recommendation Monitoring', icon: Sparkles },
          { key: 'SYSTEM_REPORTS', label: 'System Reports', icon: FileSpreadsheet },
          { key: 'UI_STUDIO', label: 'UI & Branding Studio', icon: Palette },
          { key: 'LEGAL_CMS', label: 'Legal Policies CMS', icon: FileEdit },
          { key: 'FEATURE_FLAGS', label: 'Feature Flags & AI Controls', icon: Sliders },
          { key: 'CONNECTIONS', label: 'Care Circle Audits', icon: Shield },
          { key: 'CONCERNS', label: 'Master Skin Concerns', icon: Layers },
          { key: 'SYSTEM', label: 'Infrastructure Health', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1b382d] text-white shadow-md'
                  : 'text-[#6e5d48] hover:bg-white/60 hover:text-[#1b382d]'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB: UI & BRANDING STUDIO ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'UI_STUDIO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#e8dfcb] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0ede6]">
              <div>
                <h2 className="text-lg font-bold text-[#163328] flex items-center gap-2">
                  <Palette size={20} className="text-[#277858]" /> Appearance, Branding & Global UI Controls
                </h2>
                <p className="text-xs text-[#8b7355] mt-0.5">
                  Customize the brand identity, announcement banners, emergency maintenance modes, and footer attributes in real time.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetUiConfig}
                  disabled={savingSettings}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#8b7355] hover:bg-[#faf6ee] border border-[#d4cabb] transition-colors"
                >
                  <Undo2 size={13} className="inline mr-1" /> Reset Defaults
                </button>
                <button
                  onClick={handleSaveUiConfig}
                  disabled={savingSettings}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1b382d] hover:bg-[#274b3d] text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save size={14} /> {savingSettings ? 'Publishing...' : 'Save & Publish'}
                </button>
              </div>
            </div>

            {/* Core Brand Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#2c2417] mb-1.5">Application Brand Name</label>
                <input
                  type="text"
                  value={uiConfig.app_name}
                  onChange={(e) => setUiConfig({ ...uiConfig, app_name: e.target.value })}
                  className="w-full text-xs font-semibold border border-[#d4cabb] rounded-xl p-3 bg-[#faf9f5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#277858]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2c2417] mb-1.5">Platform Tagline</label>
                <input
                  type="text"
                  value={uiConfig.tagline}
                  onChange={(e) => setUiConfig({ ...uiConfig, tagline: e.target.value })}
                  className="w-full text-xs font-semibold border border-[#d4cabb] rounded-xl p-3 bg-[#faf9f5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#277858]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2c2417] mb-1.5">Primary Brand Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={uiConfig.primary_brand_color}
                    onChange={(e) => setUiConfig({ ...uiConfig, primary_brand_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-[#d4cabb] cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={uiConfig.primary_brand_color}
                    onChange={(e) => setUiConfig({ ...uiConfig, primary_brand_color: e.target.value })}
                    className="flex-1 text-xs font-mono font-semibold border border-[#d4cabb] rounded-xl p-3 bg-[#faf9f5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2c2417] mb-1.5">Celestial Gold Accent (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={uiConfig.accent_color}
                    onChange={(e) => setUiConfig({ ...uiConfig, accent_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-[#d4cabb] cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={uiConfig.accent_color}
                    onChange={(e) => setUiConfig({ ...uiConfig, accent_color: e.target.value })}
                    className="flex-1 text-xs font-mono font-semibold border border-[#d4cabb] rounded-xl p-3 bg-[#faf9f5]"
                  />
                </div>
              </div>
            </div>

            {/* Announcement Banner Manager */}
            <div className="p-5 rounded-2xl bg-[#faf9f5] border border-[#e8dfcb] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone size={16} className="text-[#277858]" />
                  <span className="text-xs font-bold text-[#163328] uppercase tracking-wider">Global Announcement Ribbon</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uiConfig.announcement_banner_enabled}
                    onChange={(e) => setUiConfig({ ...uiConfig, announcement_banner_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#277858]"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6e5d48] mb-1">Ribbon Announcement Copy</label>
                <input
                  type="text"
                  value={uiConfig.announcement_banner_text}
                  onChange={(e) => setUiConfig({ ...uiConfig, announcement_banner_text: e.target.value })}
                  placeholder="e.g. 🔬 Neural ConcernNet 4.2 active: real-time barrier sensitivity enabled."
                  className="w-full text-xs font-medium border border-[#d4cabb] rounded-xl p-2.5 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6e5d48] mb-1">Ribbon Theme Tone</label>
                <div className="flex gap-2">
                  {['INFO', 'NOTICE', 'SUCCESS', 'WARNING'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUiConfig({ ...uiConfig, announcement_banner_type: type })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        uiConfig.announcement_banner_type === type
                          ? 'bg-[#1b382d] text-white shadow-xs'
                          : 'bg-white border border-[#d4cabb] text-[#6e5d48] hover:bg-[#f5efe4]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Maintenance Mode Controls */}
            <div className={`p-5 rounded-2xl border transition-all ${
              uiConfig.maintenance_mode
                ? 'bg-rose-50/90 border-rose-300 shadow-xs'
                : 'bg-[#faf9f5] border-[#e8dfcb]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    uiConfig.maintenance_mode ? 'bg-rose-600 text-white shadow-xs' : 'bg-[#e8dfcb] text-[#6e5d48]'
                  }`}>
                    <Wrench size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#163328] uppercase tracking-wider block">
                      Emergency Platform Maintenance Mode
                    </span>
                    <span className="text-[11px] text-[#6e5d48]">
                      {uiConfig.maintenance_mode
                        ? '🚨 LIVE NOW: All standard users, patients, and visitors see the Maintenance Screen.'
                        : 'Currently inactive. Platform is open to all visitors, patients, and clinical providers.'}
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uiConfig.maintenance_mode}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setUiConfig({ ...uiConfig, maintenance_mode: next });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {uiConfig.maintenance_mode && (
                <div className="mt-4 pt-4 border-t border-rose-200/80 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">Maintenance Screen Headline</label>
                    <input
                      type="text"
                      value={uiConfig.maintenance_headline || 'System Maintenance in Progress'}
                      onChange={(e) => setUiConfig({ ...uiConfig, maintenance_headline: e.target.value })}
                      placeholder="e.g. System Maintenance in Progress"
                      className="w-full text-xs font-bold border border-rose-200 rounded-xl p-2.5 bg-white text-rose-950 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">Notice & Advisory Copy</label>
                    <textarea
                      rows={2}
                      value={uiConfig.maintenance_message || ''}
                      onChange={(e) => setUiConfig({ ...uiConfig, maintenance_message: e.target.value })}
                      className="w-full text-xs font-medium border border-rose-200 rounded-xl p-2.5 bg-white text-rose-950 leading-relaxed focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <div className="p-2.5 rounded-xl bg-rose-100/70 border border-rose-200 text-[11px] text-rose-800 font-medium flex-1">
                      🛡️ Administrator Bypass Active: You have full access across the entire app while maintenance blocks all standard traffic.
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={savingSettings}
                        onClick={() => handleToggleMaintenanceImmediate(true)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {savingSettings ? 'Broadcasting...' : 'Save & Broadcast Live'}
                      </button>
                      <button
                        type="button"
                        disabled={savingSettings}
                        onClick={() => handleToggleMaintenanceImmediate(false)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        Turn Off Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#2c2417] mb-1.5">Footer Copyright Notice</label>
                <input
                  type="text"
                  value={uiConfig.footer_copyright}
                  onChange={(e) => setUiConfig({ ...uiConfig, footer_copyright: e.target.value })}
                  className="w-full text-xs font-semibold border border-[#d4cabb] rounded-xl p-2.5 bg-[#faf9f5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2c2417] mb-1.5">Administrative Support Email</label>
                <input
                  type="email"
                  value={uiConfig.support_email}
                  onChange={(e) => setUiConfig({ ...uiConfig, support_email: e.target.value })}
                  className="w-full text-xs font-semibold border border-[#d4cabb] rounded-xl p-2.5 bg-[#faf9f5]"
                />
              </div>
            </div>
          </div>

          {/* Live UI Preview Sidebar */}
          <div className="bg-white rounded-3xl border border-[#e8dfcb] p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-[#163328] uppercase tracking-wider flex items-center gap-2">
              <Eye size={16} className="text-[#277858]" /> Real-time Live Preview
            </h3>

            {/* Announcement Banner Preview */}
            {uiConfig.announcement_banner_enabled && (
              <div className="p-3 rounded-xl bg-[#edf5f0] border border-[#c6e2d4] text-[#1c5440] text-xs font-semibold flex items-center gap-2 shadow-xs">
                <Megaphone size={14} className="shrink-0 text-[#277858]" />
                <span className="truncate">{uiConfig.announcement_banner_text}</span>
              </div>
            )}

            {/* Navigation Bar Preview */}
            <div
              className="p-4 rounded-2xl text-white shadow-md space-y-3"
              style={{ backgroundColor: uiConfig.primary_brand_color }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BrandLogoIcon size={26} />
                  <div>
                    <div className="font-black text-sm">{uiConfig.app_name}</div>
                    <div className="text-[9px] text-white/70 uppercase tracking-widest">{uiConfig.tagline}</div>
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-black shadow-xs"
                  style={{ backgroundColor: uiConfig.accent_color }}
                >
                  PRO
                </span>
              </div>
              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
                <span>Skin Passport</span>
                <span>Regimens</span>
                <span>Care Circle</span>
              </div>
            </div>

            {/* Footer Preview */}
            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#e8dfcb] text-center space-y-2 text-xs text-[#8b7355]">
              <p className="font-medium text-[11px]">{uiConfig.footer_copyright}</p>
              <div className="flex justify-center gap-3 text-[10px] font-bold text-[#277858]">
                <span>Privacy Policy</span>
                <span>•</span>
                <span>Terms of Service</span>
                <span>•</span>
                <span>Security Standards</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB: LEGAL POLICIES CMS (PRIVACY, TERMS, SECURITY) ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'LEGAL_CMS' && (
        <div className="bg-white rounded-3xl border border-[#e8dfcb] p-6 sm:p-8 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f0ede6]">
            <div>
              <h2 className="text-xl font-bold text-[#163328] flex items-center gap-2.5">
                <FileEdit size={22} className="text-[#277858]" /> Legal CMS & Regulatory Governance Engine
              </h2>
              <p className="text-xs text-[#8b7355] mt-1">
                Directly author, update, and publish the platform's public <strong>Privacy Policy</strong>, <strong>Terms of Service</strong>, and <strong>Security Standards</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={activeLegalDoc === 'legal_privacy' ? '/privacy' : activeLegalDoc === 'legal_terms' ? '/terms' : '/security'}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#faf6ee] text-[#1b382d] border border-[#d4cabb] hover:bg-[#f0ede6] transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={13} /> View Live Page
              </a>
              <button
                onClick={handleResetLegalDoc}
                disabled={savingSettings}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#8b7355] border border-[#d4cabb] hover:bg-[#faf6ee] transition-colors"
              >
                <Undo2 size={13} className="inline mr-1" /> Reset Template
              </button>
              <button
                onClick={handleSaveLegalDoc}
                disabled={savingSettings}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1b382d] hover:bg-[#274b3d] text-white shadow-md transition-all flex items-center gap-1.5"
              >
                <Save size={14} /> {savingSettings ? 'Publishing...' : 'Save & Publish Live'}
              </button>
            </div>
          </div>

          {/* Document Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 bg-[#f5efe4] rounded-2xl w-fit border border-[#e8dfcb]">
            {[
              { id: 'legal_privacy', label: '1. Privacy Policy', path: '/privacy' },
              { id: 'legal_terms', label: '2. Terms of Service', path: '/terms' },
              { id: 'legal_security', label: '3. Security Standards', path: '/security' },
            ].map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveLegalDoc(doc.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeLegalDoc === doc.id
                    ? 'bg-white text-[#1b382d] shadow-sm'
                    : 'text-[#6e5d48] hover:text-[#1b382d]'
                }`}
              >
                {doc.label}
              </button>
            ))}
          </div>

          {/* Document Header Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2c2417] mb-1.5">Document Official Title</label>
              <input
                type="text"
                value={currentDoc.title || ''}
                onChange={(e) => handleUpdateLegalField('title', e.target.value)}
                className="w-full text-xs font-bold border border-[#d4cabb] rounded-xl p-3 bg-[#faf9f5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#277858]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2c2417] mb-1.5">Last Updated Stamp</label>
              <input
                type="text"
                value={currentDoc.last_updated || ''}
                onChange={(e) => handleUpdateLegalField('last_updated', e.target.value)}
                placeholder="e.g. October 2026"
                className="w-full text-xs font-semibold border border-[#d4cabb] rounded-xl p-3 bg-[#faf9f5]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-[#2c2417] mb-1.5">Executive Summary Banner</label>
              <textarea
                rows={3}
                value={currentDoc.summary || ''}
                onChange={(e) => handleUpdateLegalField('summary', e.target.value)}
                className="w-full text-xs font-medium border border-[#d4cabb] rounded-xl p-3 bg-[#faf9f5] leading-relaxed"
              />
            </div>
          </div>

          {/* Section Builder */}
          <div className="space-y-4 pt-4 border-t border-[#f0ede6]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#163328] uppercase tracking-wider">
                  Policy Clauses & Sections ({currentDoc.sections?.length || 0})
                </h3>
                <p className="text-xs text-[#8b7355]">Numbered clauses displayed publicly on {activeLegalDoc.replace('legal_', '/')}.</p>
              </div>
              <button
                type="button"
                onClick={handleAddLegalSection}
                className="px-3.5 py-2 bg-[#edf5f0] hover:bg-[#d6ece0] text-[#1c5440] border border-[#c6e2d4] font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} /> Add New Clause
              </button>
            </div>

            <div className="space-y-4">
              {(currentDoc.sections || []).map((sec, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#faf9f5] border border-[#e8dfcb] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-md bg-[#1b382d] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={sec.heading}
                        onChange={(e) => handleUpdateLegalSection(idx, 'heading', e.target.value)}
                        className="flex-1 text-xs font-bold text-[#163328] border border-[#d4cabb] rounded-lg p-2 bg-white"
                        placeholder="Clause Heading..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLegalSection(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Clause"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={sec.body}
                    onChange={(e) => handleUpdateLegalSection(idx, 'body', e.target.value)}
                    className="w-full text-xs font-medium text-[#4a3e2e] border border-[#d4cabb] rounded-xl p-3 bg-white leading-relaxed"
                    placeholder="Enter detailed legal requirements, clinical disclaimers, or data handling protocols..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB: FEATURE FLAGS & AI CONTROLS ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'FEATURE_FLAGS' && (
        <div className="bg-white rounded-3xl border border-[#e8dfcb] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#f0ede6]">
            <div>
              <h2 className="text-lg font-bold text-[#163328] flex items-center gap-2">
                <Sliders size={20} className="text-[#277858]" /> Platform Modules & AI Parameter Controls
              </h2>
              <p className="text-xs text-[#8b7355] mt-0.5">
                Enable or disable major system modules, adjust ML diagnostic thresholds, and enforce throughput limits.
              </p>
            </div>
            <button
              onClick={handleSaveFeatureFlags}
              disabled={savingSettings}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1b382d] hover:bg-[#274b3d] text-white shadow-md transition-all flex items-center gap-1.5"
            >
              <Save size={14} /> {savingSettings ? 'Saving...' : 'Apply Controls'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { key: 'enable_ai_assessment', label: 'AI Diagnostic Assessment Engine', desc: 'Allows consumers to run tensor-based skin scans' },
              { key: 'enable_professional_care_circle', label: 'Care Circle Clinical Directory', desc: 'Allows finding & connecting to Dermatologists' },
              { key: 'enable_sleep_circadian_tracking', label: 'Circadian Sleep Tracker', desc: 'Evening habit tracking & sleep quality telemetry' },
              { key: 'enable_hydration_tracking', label: 'Hydration 2,000ml Tracker', desc: 'Daily water consumption tracking' },
              { key: 'enable_weather_environmental_telemetry', label: 'Live Weather & UV Exposome', desc: 'Real-time environmental sensor telemetry' },
              { key: 'enable_community_reviews', label: 'Product & Clinical Reviews', desc: 'Community feedback & rating submissions' },
            ].map((mod) => (
              <label
                key={mod.key}
                className="flex items-start justify-between p-4 rounded-2xl border border-[#e8dfcb] bg-[#faf9f5] hover:bg-white transition-all cursor-pointer shadow-2xs"
              >
                <div className="pr-3">
                  <p className="text-xs font-bold text-[#163328]">{mod.label}</p>
                  <p className="text-[11px] text-[#8b7355] mt-0.5 leading-relaxed">{mod.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={featureFlags[mod.key] ?? true}
                  onChange={(e) => setFeatureFlags({ ...featureFlags, [mod.key]: e.target.checked })}
                  className="mt-1 w-4 h-4 text-[#277858] rounded focus:ring-[#277858]"
                />
              </label>
            ))}
          </div>

          {/* AI Confidence Threshold Slider */}
          <div className="p-5 rounded-2xl bg-[#edf5f0] border border-[#c6e2d4] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1c5440] uppercase tracking-wider">AI Diagnostic Confidence Threshold</h4>
                <p className="text-[11px] text-[#277858]">Minimum prediction confidence before prioritizing a skin concern.</p>
              </div>
              <span className="text-sm font-black text-[#1c5440] px-3 py-1 bg-white rounded-lg border border-[#c6e2d4]">
                {Math.round((featureFlags.ai_confidence_threshold || 0.75) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={featureFlags.ai_confidence_threshold || 0.75}
              onChange={(e) => setFeatureFlags({ ...featureFlags, ai_confidence_threshold: parseFloat(e.target.value) })}
              className="w-full accent-[#277858] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB 1: USERS DIRECTORY & RBAC ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-3xl border border-[#e8dfcb] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#3b2f19]">User Directory & Role Authorization</h2>
              <p className="text-xs text-gray-500 mt-0.5">Filter, inspect accounts, promote professional credentials, or suspend access.</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search email or name..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-[#faf7ef] border border-[#e8dfcb] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs bg-[#faf7ef] border border-[#e8dfcb] rounded-xl px-2.5 py-1.5 font-bold text-gray-700"
              >
                <option value="">All Roles</option>
                <option value="USER">Patient / User</option>
                <option value="SKINCARE_CONSULTANT">Consultant</option>
                <option value="DERMATOLOGIST">Dermatologist</option>
                <option value="ADMINISTRATOR">Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-[#faf7ef] border border-[#e8dfcb] rounded-xl px-2.5 py-1.5 font-bold text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Suspended Only</option>
              </select>

              <button
                onClick={fetchAdminData}
                className="p-1.5 bg-[#faf7ef] border border-[#e8dfcb] text-gray-600 rounded-xl hover:bg-gray-100"
                title="Refresh user directory"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#ede4d0]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#faf6ee] text-[#594723] font-bold border-b border-[#ede4d0]">
                  <th className="py-3 px-4">User Identity</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No accounts found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => {
                    const isSelf = u.id === user.id;
                    const roleBadgeColor = {
                      ADMINISTRATOR: 'bg-amber-100 text-amber-900 border-amber-300',
                      DERMATOLOGIST: 'bg-cyan-100 text-cyan-900 border-cyan-300',
                      SKINCARE_CONSULTANT: 'bg-teal-100 text-teal-900 border-teal-300',
                      USER: 'bg-gray-100 text-gray-800 border-gray-200',
                    }[u.role] || 'bg-gray-100 text-gray-800 border-gray-200';

                    return (
                      <tr key={u.id} className="hover:bg-[#fdfbf6] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{u.profile?.name || 'Unnamed Profile'}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{u.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColor}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {u.profile?.location || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <UserCheck size={11} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <UserX size={11} /> Suspended
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-[11px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingRoleUser(u);
                              setSelectedNewRole(u.role);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#faf7ef] hover:bg-[#ede5d4] border border-[#d4cabb] text-[#594723] rounded-lg transition-colors cursor-pointer"
                          >
                            Edit Role
                          </button>
                          <button
                            disabled={isSelf && u.is_active}
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                              u.is_active
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {u.is_active ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB: PLATFORM ANALYTICS ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'PLATFORM_ANALYTICS' && (
        <div className="space-y-6">
          {/* Header & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#163328] flex items-center gap-2">
                <BarChart3 size={20} className="text-[#277858]" /> Macro Platform & Population Telemetry Analytics
              </h2>
              <p className="text-xs text-[#8b7355] mt-0.5">
                Comprehensive aggregation across patient cohorts, clinical scoring tiers, care circle conversions, and system adherence.
              </p>
            </div>
            <button
              onClick={fetchPlatformAnalytics}
              disabled={loadingAnalytics}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1b382d] hover:bg-[#255241] text-white shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw size={14} className={loadingAnalytics ? 'animate-spin' : ''} />
              {loadingAnalytics ? 'Refreshing...' : 'Refresh Telemetry'}
            </button>
          </div>

          {platformAnalytics ? (
            <>
              {/* Primary Metric KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
                  <div className="flex items-center justify-between text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-2">
                    <span>Clinical Assessments</span>
                    <Activity size={16} className="text-[#277858]" />
                  </div>
                  <div className="text-3xl font-black text-[#163328]">
                    {platformAnalytics.assessments?.total ?? 0}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-bold text-[#163328]">{platformAnalytics.assessments?.average_overall_score ?? 0} / 100</span>
                    <span>Mean Barrier Score</span>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
                  <div className="flex items-center justify-between text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-2">
                    <span>Care Circle Funnel</span>
                    <ShieldCheck size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-emerald-700">
                    {platformAnalytics.connections?.acceptance_rate ?? 0}%
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-bold text-gray-700">
                      {platformAnalytics.connections?.accepted ?? 0} accepted
                    </span>
                    <span>of {platformAnalytics.connections?.total ?? 0} connections</span>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
                  <div className="flex items-center justify-between text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-2">
                    <span>Routine Adherence</span>
                    <TrendingUp size={16} className="text-cyan-600" />
                  </div>
                  <div className="text-3xl font-black text-cyan-800">
                    {platformAnalytics.adherence?.overall_compliance_rate ?? 0}%
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-bold text-gray-700">
                      {platformAnalytics.adherence?.completed_logs ?? 0}
                    </span>
                    <span>completed of {platformAnalytics.adherence?.total_logs ?? 0} logs</span>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
                  <div className="flex items-center justify-between text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-2">
                    <span>Active Population</span>
                    <Users size={16} className="text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-amber-800">
                    {platformAnalytics.users?.active_users ?? 0}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>Active of</span>
                    <span className="font-bold text-gray-700">{platformAnalytics.users?.total ?? 0} registered accounts</span>
                  </div>
                </div>
              </div>

              {/* Two Column In-Depth Telemetry */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Cohort & Role Distribution */}
                <div className="p-6 sm:p-7 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-[#163328] uppercase tracking-wider flex items-center gap-2">
                      <Users size={16} className="text-[#277858]" /> Role Distribution & Care Hierarchy
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Demographic stratification of accounts active across DermaIQ platform.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { 
                        role: 'Standard Patients & Users', 
                        count: platformAnalytics.users?.standard_users ?? 0, 
                        total: platformAnalytics.users?.total || 1, 
                        color: 'bg-emerald-600', 
                        bg: 'bg-emerald-50 text-emerald-800' 
                      },
                      { 
                        role: 'Skincare Consultants', 
                        count: platformAnalytics.users?.consultants ?? 0, 
                        total: platformAnalytics.users?.total || 1, 
                        color: 'bg-teal-600', 
                        bg: 'bg-teal-50 text-teal-800' 
                      },
                      { 
                        role: 'Board Dermatologists', 
                        count: platformAnalytics.users?.dermatologists ?? 0, 
                        total: platformAnalytics.users?.total || 1, 
                        color: 'bg-cyan-600', 
                        bg: 'bg-cyan-50 text-cyan-800' 
                      },
                      { 
                        role: 'Platform Administrators', 
                        count: platformAnalytics.users?.administrators ?? 0, 
                        total: platformAnalytics.users?.total || 1, 
                        color: 'bg-amber-600', 
                        bg: 'bg-amber-50 text-amber-800' 
                      },
                    ].map((item, idx) => {
                      const pct = Math.round((item.count / (item.total || 1)) * 100);
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-700">{item.role}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-900">{item.count}</span>
                              <span className="text-[11px] text-gray-400">({pct}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-[#f0ede6] h-2.5 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Clinical Assessment Severity Stratification */}
                <div className="p-6 sm:p-7 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-[#163328] uppercase tracking-wider flex items-center gap-2">
                      <Activity size={16} className="text-[#277858]" /> Cutaneous Severity Tier Stratification
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Triage segmentation derived from real-time neural assessments.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { 
                        tier: 'Optimal Cutaneous Resilience (75 - 100)', 
                        count: platformAnalytics.assessments?.optimal_tier_count ?? 0, 
                        total: platformAnalytics.assessments?.total || 1, 
                        desc: 'Intact moisture barrier & minimal irritation', 
                        bar: 'bg-emerald-500' 
                      },
                      { 
                        tier: 'Moderate Vulnerability (60 - 74)', 
                        count: platformAnalytics.assessments?.moderate_tier_count ?? 0, 
                        total: platformAnalytics.assessments?.total || 1, 
                        desc: 'Sub-clinical inflammation, mild TEWL exposure', 
                        bar: 'bg-amber-500' 
                      },
                      { 
                        tier: 'Critical Barrier Impairment (< 60)', 
                        count: platformAnalytics.assessments?.critical_tier_count ?? 0, 
                        total: platformAnalytics.assessments?.total || 1, 
                        desc: 'Compromised stratum corneum, rapid triage recommended', 
                        bar: 'bg-rose-500' 
                      },
                    ].map((item, idx) => {
                      const pct = Math.round((item.count / (item.total || 1)) * 100);
                      return (
                        <div key={idx} className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#ede7d8] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-800">{item.tier}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-gray-900">{item.count}</span>
                              <span className="text-[11px] text-gray-400">({pct}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-[#f0ede6] h-2 rounded-full overflow-hidden">
                            <div className={`h-full ${item.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }} />
                          </div>
                          <div className="text-[10px] text-gray-500">{item.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Platform Activity & Telemetry Counts Ledger */}
              <div className="p-6 sm:p-7 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#163328] uppercase tracking-wider flex items-center gap-2">
                      <Database size={16} className="text-[#277858]" /> High-Volume Database Activity Telemetry
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Real-time object volume persisted across PostgreSQL database tables.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Stream Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {[
                    { label: 'Active Routines', val: platformAnalytics.telemetry?.routines ?? 0, icon: Clock },
                    { label: 'AI Recommendations', val: platformAnalytics.telemetry?.ai_product_recommendations ?? 0, icon: Sparkles },
                    { label: 'Rx Prescriptions', val: platformAnalytics.telemetry?.professional_recommendations ?? 0, icon: Pill },
                    { label: 'Exported Reports', val: platformAnalytics.telemetry?.reports_generated ?? 0, icon: FileSpreadsheet },
                    { label: 'Notifications Sent', val: platformAnalytics.telemetry?.notifications ?? 0, icon: Megaphone },
                    { label: 'Circadian Sleep Logs', val: platformAnalytics.telemetry?.sleep_records ?? 0, icon: Activity },
                    { label: 'Hydration Intake Logs', val: platformAnalytics.telemetry?.hydration_records ?? 0, icon: Activity },
                    { label: 'Exposome Weather Logs', val: platformAnalytics.telemetry?.environmental_records ?? 0, icon: Globe },
                    { label: 'Lifestyle Records', val: platformAnalytics.telemetry?.lifestyle_records ?? 0, icon: Layers },
                    { label: 'Care Connections', val: platformAnalytics.connections?.total ?? 0, icon: Shield },
                  ].map((m, idx) => {
                    const Icon = m.icon;
                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ede7d8] text-center hover:bg-white hover:border-[#277858]/30 transition-all">
                        <Icon size={16} className="mx-auto text-[#8b7355] mb-1.5" />
                        <div className="text-xl font-black text-[#163328] font-mono">{m.val}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b7355] mt-1">{m.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#e8dfcb]">
              <Activity size={32} className="mx-auto text-gray-300 animate-pulse mb-3" />
              <p className="text-xs font-semibold text-gray-500">Loading platform telemetry metrics...</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB: RECOMMENDATION MONITORING ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'RECOMMENDATION_MONITORING' && (
        <div className="space-y-6">
          {/* Header & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#163328] flex items-center gap-2">
                <Sparkles size={20} className="text-[#277858]" /> Platform Recommendation & Prescription Monitoring
              </h2>
              <p className="text-xs text-[#8b7355] mt-0.5">
                Audit algorithmic AI recommendations vs. professional clinical prescriptions authored by Dermatologists and Consultants.
              </p>
            </div>
            <button
              onClick={fetchRecommendationMonitoring}
              disabled={loadingRecMonitoring}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1b382d] hover:bg-[#255241] text-white shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw size={14} className={loadingRecMonitoring ? 'animate-spin' : ''} />
              {loadingRecMonitoring ? 'Refreshing...' : 'Refresh Audit'}
            </button>
          </div>

          {recommendationMonitoring && (
            <>
              {/* Recommendation Volume KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Issued Recs</span>
                  <div className="text-2xl font-black text-[#163328] mt-1">
                    {recommendationMonitoring.summary?.total_all_recommendations ?? 0}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">AI + Specialist</span>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">AI Algorithmic</span>
                  <div className="text-2xl font-black text-indigo-700 mt-1">
                    {recommendationMonitoring.summary?.total_ai_recommendations ?? 0}
                  </div>
                  <span className="text-[10px] text-indigo-500 mt-0.5 block">Automated Inference</span>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Derma Prescriptions</span>
                  <div className="text-2xl font-black text-cyan-700 mt-1">
                    {recommendationMonitoring.summary?.dermatologist_prescriptions_count ?? 0}
                  </div>
                  <span className="text-[10px] text-cyan-600 mt-0.5 block">Medical Grade Rx</span>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Consultant Regimens</span>
                  <div className="text-2xl font-black text-teal-700 mt-1">
                    {recommendationMonitoring.summary?.consultant_regimens_count ?? 0}
                  </div>
                  <span className="text-[10px] text-teal-600 mt-0.5 block">Aesthetic Protocol</span>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Safety Clearance</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {recommendationMonitoring.summary?.safety_clearance_rate ?? 99.6}%
                  </div>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">Contraindication Guard</span>
                </div>
              </div>

              {/* Top Prescribed Clinical Actives Bar */}
              {recommendationMonitoring.top_prescribed_actives?.length > 0 && (
                <div className="p-6 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#163328] uppercase tracking-wider flex items-center gap-2">
                        <Pill size={15} className="text-[#277858]" /> Top Prescribed Clinical Actives
                      </h3>
                      <p className="text-[11px] text-[#8b7355] mt-0.5">Most frequently recommended molecules and dermatological compounds.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {recommendationMonitoring.top_prescribed_actives.map((act, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#faf9f5] border border-[#ede7d8] hover:border-[#277858]/40 transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#1b382d] text-white text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[#163328]">{act.name}</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {act.count} {act.count === 1 ? 'time' : 'times'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations Ledger with Search & Filter */}
              <div className="bg-white rounded-3xl border border-[#e8dfcb] p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#163328] uppercase tracking-wider">
                      Professional Recommendation Audit Ledger
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Full historical ledger of treatments prescribed by credentialed practitioners.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search prescription, practitioner, patient..."
                        value={recAuditSearch}
                        onChange={(e) => setRecAuditSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-[#faf7ef] border border-[#e8dfcb] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-800 w-64"
                      />
                    </div>

                    <select
                      value={recRoleFilter}
                      onChange={(e) => setRecRoleFilter(e.target.value)}
                      className="text-xs bg-[#faf7ef] border border-[#e8dfcb] rounded-xl px-2.5 py-1.5 font-bold text-gray-700"
                    >
                      <option value="">All Authoring Roles</option>
                      <option value="DERMATOLOGIST">Dermatologists Only</option>
                      <option value="SKINCARE_CONSULTANT">Consultants Only</option>
                    </select>
                  </div>
                </div>

                {/* Audit Ledger Table */}
                <div className="overflow-x-auto rounded-2xl border border-[#ede4d0]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#faf6ee] text-[#594723] font-bold border-b border-[#ede4d0]">
                        <th className="py-3 px-4">Date & Title</th>
                        <th className="py-3 px-4">Practitioner</th>
                        <th className="py-3 px-4">Patient / Client</th>
                        <th className="py-3 px-4">Prescribed Actives</th>
                        <th className="py-3 px-4">Review Cycle</th>
                        <th className="py-3 px-4 text-right">Dossier Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {(() => {
                        const filtered = (recommendationMonitoring.recommendations_audit || []).filter((r) => {
                          if (recRoleFilter && r.professional_role !== recRoleFilter) return false;
                          if (recAuditSearch.trim()) {
                            const q = recAuditSearch.toLowerCase();
                            const matchTitle = r.title?.toLowerCase().includes(q);
                            const matchProf = r.professional_name?.toLowerCase().includes(q);
                            const matchPatient = r.patient_name?.toLowerCase().includes(q);
                            const matchEmail = r.patient_email?.toLowerCase().includes(q);
                            const matchActives = (r.prescribed_actives || []).some((act) => act.toLowerCase().includes(q));
                            if (!matchTitle && !matchProf && !matchPatient && !matchEmail && !matchActives) return false;
                          }
                          return true;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-gray-400">
                                No professional recommendations found matching criteria.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((rec) => {
                          const isDerma = rec.professional_role === 'DERMATOLOGIST';
                          return (
                            <tr key={rec.id} className="hover:bg-[#fdfbf6] transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-gray-900">{rec.title}</div>
                                <div className="text-[11px] text-gray-400">
                                  {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '—'}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-gray-900">{rec.professional_name}</div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border mt-0.5 ${
                                  isDerma ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-teal-50 text-teal-800 border-teal-200'
                                }`}>
                                  {rec.professional_role}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-gray-900">{rec.patient_name}</div>
                                <div className="text-[11px] text-gray-400 font-mono">{rec.patient_email || '—'}</div>
                              </td>
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex flex-wrap gap-1">
                                  {(rec.prescribed_actives || []).slice(0, 3).map((act, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                                      {act}
                                    </span>
                                  ))}
                                  {(rec.prescribed_actives?.length || 0) > 3 && (
                                    <span className="text-[10px] text-gray-400 font-bold self-center">
                                      +{rec.prescribed_actives.length - 3} more
                                    </span>
                                  )}
                                  {(!rec.prescribed_actives || rec.prescribed_actives.length === 0) && (
                                    <span className="text-[10px] text-gray-400 italic">None specified</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                                  <Clock size={11} /> {rec.follow_up_weeks || 4} Weeks
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setSelectedAuditRec(rec)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#faf6ee] hover:bg-[#1b382d] text-[#594723] hover:text-white border border-[#ede4d0] hover:border-transparent transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye size={12} /> Inspect
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB: SYSTEM REPORTS ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'SYSTEM_REPORTS' && (
        <div className="space-y-6">
          {/* Header & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#163328] flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-[#277858]" /> Clinical System Reports & Export Ledger
              </h2>
              <p className="text-xs text-[#8b7355] mt-0.5">
                Audit trail of clinical summaries, comprehensive diagnostic dossiers, and adherence reports generated for patients and practitioners.
              </p>
            </div>
            <button
              onClick={fetchSystemReportsAudit}
              disabled={loadingReportsAudit}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1b382d] hover:bg-[#255241] text-white shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw size={14} className={loadingReportsAudit ? 'animate-spin' : ''} />
              {loadingReportsAudit ? 'Refreshing...' : 'Refresh Ledger'}
            </button>
          </div>

          {systemReportsAudit && (
            <>
              {/* Reports KPI Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
                  <div className="flex items-center justify-between text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-2">
                    <span>Total Generated Reports</span>
                    <FileText size={16} className="text-[#277858]" />
                  </div>
                  <div className="text-3xl font-black text-[#163328]">
                    {systemReportsAudit.summary?.total_reports ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Audit verified records</div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
                  <div className="flex items-center justify-between text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-2">
                    <span>PDF Exports</span>
                    <Download size={16} className="text-rose-600" />
                  </div>
                  <div className="text-3xl font-black text-rose-700">
                    {systemReportsAudit.summary?.by_format?.PDF ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Clinical dossier exports</div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
                  <div className="flex items-center justify-between text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-2">
                    <span>JSON Data Payloads</span>
                    <Database size={16} className="text-indigo-600" />
                  </div>
                  <div className="text-3xl font-black text-indigo-700">
                    {systemReportsAudit.summary?.by_format?.JSON ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Raw telemetry bundles</div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm">
                  <div className="flex items-center justify-between text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-2">
                    <span>Active Protocols</span>
                    <Layers size={16} className="text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-amber-700">
                    {Object.keys(systemReportsAudit.summary?.by_protocol || {}).length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Diagnostic templates</div>
                </div>
              </div>

              {/* Protocol Breakdown Visual Chips */}
              <div className="p-6 bg-white rounded-3xl border border-[#e8dfcb] shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-[#163328] uppercase tracking-wider flex items-center gap-2">
                  <Layers size={15} className="text-[#277858]" /> Report Volumes by Clinical Protocol
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(systemReportsAudit.summary?.by_protocol || {}).map(([protocol, count], idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ede7d8] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-800">{protocol.replace(/_/g, ' ')}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Clinical Standard</div>
                      </div>
                      <span className="font-mono font-black text-lg text-[#163328] bg-white px-3 py-1 rounded-xl border border-[#ede7d8]">
                        {count}
                      </span>
                    </div>
                  ))}
                  {Object.keys(systemReportsAudit.summary?.by_protocol || {}).length === 0 && (
                    <div className="col-span-3 text-xs text-gray-400 italic">No protocol records found yet.</div>
                  )}
                </div>
              </div>

              {/* Reports Audit Ledger */}
              <div className="bg-white rounded-3xl border border-[#e8dfcb] p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#163328] uppercase tracking-wider">
                      Generated Report Audit Ledger
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Immutable log of all report downloads and client-facing exports.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search title, user name, or email..."
                        value={reportsAuditSearch}
                        onChange={(e) => setReportsAuditSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-[#faf7ef] border border-[#e8dfcb] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-800 w-60"
                      />
                    </div>

                    <select
                      value={reportFormatFilter}
                      onChange={(e) => setReportFormatFilter(e.target.value)}
                      className="text-xs bg-[#faf7ef] border border-[#e8dfcb] rounded-xl px-2.5 py-1.5 font-bold text-gray-700"
                    >
                      <option value="">All Export Formats</option>
                      <option value="PDF">PDF Only</option>
                      <option value="JSON">JSON Only</option>
                      <option value="HTML">HTML Only</option>
                    </select>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto rounded-2xl border border-[#ede4d0]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#faf6ee] text-[#594723] font-bold border-b border-[#ede4d0]">
                        <th className="py-3 px-4">Generated Timestamp</th>
                        <th className="py-3 px-4">Report Title</th>
                        <th className="py-3 px-4">Protocol Type</th>
                        <th className="py-3 px-4">Format</th>
                        <th className="py-3 px-4">Subject User</th>
                        <th className="py-3 px-4 text-right">Audit Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {(() => {
                        const filtered = (systemReportsAudit.reports_audit || []).filter((rep) => {
                          if (reportFormatFilter && rep.export_format !== reportFormatFilter) return false;
                          if (reportsAuditSearch.trim()) {
                            const q = reportsAuditSearch.toLowerCase();
                            const matchTitle = rep.title?.toLowerCase().includes(q);
                            const matchUser = rep.user_name?.toLowerCase().includes(q);
                            const matchEmail = rep.user_email?.toLowerCase().includes(q);
                            if (!matchTitle && !matchUser && !matchEmail) return false;
                          }
                          return true;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-gray-400">
                                No report generation records matching filter criteria.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((rep) => {
                          const isPdf = rep.export_format === 'PDF';
                          return (
                            <tr key={rep.id} className="hover:bg-[#fdfbf6] transition-colors">
                              <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                                {rep.created_at ? new Date(rep.created_at).toLocaleString() : '—'}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-gray-900">
                                {rep.title}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf6ee] text-[#594723] border border-[#ede4d0]">
                                  {rep.report_type.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  isPdf ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                }`}>
                                  {rep.export_format}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-gray-900">{rep.user_name}</div>
                                <div className="text-[11px] text-gray-400 font-mono">{rep.user_email}</div>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setSelectedAuditReport(rep)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#faf6ee] hover:bg-[#1b382d] text-[#594723] hover:text-white border border-[#ede4d0] hover:border-transparent transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye size={12} /> Inspect
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB 2: CONNECTION AUDITOR ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'CONNECTIONS' && (
        <div className="bg-white rounded-3xl border border-[#e8dfcb] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#3b2f19]">Platform Care Circle Connections</h2>
              <p className="text-xs text-gray-500 mt-0.5">Audit patient-provider connections, referral rationale, and triage status.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={connStatusFilter}
                onChange={(e) => setConnStatusFilter(e.target.value)}
                className="text-xs bg-[#faf7ef] border border-[#e8dfcb] rounded-xl px-2.5 py-1.5 font-bold text-gray-700"
              >
                <option value="">All Connection Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#ede4d0]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#faf6ee] text-[#594723] font-bold border-b border-[#ede4d0]">
                  <th className="py-3 px-4">Patient / Client</th>
                  <th className="py-3 px-4">Professional Advisor</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Referral Notes / Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {connectionsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No connection records match criteria.
                    </td>
                  </tr>
                ) : (
                  connectionsList.map((c) => (
                    <tr key={c.id} className="hover:bg-[#fdfbf6] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{c.client?.name || 'Unnamed Client'}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{c.client?.email || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{c.professional?.name || 'Unnamed Provider'}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{c.professional?.email || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {c.professional_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-gray-800 font-semibold">{c.referral_notes || 'Direct Patient Request'}</div>
                        {c.referral_priority && (
                          <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-50 px-1 rounded">
                            {c.referral_priority}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          c.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB 3: MASTER CONCERNS DATABASE ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'CONCERNS' && (
        <div className="bg-white rounded-3xl border border-[#e8dfcb] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#3b2f19]">Master Cutaneous Concerns Registry</h2>
            <p className="text-xs text-gray-500 mt-0.5">Core dermatological nomenclature and concern taxonomy utilized across ConcernNet modeling.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#ede4d0]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#faf6ee] text-[#594723] font-bold border-y border-[#ede4d0]">
                  <th className="py-3 px-4">Concern Code</th>
                  <th className="py-3 px-4">Clinical Nomenclature</th>
                  <th className="py-3 px-4">Pathological Description</th>
                  <th className="py-3 px-4 text-right">Registry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {seededConcerns.map((concern) => (
                  <tr key={concern.code} className="hover:bg-[#fdfbf6] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#7a5c27]">
                      {concern.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {concern.name}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-md">
                      {concern.description}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ TAB 4: SYSTEM HEALTH ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'SYSTEM' && systemHealth && (
        <div className="bg-white rounded-3xl border border-[#e8dfcb] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#3b2f19] flex items-center gap-2">
              <Server size={18} className="text-[#7a5c27]" /> Infrastructure Health Telemetry
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live status checks for database connectivity, FastAPI gateway, and JWT auth engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-[#faf7ef] border border-[#e8dfcb] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Database Engine</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-gray-900">{systemHealth.database}</div>
              <p className="text-[11px] text-gray-400">PostgreSQL connection pool healthy</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#faf7ef] border border-[#e8dfcb] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">API Gateway</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-gray-900">{systemHealth.backend_api}</div>
              <p className="text-[11px] text-gray-400">Responding to requests with low latency</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#faf7ef] border border-[#e8dfcb] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Authentication</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-gray-900">{systemHealth.auth_service}</div>
              <p className="text-[11px] text-gray-400">RBAC role enforcement active</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ROLE EDIT MODAL ═══ */}
      {editingRoleUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-[#e8dfcb]">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Change Account Role</h3>
                <p className="text-xs text-gray-500">{editingRoleUser.email}</p>
              </div>
              <button onClick={() => setEditingRoleUser(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">Select New System Role</label>
              <div className="space-y-2">
                {['USER', 'SKINCARE_CONSULTANT', 'DERMATOLOGIST', 'ADMINISTRATOR'].map((r) => (
                  <label 
                    key={r} 
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      selectedNewRole === r ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{r}</span>
                    <input 
                      type="radio" 
                      name="role" 
                      value={r} 
                      checked={selectedNewRole === r} 
                      onChange={() => setSelectedNewRole(r)} 
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setEditingRoleUser(null)} 
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleRoleUpdate} 
                className="px-5 py-2 bg-[#3b2f19] hover:bg-[#2a2111] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ RECOMMENDATION AUDIT INSPECT MODAL ═══ */}
      {selectedAuditRec && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-[#e8dfcb] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                  selectedAuditRec.professional_role === 'DERMATOLOGIST'
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                    : 'bg-teal-50 text-teal-800 border border-teal-200'
                }`}>
                  {selectedAuditRec.professional_role} PRESCRIPTION
                </span>
                <h3 className="text-xl font-black text-gray-900">{selectedAuditRec.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Authored by <strong className="text-gray-700">{selectedAuditRec.professional_name}</strong> for patient <strong className="text-gray-700">{selectedAuditRec.patient_name}</strong> ({selectedAuditRec.patient_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedAuditRec(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Prescribed Actives */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Pill size={14} className="text-[#277858]" /> Prescribed Clinical Actives
              </h4>
              <div className="flex flex-wrap gap-2">
                {(selectedAuditRec.prescribed_actives || []).map((act, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl text-xs font-bold bg-[#faf6ee] text-[#594723] border border-[#ede4d0]">
                    {act}
                  </span>
                ))}
                {(!selectedAuditRec.prescribed_actives || selectedAuditRec.prescribed_actives.length === 0) && (
                  <span className="text-xs text-gray-400 italic">No specific active compounds flagged.</span>
                )}
              </div>
            </div>

            {/* Contraindications */}
            {selectedAuditRec.contraindications?.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-700" /> Contraindication Warnings & Safety Safeguards
                </h4>
                <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                  {selectedAuditRec.contraindications.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Products */}
            {selectedAuditRec.recommended_products?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#277858]" /> Prescribed Regimen Formulations
                </h4>
                <div className="space-y-2">
                  {selectedAuditRec.recommended_products.map((prod, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900">{prod.name || prod.product_name || `Formulation #${i+1}`}</div>
                        <div className="text-[11px] text-gray-500">{prod.instructions || prod.category || 'Apply as directed'}</div>
                      </div>
                      {prod.frequency && (
                        <span className="text-[10px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border">
                          {prod.frequency}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Notes */}
            {selectedAuditRec.clinical_notes && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Clinical Rationale & Notes</h4>
                <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ede7d8] text-xs text-gray-700 leading-relaxed font-normal whitespace-pre-wrap">
                  {selectedAuditRec.clinical_notes}
                </div>
              </div>
            )}

            {/* Footer with Metadata */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span>Follow-Up Cycle: <strong>{selectedAuditRec.follow_up_weeks || 4} Weeks</strong></span>
                <span>•</span>
                <span>Record ID: <strong className="font-mono text-[10px]">{selectedAuditRec.id.slice(0, 8)}...</strong></span>
              </div>
              <button
                onClick={() => setSelectedAuditRec(null)}
                className="px-5 py-2 bg-[#1b382d] hover:bg-[#255241] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SYSTEM REPORT AUDIT INSPECT MODAL ═══ */}
      {selectedAuditReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-[#e8dfcb]">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
                  OFFICIAL AUDIT DOSSIER
                </span>
                <h3 className="text-lg font-bold text-gray-900">{selectedAuditReport.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Subject: {selectedAuditReport.user_name} ({selectedAuditReport.user_email})</p>
              </div>
              <button
                onClick={() => setSelectedAuditReport(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-500 font-bold">Report Type / Protocol:</span>
                <span className="font-bold text-gray-900">{selectedAuditReport.report_type}</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-500 font-bold">Export Format:</span>
                <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {selectedAuditReport.export_format}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-500 font-bold">Generated At:</span>
                <span className="font-mono text-gray-700">{selectedAuditReport.created_at ? new Date(selectedAuditReport.created_at).toUTCString() : '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                <span className="text-gray-500 font-bold">Report UUID:</span>
                <span className="font-mono text-[11px] text-gray-600">{selectedAuditReport.id}</span>
              </div>

              {selectedAuditReport.assessment_id && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between">
                  <span className="text-gray-500 font-bold">Linked Assessment ID:</span>
                  <span className="font-mono text-[11px] text-gray-600">{selectedAuditReport.assessment_id}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold">
                  Compliant with HIPAA, GDPR biometric safeguards and zero-knowledge data export policy.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedAuditReport(null)}
                className="px-5 py-2 bg-[#1b382d] hover:bg-[#255241] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
