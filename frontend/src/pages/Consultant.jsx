import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Sparkles, Heart, CheckCircle2, Search, 
  Calendar, Clock, Droplet, Moon, Sun, ChevronRight, 
  Plus, FileText, FileSpreadsheet, Check, ShieldCheck, X, AlertCircle, 
  XCircle, CheckCircle, RefreshCw, Layers, Shield, MessageSquare, Stethoscope,
  UserPlus, UserCheck, Activity, Compass, ArrowUpRight,
  Filter, Printer, Copy, CheckCheck, Edit3, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultant';
import { connectionsService } from '../services/connections';
import { professionalsService } from '../services/professionals';
import { reportService } from '../services/reportService';
import { useToast } from '../components/Toast';
import ClinicalPrescriptionForm from '../components/ui/ClinicalPrescriptionForm';
import { CLINICAL_ACTIVES, evaluateClinicalSafety } from '../utils/clinicalSafety';

const Consultant = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [clients, setClients] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all_users'); // 'all_users' | 'my_clients' | 'requests'
  const [approachingId, setApproachingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Clinical Triage & Risk Stratification Filter State
  const [triageFilter, setTriageFilter] = useState('all'); // 'all' | 'critical' | 'barrier_low' | 'sensitive' | 'referred'

  // Clinical Active Formulation & Allergy Interaction Analyzer State
  const [selectedActives, setSelectedActives] = useState(['niacinamide', 'ceramides']);

  // Attending Clinician Private Clinical Scratchpad State
  const [privateScratchpad, setPrivateScratchpad] = useState('');
  const [scratchpadSavedTime, setScratchpadSavedTime] = useState(null);

  // Printable & EHR Consultation Summary Memo Modal State
  const [showConsultationMemo, setShowConsultationMemo] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  // Referral to Dermatologist Modal State
  const [showReferModal, setShowReferModal] = useState(false);
  const [clientToRefer, setClientToRefer] = useState(null);
  const [availableDermatologists, setAvailableDermatologists] = useState([]);
  const [selectedDermaId, setSelectedDermaId] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [referralPriority, setReferralPriority] = useState('HIGH_PRIORITY');
  const [submittingReferral, setSubmittingReferral] = useState(false);

  // Approach Candidate Modal State
  const [approachModalUser, setApproachModalUser] = useState(null);
  const [approachIntroMessage, setApproachIntroMessage] = useState('');
  const [submittingApproach, setSubmittingApproach] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [clientsData, requestsData, usersData] = await Promise.all([
        consultantService.getClients(),
        connectionsService.getIncomingRequests(),
        consultantService.getAllUsers().catch((e) => {
          console.warn('Could not load user directory:', e);
          return [];
        }),
      ]);
      setClients(clientsData || []);
      setIncomingRequests(requestsData || []);
      setAllUsers(usersData || []);
    } catch (err) {
      console.error('Failed to load consultant dashboard:', err);
      toast.error('Failed to load client data from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenApproachModal = (targetUser) => {
    const defaultIntro = `Hello ${targetUser.name || 'there'}! I am a certified Skincare Consultant on AI Skin. I reviewed your skin profile and assessment scores. I would love to support you with tailored routine guidance and skin health improvements.`;
    setApproachModalUser(targetUser);
    setApproachIntroMessage(defaultIntro);
  };

  const handleConfirmApproach = async (e) => {
    e.preventDefault();
    if (!approachModalUser) return;
    try {
      setSubmittingApproach(true);
      await consultantService.approachUser(approachModalUser.user_id, approachIntroMessage.trim());
      toast.success(`Connection request sent to ${approachModalUser.name}! They will receive a notification with your message.`);
      setApproachModalUser(null);
      setApproachIntroMessage('');
      await fetchDashboardData();
      if (selectedClientDetail && selectedClientDetail.user_id === approachModalUser.user_id) {
        setSelectedClientDetail(prev => ({ ...prev, status: 'PENDING' }));
      }
    } catch (err) {
      console.error('Failed to approach user:', err);
      toast.error(err.response?.data?.detail || 'Failed to send connection request.');
    } finally {
      setSubmittingApproach(false);
    }
  };

  const handleAcceptRequest = async (connId, clientName) => {
    try {
      setProcessingId(connId);
      await connectionsService.acceptConnection(connId);
      toast.success(`Accepted connection request from ${clientName}!`);
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to accept request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (connId) => {
    if (!window.confirm('Are you sure you want to decline this request?')) return;
    try {
      setProcessingId(connId);
      await connectionsService.rejectConnection(connId);
      toast.info('Connection request declined');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to decline request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenClient = async (clientSummary) => {
    try {
      setLoadingDetail(true);
      // Fetch comprehensive clinical skin dossier (allergies, sensitivities, 5 pillars, telemetry, routine)
      const detail = await consultantService.inspectUser(clientSummary.user_id);
      setSelectedClientDetail(detail);
    } catch (err) {
      console.error('Failed to inspect client profile:', err);
      try {
        const detail = await consultantService.getClientDetail(clientSummary.user_id);
        setSelectedClientDetail(detail);
      } catch (err2) {
        setSelectedClientDetail({
          user_id: clientSummary.user_id,
          name: clientSummary.name,
          email: clientSummary.email,
          age_group: clientSummary.age_group,
          location: clientSummary.location,
          status: clientSummary.connection_status || 'NOT_CONNECTED',
          skin_profile: { skin_type: clientSummary.skin_type || 'Not specified' },
          concerns: (clientSummary.concerns || []).map(c => (typeof c === 'string' ? { name: c } : c)),
          latest_assessment: clientSummary.latest_score !== undefined && clientSummary.latest_score !== null ? {
            overall_score: clientSummary.latest_score
          } : null,
          referred_by_name: clientSummary.referred_by_name,
          referral_priority: clientSummary.referral_priority,
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenReferModal = async (clientSummary) => {
    try {
      setClientToRefer(clientSummary);
      setShowReferModal(true);
      const dermas = await professionalsService.getProfessionals({ role: 'DERMATOLOGIST' });
      setAvailableDermatologists(dermas);
      if (dermas.length > 0) setSelectedDermaId(dermas[0].id);
    } catch (err) {
      toast.error('Failed to load verified dermatologists.');
    }
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    if (!clientToRefer || !selectedDermaId || !referralNotes.trim()) return;

    try {
      setSubmittingReferral(true);
      await connectionsService.referDermatologist(
        clientToRefer.user_id,
        selectedDermaId,
        referralNotes.trim(),
        referralPriority
      );
      toast.success(`Successfully referred ${clientToRefer.name} to Dermatologist! Both are now in the Care Circle.`);
      setShowReferModal(false);
      setReferralNotes('');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Referral submission failed.');
    } finally {
      setSubmittingReferral(false);
    }
  };

  // Sync private clinical scratchpad and pre-populate actives when client detail is opened
  useEffect(() => {
    if (selectedClientDetail?.user_id) {
      const saved = localStorage.getItem(`derma_scratchpad_${selectedClientDetail.user_id}`);
      setPrivateScratchpad(saved || '');
      setScratchpadSavedTime(saved ? 'Saved in local workstation' : null);

      // Auto-detect existing routine actives if present
      const detectedActives = [];
      if (selectedClientDetail.active_routine) {
        const morningActives = selectedClientDetail.active_routine.morning?.steps?.flatMap(s => s.key_actives || []) || [];
        const eveningActives = selectedClientDetail.active_routine.evening?.steps?.flatMap(s => s.key_actives || []) || [];
        const combined = [...morningActives, ...eveningActives].map(a => (typeof a === 'string' ? a.toLowerCase() : ''));
        CLINICAL_ACTIVES.forEach(ca => {
          if (combined.some(a => a.includes(ca.id) || ca.name.toLowerCase().includes(a))) {
            detectedActives.push(ca.id);
          }
        });
      }
      setSelectedActives(detectedActives.length > 0 ? detectedActives : ['niacinamide', 'ceramides']);
    }
  }, [selectedClientDetail?.user_id]);

  const handleSaveScratchpad = () => {
    if (!selectedClientDetail?.user_id) return;
    localStorage.setItem(`derma_scratchpad_${selectedClientDetail.user_id}`, privateScratchpad);
    setScratchpadSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    toast.success('Private clinical scratchpad saved to local workstation storage.');
  };

  const handleClearScratchpad = () => {
    if (!selectedClientDetail?.user_id) return;
    localStorage.removeItem(`derma_scratchpad_${selectedClientDetail.user_id}`);
    setPrivateScratchpad('');
    setScratchpadSavedTime(null);
    toast.info('Private clinical scratchpad cleared.');
  };

  const handleToggleActive = (activeId) => {
    setSelectedActives(prev =>
      prev.includes(activeId) ? prev.filter(id => id !== activeId) : [...prev, activeId]
    );
  };

  // Generate full Clinical Memo text for export and clipboard copy
  const generateConsultationMemoText = (client) => {
    if (!client) return '';
    const safetyResult = evaluateClinicalSafety(selectedActives, client);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return `DERMAIQ CLINICAL CASE SUMMARY MEMO
==================================================
Date of Review: ${dateStr}
Attending Clinician: ${user?.profile?.name || user?.name || 'Skincare Consultant'}
Care Role: Skincare Consultant / Care Circle Specialist

PATIENT DEMOGRAPHICS & CLINICAL BIO:
- Name: ${client.name}
- Email: ${client.email}
- Age Group: ${client.age_group || 'Unspecified'}
- Location: ${client.location || 'Unspecified'}
- Skin Type: ${client.skin_profile?.skin_type || client.skin_type || 'Unspecified'}
- Fitzpatrick Phototype: ${client.fitzpatrick_type || 'Type III'}

TARGET CONCERNS & REPORTED ALLERGIES:
- Target Concerns: ${(client.concerns || []).map(c => typeof c === 'string' ? c : c.name).join(', ') || 'General maintenance'}
- Known Allergies: ${client.skin_profile?.allergies || 'None reported'}
- Known Sensitivities: ${client.skin_profile?.sensitivities || 'None reported'}

DERMAIQ 5-PILLAR DIAGNOSTIC PROFILE:
- DermaIQ Health Score: ${client.latest_assessment?.overall_score || 'N/A'}/100
- Cutaneous Condition: ${client.latest_assessment?.scores?.skin_condition_score || 'N/A'}%
- Lifestyle & Stress: ${client.latest_assessment?.scores?.lifestyle_score || 'N/A'}%
- Sleep Recovery: ${client.latest_assessment?.scores?.sleep_score || 'N/A'}%
- Routine Consistency: ${client.latest_assessment?.scores?.routine_consistency_score || 'N/A'}%
- Hydration Compliance: ${client.latest_assessment?.scores?.hydration_score || 'N/A'}%

EVALUATED ACTIVE FORMULATION & SAFETY RATING:
- Selected Active Compounds: ${selectedActives.map(id => CLINICAL_ACTIVES.find(a => a.id === id)?.name || id).join(', ')}
- Formulation Safety Classification: ${safetyResult.riskLevel}
${safetyResult.warnings.length > 0 ? `Warnings:\n${safetyResult.warnings.map(w => `  * [${w.type}] ${w.title}: ${w.message}`).join('\n')}` : '  * No active-to-active or allergy contraindications detected.'}

ATTENDING CLINICIAN'S PRIVATE SCRATCHPAD NOTES:
${privateScratchpad || 'No private clinical notes recorded for this session.'}

DISCLAIMER:
This summary is generated for inter-professional care continuity and consultation support on DermaIQ.
==================================================`;
  };

  const handleCopyMemo = () => {
    const text = generateConsultationMemoText(selectedClientDetail);
    navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    toast.success('Clinical Case Summary Memo copied to clipboard!');
    setTimeout(() => setCopiedMemo(false), 3000);
  };

  // Clinical Triage Filter Matching Helper
  const matchesTriageFilter = (u, filterKey) => {
    if (filterKey === 'all') return true;
    const concerns = (u.concerns || []).map(c => (typeof c === 'string' ? c.toLowerCase() : (c.name || '').toLowerCase()));
    const skinType = (u.skin_type || u.skin_profile?.skin_type || '').toLowerCase();
    const allergies = (u.skin_profile?.allergies || u.allergies || '').toLowerCase();
    const sensitivities = (u.skin_profile?.sensitivities || u.sensitivities || '').toLowerCase();
    const barrierScore = u.latest_assessment?.pillar_scores?.barrier_score ?? 
                         u.latest_assessment?.scores?.skin_condition_score ?? 
                         u.barrier_score;

    if (filterKey === 'critical') {
      const severeKeywords = ['acne', 'melasma', 'rosacea', 'eczema', 'psoriasis', 'hyperpigmentation', 'cystic'];
      const hasSevereConcern = concerns.some(c => severeKeywords.some(k => c.includes(k)));
      const hasLowScore = u.latest_assessment?.overall_score && u.latest_assessment.overall_score < 50;
      return hasSevereConcern || hasLowScore;
    }
    if (filterKey === 'barrier_low') {
      return barrierScore !== undefined && barrierScore !== null && Number(barrierScore) < 60;
    }
    if (filterKey === 'sensitive') {
      return skinType.includes('sensitive') || sensitivities.length > 0 || (allergies && allergies !== 'none reported' && allergies !== 'none');
    }
    if (filterKey === 'referred') {
      return Boolean(u.referred_by_name || (u.collaborating_professionals && u.collaborating_professionals.length > 0));
    }
    return true;
  };

  const getTriageCount = (list, filterKey) => list.filter(item => matchesTriageFilter(item, filterKey)).length;

  const filteredAllUsers = allUsers.filter(u => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.location && u.location.toLowerCase().includes(q)) ||
      (u.skin_type && u.skin_type.toLowerCase().includes(q)) ||
      (u.concerns && u.concerns.some(cn => (typeof cn === 'string' ? cn : cn.name || '').toLowerCase().includes(q)))
    );
    return matchesSearch && matchesTriageFilter(u, triageFilter);
  });

  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (
      c.name.toLowerCase().includes(q) ||
      (c.skin_type && c.skin_type.toLowerCase().includes(q)) ||
      (c.concerns && c.concerns.some(cn => (typeof cn === 'string' ? cn : cn.name || '').toLowerCase().includes(q)))
    );
    return matchesSearch && matchesTriageFilter(c, triageFilter);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ═══ HEADER BAR ═══ */}
      <div className="bg-gradient-to-r from-[#173a3c] to-[#245256] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-teal-200 border border-white/10">
              <Users size={14} /> Skincare Consultant Desk
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome, {user?.profile?.name || 'Consultant'}
            </h1>
            <p className="text-sm text-teal-100/80 max-w-xl font-normal leading-relaxed">
              Explore platform users, review detailed skin profiles & scores, proactively approach candidate clients, and manage your connected consultations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[100px]">
              <div className="text-2xl font-black text-cyan-200">{allUsers.length}</div>
              <div className="text-[10px] font-semibold text-teal-200 uppercase tracking-wider">All Users</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[100px]">
              <div className="text-2xl font-black text-white">{clients.length}</div>
              <div className="text-[10px] font-semibold text-teal-200 uppercase tracking-wider">Active Clients</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[100px]">
              <div className="text-2xl font-black text-amber-300">{incomingRequests.length}</div>
              <div className="text-[10px] font-semibold text-teal-200 uppercase tracking-wider">Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TABS & SEARCH NAVIGATION ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('all_users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all_users'
                ? 'bg-[#173a3c] text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Compass size={15} />
            <span>All Platform Users</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'all_users' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {allUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('my_clients')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my_clients'
                ? 'bg-[#173a3c] text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <UserCheck size={15} />
            <span>My Connected Clients</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'my_clients' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {clients.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#173a3c] text-white shadow-md'
                : incomingRequests.length > 0
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Clock size={15} />
            <span>Incoming Requests</span>
            {incomingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Global Search Box */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'all_users'
                ? "Search users by name, skin type, concern..."
                : activeTab === 'my_clients'
                ? "Search connected clients..."
                : "Search requests..."
            }
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d6e5e8] rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#173a3c] shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ═══ CLINICAL TRIAGE & RISK STRATIFICATION FILTER BAR ═══ */}
      {(activeTab === 'all_users' || activeTab === 'my_clients') && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-[#d6e5e8] shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
              <Filter size={13} className="text-[#173a3c]" />
              <span>Clinical Triage:</span>
            </div>

            {[
              { id: 'all', label: 'All Profiles', count: activeTab === 'all_users' ? allUsers.length : clients.length },
              { id: 'critical', label: '🚨 Critical / Severe Concerns', count: getTriageCount(activeTab === 'all_users' ? allUsers : clients, 'critical') },
              { id: 'barrier_low', label: '🛡️ Impaired Barrier (<60)', count: getTriageCount(activeTab === 'all_users' ? allUsers : clients, 'barrier_low') },
              { id: 'sensitive', label: '⚡ High Sensitivity / Allergies', count: getTriageCount(activeTab === 'all_users' ? allUsers : clients, 'sensitive') },
              { id: 'referred', label: '🤝 Care Circle / Referred', count: getTriageCount(activeTab === 'all_users' ? allUsers : clients, 'referred') },
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setTriageFilter(pill.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  triageFilter === pill.id
                    ? 'bg-[#173a3c] text-white shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  triageFilter === pill.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {pill.count}
                </span>
              </button>
            ))}
          </div>

          {triageFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setTriageFilter('all')}
              className="text-[11px] font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer"
            >
              Reset Triage
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#d6e5e8] space-y-3">
          <div className="h-8 w-8 border-3 border-[#173a3c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Loading consultant data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* ══════════════════════════════════════════════════════════════
              TAB 1: ALL PLATFORM USERS (PROACTIVE OUTREACH & DISCOVERY)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'all_users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-[#14393d] flex items-center gap-2">
                    <Compass size={20} className="text-[#1d6b77]" /> Platform Users Directory
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Browse all registered users on AI Skin. Review their skin type and concerns, inspect telemetry scores, or proactively connect to initiate consultations.
                  </p>
                </div>
                <span className="text-xs text-teal-800 bg-teal-50 px-3 py-1 rounded-full font-bold self-start sm:self-auto border border-teal-200">
                  Showing {filteredAllUsers.length} of {allUsers.length} users
                </span>
              </div>

              {allUsers.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#d6e5e8] space-y-3">
                  <Users size={36} className="text-gray-300 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800">No users found on the platform yet.</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    As new users register and create their skin profiles, they will automatically appear here.
                  </p>
                </div>
              ) : filteredAllUsers.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-3xl border border-[#d6e5e8] text-xs text-gray-500 space-y-2">
                  <p className="font-semibold text-gray-700">No users match "{searchTerm}".</p>
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="text-teal-700 font-bold hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAllUsers.map((u) => {
                    const isConnected = u.connection_status === 'ACCEPTED';
                    const isPending = u.connection_status === 'PENDING';
                    const isApproaching = approachingId === u.user_id;

                    return (
                      <div
                        key={u.user_id}
                        className="p-6 rounded-3xl bg-white border border-[#d6e5e8] shadow-[0_4px_20px_rgba(20,40,32,0.04)] hover:shadow-lg hover:border-[#9ecad0] transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Badges Row */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                              {u.skin_type || 'Profile Pending'}
                            </span>
                            {isConnected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 size={12} /> Connected
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Clock size={12} /> Pending Request
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                Not Connected
                              </span>
                            )}
                          </div>

                          {/* User info */}
                          <div>
                            <h3 className="text-lg font-bold text-[#14393d]">{u.name}</h3>
                            <p className="text-xs text-gray-500">{u.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {u.location ? `📍 ${u.location}` : 'Location unrecorded'} {u.age_group ? `• Age: ${u.age_group}` : ''}
                            </p>
                          </div>

                          {/* DermaIQ Score Pill */}
                          {u.latest_score !== null && u.latest_score !== undefined && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-900">
                              <Sparkles size={13} className="text-teal-600" />
                              <span>DermaIQ Score:</span>
                              <span className="font-extrabold text-teal-800">{u.latest_score}/100</span>
                            </div>
                          )}

                          {/* Skin Concerns */}
                          {u.concerns && u.concerns.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Skin Concerns:</span>
                              <div className="flex flex-wrap gap-1">
                                {u.concerns.map((cn, i) => (
                                  <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#eef7f8] text-teal-800 border border-[#d0e9ec]">
                                    {cn}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Referral info if referred */}
                          {u.referred_by_name && (
                            <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                              Referred by: {u.referred_by_name} {u.referral_priority ? `(${u.referral_priority.replace('_', ' ')})` : ''}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                          {isConnected ? (
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/messages?partner=${u.user_id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 text-xs font-bold rounded-xl transition-colors shadow-xs"
                                title="Open WhatsApp-style Chat"
                              >
                                <MessageSquare size={13} />
                                <span>Chat</span>
                              </Link>
                              <button
                                onClick={() => handleOpenReferModal(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition-colors shadow-xs"
                                title="Refer to Clinical Dermatologist"
                              >
                                <Stethoscope size={13} />
                                <span>Refer</span>
                              </button>
                            </div>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                              <Clock size={13} />
                              <span>Request Pending</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenApproachModal(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#173a3c] to-[#255b60] hover:from-[#112d2f] hover:to-[#1a4347] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                              title="Send connection request with custom message"
                            >
                              <UserPlus size={13} />
                              <span>Approach Client</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenClient(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#173a3c] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: MY CONNECTED CLIENTS (EXISTING ROSTER)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'my_clients' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#14393d] flex items-center gap-2">
                    <UserCheck size={20} className="text-[#1d6b77]" /> Authorized Client Roster
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Clients who have accepted or connected with you to guide their personalized routines.
                  </p>
                </div>
                <span className="text-xs text-teal-800 bg-teal-50 px-3 py-1 rounded-full font-bold self-start sm:self-auto border border-teal-200">
                  {filteredClients.length} Connected Clients
                </span>
              </div>

              {clients.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#d6e5e8] space-y-4">
                  <Users size={36} className="text-gray-300 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800">You don't have any connected clients yet.</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    You can switch to the <strong>All Platform Users</strong> directory tab to browse registered users and approach them proactively!
                  </p>
                  <button
                    onClick={() => setActiveTab('all_users')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#173a3c] text-white rounded-xl text-xs font-bold hover:bg-[#112d2f] transition-colors cursor-pointer"
                  >
                    <Compass size={14} /> Browse Platform Users Directory
                  </button>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#d6e5e8] text-xs text-gray-500">
                  No clients matched your search query.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClients.map((client) => (
                    <div
                      key={client.user_id}
                      className="p-6 rounded-3xl bg-white border border-[#d6e5e8] shadow-[0_4px_20px_rgba(20,40,32,0.04)] hover:shadow-lg hover:border-[#9ecad0] transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                            {client.skin_type || 'Profile Pending'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Connected {new Date(client.connected_since).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-[#14393d]">{client.name}</h3>
                          {client.location && (
                            <p className="text-xs text-gray-500 mt-0.5">{client.location}</p>
                          )}
                        </div>

                        {client.concerns && client.concerns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {client.concerns.map((cn, i) => (
                              <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#eef7f8] text-teal-800 border border-[#d0e9ec]">
                                {cn}
                              </span>
                            ))}
                          </div>
                        )}

                        {client.referred_by_name && (
                          <div className="mt-2 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                            Referred by: {client.referred_by_name} {client.referral_priority ? `(${client.referral_priority.replace('_', ' ')})` : ''}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/messages?partner=${client.user_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 text-xs font-bold rounded-xl transition-colors shadow-xs"
                            title="Open WhatsApp-style Chat"
                          >
                            <MessageSquare size={13} />
                            <span>Chat</span>
                          </Link>
                          <button
                            onClick={() => handleOpenReferModal(client)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition-colors shadow-xs"
                            title="Refer to Clinical Dermatologist"
                          >
                            <Stethoscope size={13} />
                            <span>Refer Doctor</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleOpenClient(client)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#173a3c] hover:bg-[#112d2f] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: INCOMING CONNECTION REQUESTS
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                    <Clock size={20} className="text-amber-600" /> Pending Client Connection Requests
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Platform users who have requested you as their skincare consultant.
                  </p>
                </div>
                <span className="text-xs text-amber-800 bg-amber-100 px-3 py-1 rounded-full font-bold">
                  {incomingRequests.length} pending
                </span>
              </div>

              {incomingRequests.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#d6e5e8] space-y-3">
                  <CheckCircle size={36} className="text-teal-400 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800">No pending connection requests.</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    You have answered all incoming requests! You can check the All Platform Users tab to connect with more clients.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incomingRequests.map((req) => {
                    const reqName = req.initiator_name || req.client?.name || req.professional?.name || 'Incoming User';
                    const reqRole = req.initiator_role ? req.initiator_role.replace('_', ' ') : (req.professional_type || 'Platform User');
                    const reqEmail = req.client?.email || req.professional?.email;

                    return (
                      <div key={req.id} className="p-5 bg-white rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              {reqRole}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(req.requested_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900">{reqName}</h4>
                            <p className="text-xs text-gray-500">{reqEmail}</p>
                          </div>

                          {req.referral_notes && (
                            <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-0.5">
                              <span className="text-[10px] font-bold text-amber-800 uppercase block">Message from Requester:</span>
                              <p className="italic font-medium">"{req.referral_notes}"</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => handleAcceptRequest(req.id, reqName)}
                            disabled={processingId === req.id}
                            className="flex-1 px-3 py-2 bg-[#214336] hover:bg-[#18352a] text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={processingId === req.id}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ═══ AUTHORIZED CLIENT DETAIL DRAWER / MODAL ═══ */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 border border-[#d6e5e8] max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    selectedClientDetail.status === 'ACCEPTED'
                      ? 'text-teal-700 bg-teal-50 border-teal-200'
                      : 'text-amber-800 bg-amber-50 border-amber-200'
                  }`}>
                    {selectedClientDetail.status === 'ACCEPTED' ? 'Authorized Client Overview' : 'Platform User (Candidate Client)'}
                  </span>
                  {selectedClientDetail.status === 'ACCEPTED' && (
                    <span className="text-[11px] text-gray-400">
                      Connected {selectedClientDetail.connected_since ? new Date(selectedClientDetail.connected_since).toLocaleDateString() : ''}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-black text-[#14393d] mt-2">{selectedClientDetail.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Email: {selectedClientDetail.email} • Location: {selectedClientDetail.location || 'Not recorded'} • Age: {selectedClientDetail.age_group || 'Not recorded'}
                </p>

                {/* Candidate banner if not connected */}
                {selectedClientDetail.status === 'PENDING' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-bold">
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-600" /> Connection Request Pending Approval</span>
                    <span className="text-[11px] font-normal text-amber-700">Awaiting user response</span>
                  </div>
                )}
                {selectedClientDetail.status !== 'ACCEPTED' && selectedClientDetail.status !== 'PENDING' && (
                  <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-teal-900 block">Proactive Skincare Outreach</span>
                      <p className="text-teal-700 text-[11px]">Send a personalized message to invite this user to your care circle.</p>
                    </div>
                    <button
                      onClick={() => handleOpenApproachModal(selectedClientDetail)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#173a3c] hover:bg-[#112d2f] text-white rounded-xl font-bold shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <UserPlus size={13} />
                      <span>Approach & Connect</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {selectedClientDetail.status === 'ACCEPTED' && (
                    <>
                      <Link
                        to={`/messages?partner=${selectedClientDetail.user_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 rounded-xl text-xs font-bold transition-colors shadow-xs"
                        title="Live WhatsApp Care Circle Chat"
                      >
                        <MessageSquare size={13} />
                        <span>WhatsApp Chat</span>
                      </Link>
                      <button
                        onClick={() => {
                          const cl = selectedClientDetail;
                          setSelectedClientDetail(null);
                          handleOpenReferModal(cl);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-colors shadow-xs"
                        title="Refer to Dermatologist"
                      >
                        <Stethoscope size={13} />
                        <span>+ Refer Doctor</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => reportService.downloadPdf('SKIN_ASSESSMENT', selectedClientDetail.user_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    title="Export Client PDF Clinical Dossier"
                  >
                    <FileText size={13} />
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={() => reportService.downloadExcel('SKIN_ASSESSMENT', selectedClientDetail.user_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    title="Export Client Excel Telemetry Matrix"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={() => setShowConsultationMemo(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#173a3c] border border-teal-200 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    title="Generate Printable & EHR-Ready Clinical Case Summary Memo"
                  >
                    <Printer size={13} className="text-teal-700" />
                    <span>Case Memo</span>
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setSelectedClientDetail(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Care Circle Referral Provenance (If referred) */}
            {selectedClientDetail.referred_by_name && (
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-800 block">Care Circle Referral Provenance</span>
                  <p className="mt-0.5">
                    Referred by <span className="font-bold">{selectedClientDetail.referred_by_name}</span> • Priority: <span className="font-bold">{selectedClientDetail.referral_priority || 'ROUTINE'}</span>
                  </p>
                  {selectedClientDetail.referral_notes && (
                    <p className="text-[11px] text-emerald-800 italic mt-0.5">"{selectedClientDetail.referral_notes}"</p>
                  )}
                </div>
                {selectedClientDetail.referred_by_id && (
                  <Link
                    to={`/messages?partner=${selectedClientDetail.referred_by_id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap self-start sm:self-auto"
                  >
                    <MessageSquare size={12} /> Chat with Referrer
                  </Link>
                )}
              </div>
            )}

            {/* Care Circle & Collaborating Specialists */}
            <div className="p-4 bg-[#f8fbfb] rounded-2xl border border-[#dce8ea] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope size={14} className="text-[#173a3c]" />
                  Care Circle & Collaborating Doctors
                </h4>
                <button
                  onClick={() => {
                    const cl = selectedClientDetail;
                    setSelectedClientDetail(null);
                    handleOpenReferModal(cl);
                  }}
                  className="text-[11px] font-bold text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Add Dermatologist
                </button>
              </div>

              {selectedClientDetail.collaborating_professionals?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedClientDetail.collaborating_professionals.map((collab) => (
                    <div key={collab.connection_id} className="p-3.5 bg-white rounded-xl border border-teal-100 shadow-xs flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {collab.care_role}
                          </span>
                          <span className="text-[10px] text-gray-400">Connected</span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-900 mt-1">{collab.name}</h5>
                        <p className="text-[11px] text-gray-500">{collab.email}</p>
                        {collab.location && <p className="text-[10px] text-gray-400 mt-0.5">{collab.location}</p>}
                        {collab.referral_notes && (
                          <p className="text-[10px] text-gray-500 italic mt-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                            Notes: "{collab.referral_notes}"
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/messages?partner=${collab.user_id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <MessageSquare size={12} /> WhatsApp Chat with {collab.name}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 bg-white/80 rounded-xl border border-dashed border-[#cfe0e2] text-center space-y-2">
                  <p className="text-xs text-gray-600 font-medium">No Dermatologist currently co-managing this client.</p>
                  <p className="text-[11px] text-gray-400">Notice persistent adverse skin reactions, cystic acne, or clinical questions?</p>
                  <button
                    onClick={() => {
                      const cl = selectedClientDetail;
                      setSelectedClientDetail(null);
                      handleOpenReferModal(cl);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#173a3c] hover:bg-[#112d2f] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Stethoscope size={13} /> Refer Client to a Dermatologist Now
                  </button>
                </div>
              )}
            </div>

            {/* Skin Profile Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Skin Profile & Allergies
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-[#f8fbfb] rounded-2xl border border-[#dce8ea]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Skin Type</span>
                  <p className="text-sm font-extrabold text-[#14393d] mt-0.5">
                    {selectedClientDetail.skin_profile?.skin_type || 'Not specified'}
                  </p>
                </div>
                <div className="p-4 bg-[#f8fbfb] rounded-2xl border border-[#dce8ea]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Documented Allergies</span>
                  <p className="text-xs font-bold text-rose-700 mt-0.5">
                    {selectedClientDetail.skin_profile?.allergies || 'None reported'}
                  </p>
                </div>
              </div>

              {selectedClientDetail.skin_profile?.sensitivities && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Sensitivities:</span> {selectedClientDetail.skin_profile.sensitivities}
                </div>
              )}

              {selectedClientDetail.concerns && selectedClientDetail.concerns.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Target Concerns</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClientDetail.concerns.map((c) => (
                      <span key={c.id} className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-bold rounded-xl border border-teal-200">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Telemetry Overviews */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Recent Wellness Telemetry
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#f8fbfb] rounded-xl border border-gray-100 text-center">
                  <Moon size={16} className="text-indigo-600 mx-auto mb-1" />
                  <span className="text-gray-400 text-[10px] block">Sleep Duration</span>
                  <span className="font-bold text-gray-900">
                    {selectedClientDetail.recent_sleep ? `${(selectedClientDetail.recent_sleep.duration_minutes / 60).toFixed(1)} hrs` : 'No logs'}
                  </span>
                </div>

                <div className="p-3 bg-[#f8fbfb] rounded-xl border border-gray-100 text-center">
                  <Droplet size={16} className="text-cyan-600 mx-auto mb-1" />
                  <span className="text-gray-400 text-[10px] block">Hydration</span>
                  <span className="font-bold text-gray-900">
                    {selectedClientDetail.recent_hydration ? `${selectedClientDetail.recent_hydration.water_intake_ml} mL` : 'No logs'}
                  </span>
                </div>

                <div className="p-3 bg-[#f8fbfb] rounded-xl border border-gray-100 text-center">
                  <Sun size={16} className="text-amber-600 mx-auto mb-1" />
                  <span className="text-gray-400 text-[10px] block">UV Exposure</span>
                  <span className="font-bold text-gray-900">
                    {selectedClientDetail.recent_environment?.uv_exposure || 'No logs'}
                  </span>
                </div>

                <div className="p-3 bg-[#f8fbfb] rounded-xl border border-gray-100 text-center">
                  <Sparkles size={16} className="text-emerald-600 mx-auto mb-1" />
                  <span className="text-gray-400 text-[10px] block">Stress Index</span>
                  <span className="font-bold text-gray-900">
                    {selectedClientDetail.recent_lifestyle ? `${selectedClientDetail.recent_lifestyle.stress_level} / 10` : 'No logs'}
                  </span>
                </div>
              </div>
            </div>

            {/* DermaIQ Health Score & 5-Pillar Diagnostics */}
            {selectedClientDetail.latest_assessment && (
              <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50/50 rounded-2xl border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-teal-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      DermaIQ Health Diagnosis & 5 Pillars
                    </span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 bg-teal-600 text-white rounded-lg">
                    Score: {selectedClientDetail.latest_assessment.overall_score}/100
                  </span>
                </div>

                {selectedClientDetail.latest_assessment.scores && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 bg-white/80 rounded-xl border border-teal-100">
                      <span className="text-[10px] text-gray-500 block">Condition (35%)</span>
                      <span className="font-bold text-gray-800">{selectedClientDetail.latest_assessment.scores.skin_condition_score}%</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-xl border border-teal-100">
                      <span className="text-[10px] text-gray-500 block">Lifestyle (20%)</span>
                      <span className="font-bold text-gray-800">{selectedClientDetail.latest_assessment.scores.lifestyle_score}%</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-xl border border-teal-100">
                      <span className="text-[10px] text-gray-500 block">Sleep (15%)</span>
                      <span className="font-bold text-gray-800">{selectedClientDetail.latest_assessment.scores.sleep_score}%</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-xl border border-teal-100">
                      <span className="text-[10px] text-gray-500 block">Consistency (20%)</span>
                      <span className="font-bold text-gray-800">{selectedClientDetail.latest_assessment.scores.routine_consistency_score}%</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-xl border border-teal-100">
                      <span className="text-[10px] text-gray-500 block">Hydration (10%)</span>
                      <span className="font-bold text-gray-800">{selectedClientDetail.latest_assessment.scores.hydration_score}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Patient Active Skincare Routine (AM / PM / Weekly / Seasonal) */}
            {selectedClientDetail.active_routine && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart size={13} className="text-teal-600" />
                    Client Active Routine (v{selectedClientDetail.active_routine.version})
                  </h4>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Adherence: {selectedClientDetail.active_routine.adherence_score}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Morning */}
                  {selectedClientDetail.active_routine.morning?.steps?.length > 0 && (
                    <div className="p-3 bg-[#f8fbfb] rounded-xl border border-gray-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block">☀️ Morning Steps</span>
                      <ul className="space-y-1">
                        {selectedClientDetail.active_routine.morning.steps.map((st, i) => (
                          <li key={i} className="text-[11px] text-gray-700">
                            <span className="font-semibold">{i + 1}. {st.title}</span>
                            {st.key_actives?.length > 0 && (
                              <span className="text-gray-400 block text-[10px]">Actives: {st.key_actives.join(', ')}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Evening */}
                  {selectedClientDetail.active_routine.evening?.steps?.length > 0 && (
                    <div className="p-3 bg-[#f8fbfb] rounded-xl border border-gray-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase block">🌙 Evening Steps</span>
                      <ul className="space-y-1">
                        {selectedClientDetail.active_routine.evening.steps.map((st, i) => (
                          <li key={i} className="text-[11px] text-gray-700">
                            <span className="font-semibold">{i + 1}. {st.title}</span>
                            {st.key_actives?.length > 0 && (
                              <span className="text-gray-400 block text-[10px]">Actives: {st.key_actives.join(', ')}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Seasonal */}
                  {selectedClientDetail.active_routine.seasonal?.steps?.length > 0 && (
                    <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/70 space-y-1.5 sm:col-span-2">
                      <span className="text-[10px] font-bold text-teal-800 uppercase block">🍂 Seasonal Adaptation Steps</span>
                      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {selectedClientDetail.active_routine.seasonal.steps.map((st, i) => (
                          <li key={i} className="text-[11px] text-gray-800 bg-white/80 p-2 rounded-lg border border-teal-100">
                            <span className="font-bold">{st.title}</span>
                            {st.key_actives?.length > 0 && (
                              <span className="text-teal-700 block text-[10px] mt-0.5">{st.key_actives.join(' · ')}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Past Clinical Directives & Client Inquiries History */}
            {selectedClientDetail.past_recommendations?.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={13} className="text-teal-600" />
                  Communication & Consultation Thread ({selectedClientDetail.past_recommendations.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedClientDetail.past_recommendations.map((pr, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs ${
                        pr.title?.startsWith('[Patient Inquiry]')
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-teal-50/50 border-teal-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{pr.title}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {pr.created_at ? new Date(pr.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 italic">"{pr.clinical_notes}"</p>
                      {pr.prescribed_actives?.length > 0 && (
                        <p className="text-[10px] text-teal-700 font-semibold mt-1">
                          Prescribed: {pr.prescribed_actives.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ ATTENDING PROFESSIONAL PRIVATE CLINICAL SCRATCHPAD ═══ */}
            <div className="p-4 bg-[#f8fbfb] rounded-2xl border border-[#dce8ea] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 size={15} className="text-[#173a3c]" />
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Private Clinical Scratchpad & Differential Notes
                  </h4>
                </div>
                {scratchpadSavedTime && (
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Saved: {scratchpadSavedTime}
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={privateScratchpad}
                onChange={(e) => setPrivateScratchpad(e.target.value)}
                placeholder="Enter private practitioner differential notes, patch-test reminders, follow-up flags (persisted in local workstation storage)..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 text-gray-800 shadow-2xs font-normal"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-gray-400">
                  Private to your consultant workstation. Not transmitted or visible to the client.
                </span>
                <div className="flex items-center gap-2">
                  {privateScratchpad && (
                    <button
                      type="button"
                      onClick={handleClearScratchpad}
                      className="text-[11px] text-gray-400 hover:text-gray-600 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveScratchpad}
                    className="px-3.5 py-1.5 bg-[#173a3c] hover:bg-[#112d2f] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ CLINICAL ACTIVE FORMULATION & ALLERGY SAFETY ANALYZER ═══ */}
            {(() => {
              const activeSafetyResult = evaluateClinicalSafety(selectedActives, selectedClientDetail);
              return (
                <div className="p-4 bg-white rounded-2xl border border-teal-200/90 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-teal-50 text-teal-800 rounded-lg border border-teal-200">
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Active Formulation & Allergy Interaction Analyzer
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Verify ingredient compatibility against client allergies, Fitzpatrick phototype, and barrier status
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      activeSafetyResult.riskLevel === 'SAFE' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : activeSafetyResult.riskLevel === 'CAUTION'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {activeSafetyResult.riskLevel}
                    </span>
                  </div>

                  {/* Selectable Actives Pills */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">
                      Select Active Compounds ({selectedActives.length} active)
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-gray-50/70 rounded-xl border border-gray-100">
                      {CLINICAL_ACTIVES.map((active) => {
                        const isSelected = selectedActives.includes(active.id);
                        return (
                          <button
                            key={active.id}
                            type="button"
                            onClick={() => handleToggleActive(active.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#173a3c] text-white border-[#173a3c] shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {active.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Safety Feedback Card */}
                  {activeSafetyResult.warnings.length > 0 && (
                    <div className="space-y-2">
                      {activeSafetyResult.warnings.map((w, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            w.severity === 'danger'
                              ? 'bg-rose-50 border-rose-200 text-rose-900'
                              : w.severity === 'warning'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-blue-50 border-blue-200 text-blue-900'
                          }`}
                        >
                          <AlertCircle size={15} className={`mt-0.5 shrink-0 ${
                            w.severity === 'danger' ? 'text-rose-600' : w.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                          }`} />
                          <div className="space-y-0.5">
                            <span className="font-bold block">{w.title}</span>
                            <p className="text-[11px] leading-relaxed">{w.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeSafetyResult.recommendations.length > 0 && (
                    <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 text-xs text-teal-950 space-y-1">
                      <span className="font-bold text-[11px] text-teal-800 uppercase tracking-wide block">
                        Clinical Protocol Guidance:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-teal-900">
                        {activeSafetyResult.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Clinical Regimen & Consultation Advisory Section */}
            <ClinicalPrescriptionForm
              patientId={selectedClientDetail.user_id}
              patientName={selectedClientDetail.name || selectedClientDetail.profile?.name}
              onPrescriptionCreated={async () => {
                const refreshed = await consultantService.getClientDetail(selectedClientDetail.user_id);
                setSelectedClientDetail(refreshed);
              }}
            />

            {/* Footer Close */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedClientDetail(null)}
                className="px-5 py-2.5 bg-[#173a3c] hover:bg-[#112d2f] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Close Inspection
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══ REFER TO CLINICAL DERMATOLOGIST MODAL ═══ */}
      {showReferModal && clientToRefer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-teal-200 space-y-5 animate-in fade-in">
            {/* Modal header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#14393d]">Refer to Clinical Dermatologist</h3>
                  <p className="text-xs text-gray-500">
                    Connect client <span className="font-bold text-gray-800">{clientToRefer.name}</span> with a doctor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReferModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReferral} className="space-y-4">
              {/* Select Dermatologist */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Select Board-Certified Dermatologist
                </label>
                {availableDermatologists.length === 0 ? (
                  <p className="text-xs text-gray-400 p-2.5 bg-gray-50 rounded-xl">Loading verified specialists...</p>
                ) : (
                  <select
                    value={selectedDermaId}
                    onChange={(e) => setSelectedDermaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 text-gray-800"
                    required
                  >
                    {availableDermatologists.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.name} {d.qualification ? `(${d.qualification})` : ''} {d.location ? `• ${d.location}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Priority Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Clinical Priority Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'ROUTINE', label: 'Routine' },
                    { val: 'MEDIUM_PRIORITY', label: 'Medium' },
                    { val: 'HIGH_PRIORITY', label: 'High' },
                    { val: 'URGENT_CLINICAL_REVIEW', label: 'Urgent' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setReferralPriority(opt.val)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        referralPriority === opt.val
                          ? 'bg-[#173a3c] text-white border-[#173a3c] shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Referral Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Clinical Rationale & Referral Notes
                </label>
                <textarea
                  rows={4}
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="Describe observed concerns, recurring sensitivities, failed OTC routines, or reasons why medical dermatological evaluation is requested..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 text-gray-800"
                  required
                />
                <p className="text-[10px] text-gray-400">
                  These notes will be delivered directly to the dermatologist and recorded in the patient's Care Circle dossier.
                </p>
              </div>

              {/* Submit & Cancel */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowReferModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReferral || !referralNotes.trim() || !selectedDermaId}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#173a3c] hover:bg-[#112d2f] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingReferral ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Connecting Care Circle...</span>
                    </>
                  ) : (
                    <>
                      <Stethoscope size={13} />
                      <span>Submit & Connect Doctor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ APPROACH CANDIDATE MODAL ═══ */}
      {approachModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-teal-50 text-teal-800 rounded-2xl border border-teal-200">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Send Connection Request</h3>
                  <p className="text-xs text-gray-500">Proactively reach out to {approachModalUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setApproachModalUser(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Recipient summary pill */}
            <div className="p-4 bg-[#f8fbfb] rounded-2xl border border-[#d6e5e8] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900">{approachModalUser.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200">
                  {approachModalUser.skin_type || 'Skin Profile'}
                </span>
              </div>
              <p className="text-xs text-gray-500">{approachModalUser.email}</p>
              {approachModalUser.concerns?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {approachModalUser.concerns.map((cn, i) => (
                    <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-700">
                      {typeof cn === 'string' ? cn : cn.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmApproach} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Introductory Message & Advice Note
                </label>
                <textarea
                  rows={4}
                  value={approachIntroMessage}
                  onChange={(e) => setApproachIntroMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you're connecting..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#173a3c] text-gray-800"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  The user will receive an instant notification with your role and message, allowing them to review and accept the connection.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setApproachModalUser(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApproach || !approachIntroMessage.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#173a3c] hover:bg-[#112d2f] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingApproach ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ PRINTABLE / EHR CLINICAL CONSULTATION SUMMARY MEMO MODAL ═══ */}
      {showConsultationMemo && selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-teal-200 max-h-[92vh] overflow-y-auto space-y-6">
            
            {/* Top Bar with Print, Copy, and Close */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200">
                  <Printer size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#173a3c]">Clinical Consultation Memo</h3>
                  <p className="text-[11px] text-gray-500">Standardized case summary formatted for Electronic Health Records & print</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMemo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 transition-colors cursor-pointer"
                  title="Copy formatted text for EHR systems"
                >
                  {copiedMemo ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedMemo ? 'Copied!' : 'Copy EHR Memo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#173a3c] hover:bg-[#112d2f] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Print memo"
                >
                  <Printer size={13} />
                  <span>Print Memo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConsultationMemo(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Memo Content */}
            <div id="printable-memo" className="p-6 bg-white border border-gray-200 rounded-2xl space-y-5 text-gray-800 font-sans text-xs">
              
              {/* Institution Header */}
              <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 block">DermaIQ Clinical Network</span>
                  <h4 className="text-lg font-black text-gray-900 mt-0.5">Clinical Case Summary Memo</h4>
                  <p className="text-[11px] text-gray-500">
                    Attending: {user?.profile?.name || user?.name || 'Skincare Consultant'} • Role: Skincare Consultant
                  </p>
                </div>
                <div className="text-right text-[11px] text-gray-500">
                  <span className="block font-bold text-gray-800">Date of Review</span>
                  <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Patient Bio */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Patient Name</span>
                  <span className="font-bold text-gray-900">{selectedClientDetail.name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Email / Contact</span>
                  <span className="font-medium text-gray-700">{selectedClientDetail.email}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Location</span>
                  <span className="font-medium text-gray-700">{selectedClientDetail.location || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Skin Type</span>
                  <span className="font-medium text-gray-700">{selectedClientDetail.skin_profile?.skin_type || selectedClientDetail.skin_type || 'Unspecified'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Known Allergies</span>
                  <span className="font-semibold text-rose-700">{selectedClientDetail.skin_profile?.allergies || 'None reported'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Cutaneous Sensitivities</span>
                  <span className="font-medium text-gray-700">{selectedClientDetail.skin_profile?.sensitivities || 'None reported'}</span>
                </div>
              </div>

              {/* Diagnostic 5-Pillar Score Matrix */}
              {selectedClientDetail.latest_assessment && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">DermaIQ Diagnostic 5 Pillars</span>
                    <span className="text-xs font-black text-teal-800">Overall Score: {selectedClientDetail.latest_assessment.overall_score}/100</span>
                  </div>
                  {selectedClientDetail.latest_assessment.scores && (
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[11px]">
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Condition</span>
                        <span className="font-bold">{selectedClientDetail.latest_assessment.scores.skin_condition_score}%</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Lifestyle</span>
                        <span className="font-bold">{selectedClientDetail.latest_assessment.scores.lifestyle_score}%</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Sleep</span>
                        <span className="font-bold">{selectedClientDetail.latest_assessment.scores.sleep_score}%</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Consistency</span>
                        <span className="font-bold">{selectedClientDetail.latest_assessment.scores.routine_consistency_score}%</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Hydration</span>
                        <span className="font-bold">{selectedClientDetail.latest_assessment.scores.hydration_score}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Evaluated Active Safety Review */}
              {(() => {
                const sRes = evaluateClinicalSafety(selectedActives, selectedClientDetail);
                return (
                  <div className="space-y-1.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Evaluated Active Formulation & Safety</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        sRes.riskLevel === 'SAFE' ? 'bg-emerald-100 text-emerald-800' : sRes.riskLevel === 'CAUTION' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        Rating: {sRes.riskLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700">
                      <span className="font-bold">Actives Evaluated: </span>
                      {selectedActives.map(id => CLINICAL_ACTIVES.find(a => a.id === id)?.name || id).join(', ')}
                    </p>
                    {sRes.warnings.length > 0 && (
                      <ul className="list-disc list-inside text-[11px] text-rose-800 space-y-0.5 pt-1">
                        {sRes.warnings.map((w, i) => (
                          <li key={i}><span className="font-bold">[{w.type}]</span> {w.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}

              {/* Private Attending Notes */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Attending Practitioner Clinical Notes</span>
                <p className="text-[11px] p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-gray-700 whitespace-pre-wrap">
                  {privateScratchpad || 'No differential clinical notes recorded for this case.'}
                </p>
              </div>

              {/* Disclaimer */}
              <div className="pt-3 border-t border-gray-200 text-[10px] text-gray-400 flex items-center justify-between">
                <span>DermaIQ AI-Assisted Clinical Support • Confidential Medical Memo</span>
                <span>Page 1 of 1</span>
              </div>

            </div>

            {/* Modal Bottom Close */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConsultationMemo(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Memo
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Consultant;
