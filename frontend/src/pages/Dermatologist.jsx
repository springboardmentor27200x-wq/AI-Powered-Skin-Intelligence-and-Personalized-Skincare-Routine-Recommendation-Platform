import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, Users, AlertTriangle, ShieldCheck, Heart, 
  Search, Clock, ChevronRight, Droplet, Moon, Sun, X, 
  CheckCircle2, AlertCircle, Sparkles, RefreshCw, FileText, FileSpreadsheet,
  MessageSquare, UserPlus, UserCheck, Compass, CheckCircle, Plus, Send,
  Filter, Printer, Copy, CheckCheck, Edit3, ShieldAlert,
  Flame, TrendingUp, TrendingDown, Award, BarChart2, Pill
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dermatologistService } from '../services/dermatologist';
import { connectionsService } from '../services/connections';
import { reportService } from '../services/reportService';
import { useToast } from '../components/Toast';
import ClinicalPrescriptionForm from '../components/ui/ClinicalPrescriptionForm';
import { CLINICAL_ACTIVES, evaluateClinicalSafety } from '../utils/clinicalSafety';

const Dermatologist = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allConsultants, setAllConsultants] = useState([]);
  const [activeTab, setActiveTab] = useState('all_users'); // 'all_users' | 'all_consultants' | 'my_patients' | 'treatment_recommendations' | 'progress_analytics' | 'requests'
  const [approachingId, setApproachingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Treatment Recommendations State
  const [treatmentsList, setTreatmentsList] = useState([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [showNewTreatmentModal, setShowNewTreatmentModal] = useState(false);
  const [selectedPatientForTreatment, setSelectedPatientForTreatment] = useState(null);
  const [expandedTreatmentId, setExpandedTreatmentId] = useState(null);

  // Progress Analytics State
  const [cohortAnalytics, setCohortAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsFilter, setAnalyticsFilter] = useState('all'); // 'all' | 'critical' | 'moderate' | 'optimal' | 'improving'

  // Clinical Triage & Risk Stratification Filter State
  const [triageFilter, setTriageFilter] = useState('all'); // 'all' | 'critical' | 'barrier_low' | 'sensitive' | 'referred'

  // Clinical Active Formulation & Allergy Interaction Analyzer State
  const [selectedActives, setSelectedActives] = useState(['retinol', 'niacinamide', 'ceramides']);

  // Attending Clinician Private Clinical Scratchpad State
  const [privateScratchpad, setPrivateScratchpad] = useState('');
  const [scratchpadSavedTime, setScratchpadSavedTime] = useState(null);

  // Printable & EHR Consultation Summary Memo Modal State
  const [showConsultationMemo, setShowConsultationMemo] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  // Approach Modals State
  const [approachPatientUser, setApproachPatientUser] = useState(null);
  const [approachPatientMessage, setApproachPatientMessage] = useState('');
  const [approachConsultantTarget, setApproachConsultantTarget] = useState(null);
  const [approachConsultantMessage, setApproachConsultantMessage] = useState('');
  const [submittingApproach, setSubmittingApproach] = useState(false);

  const fetchTreatmentsData = async () => {
    try {
      setLoadingTreatments(true);
      const data = await dermatologistService.getTreatments();
      setTreatmentsList(data || []);
    } catch (err) {
      console.warn('Could not load treatments:', err);
    } finally {
      setLoadingTreatments(false);
    }
  };

  const fetchCohortAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await dermatologistService.getCohortAnalytics();
      setCohortAnalytics(data || null);
    } catch (err) {
      console.warn('Could not load cohort analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [patientsData, requestsData, usersData, consultantsData, treatsData, analyticsData] = await Promise.all([
        dermatologistService.getPatients(),
        connectionsService.getIncomingRequests(),
        dermatologistService.getAllUsers().catch((e) => {
          console.warn('Could not load user directory for dermatologist:', e);
          return [];
        }),
        dermatologistService.getAllConsultants().catch((e) => {
          console.warn('Could not load consultant directory for dermatologist:', e);
          return [];
        }),
        dermatologistService.getTreatments().catch(() => []),
        dermatologistService.getCohortAnalytics().catch(() => null),
      ]);
      setPatients(patientsData || []);
      setIncomingRequests(requestsData || []);
      setAllUsers(usersData || []);
      setAllConsultants(consultantsData || []);
      setTreatmentsList(treatsData || []);
      setCohortAnalytics(analyticsData || null);
    } catch (err) {
      console.error('Failed to load dermatologist dashboard:', err);
      toast.error('Failed to load patient data from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenApproachPatientModal = (targetUser) => {
    const drName = user?.name ? `Dr. ${user.name}` : 'Clinical Dermatologist';
    const defaultIntro = `Hello ${targetUser.name || 'there'}! I am ${drName}, clinical dermatologist. I reviewed your skin assessment scores and clinical profile. I am here to provide medical oversight, analyze any severe concerns, and support your skin health journey.`;
    setApproachPatientUser(targetUser);
    setApproachPatientMessage(defaultIntro);
  };

  const handleConfirmApproachPatient = async (e) => {
    e.preventDefault();
    if (!approachPatientUser) return;
    try {
      setSubmittingApproach(true);
      await dermatologistService.approachUser(approachPatientUser.user_id, approachPatientMessage.trim());
      toast.success(`Connection request sent to patient ${approachPatientUser.name}! They will receive a notification with your message.`);
      setApproachPatientUser(null);
      setApproachPatientMessage('');
      await fetchDashboardData();
      if (selectedPatientDetail && selectedPatientDetail.user_id === approachPatientUser.user_id) {
        setSelectedPatientDetail(prev => ({ ...prev, status: 'PENDING' }));
      }
    } catch (err) {
      console.error('Failed to approach patient:', err);
      toast.error(err.response?.data?.detail || 'Failed to send connection request.');
    } finally {
      setSubmittingApproach(false);
    }
  };

  const handleOpenApproachConsultantModal = (targetConsultant) => {
    const drName = user?.name ? `Dr. ${user.name}` : 'Clinical Dermatologist';
    const defaultIntro = `Hello ${targetConsultant.name || 'Colleague'}! I am ${drName}, clinical dermatologist. I am reaching out to establish a direct collaborative referral channel with you. Whenever you have clients needing clinical diagnosis, active prescriptions, or severe concern review, please feel free to refer them to me or consult me directly!`;
    setApproachConsultantTarget(targetConsultant);
    setApproachConsultantMessage(defaultIntro);
  };

  const handleConfirmApproachConsultant = async (e) => {
    e.preventDefault();
    if (!approachConsultantTarget) return;
    try {
      setSubmittingApproach(true);
      await dermatologistService.approachConsultant(approachConsultantTarget.user_id, approachConsultantMessage.trim());
      toast.success(`Collaboration request sent to ${approachConsultantTarget.name}! They will receive a notification with your message.`);
      setApproachConsultantTarget(null);
      setApproachConsultantMessage('');
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to approach consultant:', err);
      toast.error(err.response?.data?.detail || 'Failed to send collaboration request.');
    } finally {
      setSubmittingApproach(false);
    }
  };

  const handleAcceptRequest = async (connId, patientName) => {
    try {
      setProcessingId(connId);
      await connectionsService.acceptConnection(connId);
      toast.success(`Accepted connection request from ${patientName}!`);
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

  const handleOpenPatient = async (patientSummary) => {
    try {
      setLoadingDetail(true);
      // Fetch comprehensive clinical patient dossier (allergies, sensitivities, 5 pillars, telemetry, routine)
      const detail = await dermatologistService.inspectUser(patientSummary.user_id);
      setSelectedPatientDetail(detail);
    } catch (err) {
      console.error('Failed to inspect patient profile:', err);
      try {
        const detail = await dermatologistService.getPatientDetail(patientSummary.user_id);
        setSelectedPatientDetail(detail);
      } catch (err2) {
        setSelectedPatientDetail({
          user_id: patientSummary.user_id,
          name: patientSummary.name,
          email: patientSummary.email,
          age_group: patientSummary.age_group,
          location: patientSummary.location,
          status: patientSummary.connection_status || 'NOT_CONNECTED',
          skin_profile: { skin_type: patientSummary.skin_type || 'Not specified' },
          concerns: (patientSummary.concerns || []).map(c => (typeof c === 'string' ? { name: c } : c)),
          latest_assessment: patientSummary.latest_score !== undefined && patientSummary.latest_score !== null ? {
            overall_score: patientSummary.latest_score
          } : null,
          referred_by_name: patientSummary.referred_by_name,
          referral_priority: patientSummary.referral_priority,
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  // Sync private clinical scratchpad and pre-populate actives when patient detail is opened
  useEffect(() => {
    if (selectedPatientDetail?.user_id) {
      const saved = localStorage.getItem(`derma_scratchpad_${selectedPatientDetail.user_id}`);
      setPrivateScratchpad(saved || '');
      setScratchpadSavedTime(saved ? 'Saved in local workstation' : null);

      // Auto-detect existing routine actives if present
      const detectedActives = [];
      if (selectedPatientDetail.active_routine) {
        const morningActives = selectedPatientDetail.active_routine.morning?.steps?.flatMap(s => s.key_actives || []) || [];
        const eveningActives = selectedPatientDetail.active_routine.evening?.steps?.flatMap(s => s.key_actives || []) || [];
        const combined = [...morningActives, ...eveningActives].map(a => (typeof a === 'string' ? a.toLowerCase() : ''));
        CLINICAL_ACTIVES.forEach(ca => {
          if (combined.some(a => a.includes(ca.id) || ca.name.toLowerCase().includes(a))) {
            detectedActives.push(ca.id);
          }
        });
      }
      setSelectedActives(detectedActives.length > 0 ? detectedActives : ['retinol', 'niacinamide', 'ceramides']);
    }
  }, [selectedPatientDetail?.user_id]);

  const handleSaveScratchpad = () => {
    if (!selectedPatientDetail?.user_id) return;
    localStorage.setItem(`derma_scratchpad_${selectedPatientDetail.user_id}`, privateScratchpad);
    setScratchpadSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    toast.success('Private dermatological scratchpad saved to local workstation storage.');
  };

  const handleClearScratchpad = () => {
    if (!selectedPatientDetail?.user_id) return;
    localStorage.removeItem(`derma_scratchpad_${selectedPatientDetail.user_id}`);
    setPrivateScratchpad('');
    setScratchpadSavedTime(null);
    toast.info('Private clinical scratchpad cleared.');
  };

  const handleToggleActive = (activeId) => {
    setSelectedActives(prev =>
      prev.includes(activeId) ? prev.filter(id => id !== activeId) : [...prev, activeId]
    );
  };

  // Generate full Clinical Case Summary Memo for export and clipboard copy
  const generateConsultationMemoText = (pt) => {
    if (!pt) return '';
    const safetyResult = evaluateClinicalSafety(selectedActives, pt);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const drTitle = user?.name ? `Dr. ${user.name}` : 'Clinical Dermatologist';
    return `DERMAIQ CLINICAL DERMATOLOGY CASE SUMMARY MEMO
==================================================
Date of Review: ${dateStr}
Attending Dermatologist: ${drTitle}
Care Role: Board-Certified Dermatologist / Lead Medical Specialist

PATIENT DEMOGRAPHICS & CLINICAL BIO:
- Name: ${pt.name}
- Email: ${pt.email}
- Age Group: ${pt.age_group || 'Unspecified'}
- Location: ${pt.location || 'Unspecified'}
- Skin Physiology: ${pt.skin_profile?.skin_type || pt.skin_type || 'Unspecified'}
- Fitzpatrick Phototype: ${pt.fitzpatrick_type || 'Type III'}

DIAGNOSED CONCERNS & REPORTED ALLERGIES:
- Target Concerns: ${(pt.concerns || []).map(c => typeof c === 'string' ? c : c.name).join(', ') || 'General maintenance'}
- Known Allergies: ${pt.skin_profile?.allergies || 'None reported'}
- Known Sensitivities: ${pt.skin_profile?.sensitivities || 'None reported'}

DERMAIQ 5-PILLAR DIAGNOSTIC PROFILE:
- DermaIQ Health Score: ${pt.latest_assessment?.overall_score || 'N/A'}/100
- Cutaneous Condition: ${pt.latest_assessment?.scores?.skin_condition_score || 'N/A'}%
- Lifestyle & Stress: ${pt.latest_assessment?.scores?.lifestyle_score || 'N/A'}%
- Sleep Recovery: ${pt.latest_assessment?.scores?.sleep_score || 'N/A'}%
- Routine Consistency: ${pt.latest_assessment?.scores?.routine_consistency_score || 'N/A'}%
- Hydration Compliance: ${pt.latest_assessment?.scores?.hydration_score || 'N/A'}%

EVALUATED ACTIVE FORMULATION & SAFETY RATING:
- Prescribed / Evaluated Actives: ${selectedActives.map(id => CLINICAL_ACTIVES.find(a => a.id === id)?.name || id).join(', ')}
- Safety Classification: ${safetyResult.riskLevel}
${safetyResult.warnings.length > 0 ? `Warnings:\n${safetyResult.warnings.map(w => `  * [${w.type}] ${w.title}: ${w.message}`).join('\n')}` : '  * No active-to-active or allergy contraindications detected.'}

ATTENDING DERMATOLOGIST'S PRIVATE CLINICAL SCRATCHPAD:
${privateScratchpad || 'No private clinical differential notes recorded for this session.'}

DISCLAIMER:
This medical consultation memo is generated for clinical continuity and record keeping on DermaIQ.
==================================================`;
  };

  const handleCopyMemo = () => {
    const text = generateConsultationMemoText(selectedPatientDetail);
    navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    toast.success('Clinical Dermatology Memo copied to clipboard!');
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

  const filteredConsultants = allConsultants.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  const filteredPatients = patients.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (
      p.name.toLowerCase().includes(q) ||
      (p.skin_type && p.skin_type.toLowerCase().includes(q)) ||
      (p.concerns && p.concerns.some(cn => (typeof cn === 'string' ? cn : cn.name || '').toLowerCase().includes(q)))
    );
    return matchesSearch && matchesTriageFilter(p, triageFilter);
  });

  // Extract unique referring consultants co-managing care cases
  const referringConsultants = Array.from(
    new Map(
      patients
        .filter(p => p.referred_by_id && p.referred_by_name)
        .map(p => [p.referred_by_id, { id: p.referred_by_id, name: p.referred_by_name, patient_name: p.name }])
    ).values()
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ═══ HEADER BAR ═══ */}
      <div className="bg-gradient-to-r from-[#183a2d] to-[#255241] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200 border border-white/10">
              <Stethoscope size={14} /> Clinical Dermatologist Workspace
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Dr. {user?.profile?.name || 'Dermatologist'} — Patient & Colleague Board
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-xl font-normal leading-relaxed">
              Discover candidate patients, collaborate with skincare consultants, review longitudinal skin telemetry, and manage clinical care circles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[85px]">
              <div className="text-2xl font-black text-cyan-200">{allUsers.length}</div>
              <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">All Users</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[85px]">
              <div className="text-2xl font-black text-teal-200">{allConsultants.length}</div>
              <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">Consultants</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[85px]">
              <div className="text-2xl font-black text-white">{patients.length}</div>
              <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">Patients</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[85px]">
              <div className="text-2xl font-black text-emerald-300">{treatmentsList.length}</div>
              <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">Treatments</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[85px]">
              <div className="text-2xl font-black text-amber-300">{incomingRequests.length}</div>
              <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TABS & SEARCH NAVIGATION BAR ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('all_users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all_users'
                ? 'bg-[#183a2d] text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Compass size={15} />
            <span>All Users & Patients</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'all_users' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {allUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all_consultants')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all_consultants'
                ? 'bg-[#183a2d] text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Users size={15} />
            <span>Skincare Consultants</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'all_consultants' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {allConsultants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('my_patients')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my_patients'
                ? 'bg-[#183a2d] text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Stethoscope size={15} />
            <span>My Patient Cases</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'my_patients' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {patients.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('treatment_recommendations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'treatment_recommendations'
                ? 'bg-[#183a2d] text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Pill size={15} />
            <span>Treatment Recommendations</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'treatment_recommendations' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {treatmentsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('progress_analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'progress_analytics'
                ? 'bg-[#183a2d] text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <BarChart2 size={15} />
            <span>Progress Analytics</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'progress_analytics' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {patients.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#183a2d] text-white shadow-md'
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
                : activeTab === 'all_consultants'
                ? "Search consultants by name, location..."
                : activeTab === 'my_patients'
                ? "Search patient cases..."
                : activeTab === 'treatment_recommendations'
                ? "Search prescriptions by patient or active..."
                : activeTab === 'progress_analytics'
                ? "Search analytics by patient name or triage..."
                : "Search requests..."
            }
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dce8e1] rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#183a2d] shadow-xs"
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
      {(activeTab === 'all_users' || activeTab === 'my_patients') && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
              <Filter size={13} className="text-[#183a2d]" />
              <span>Clinical Triage:</span>
            </div>

            {[
              { id: 'all', label: 'All Profiles', count: activeTab === 'all_users' ? allUsers.length : patients.length },
              { id: 'critical', label: '🚨 Critical / Severe Concerns', count: getTriageCount(activeTab === 'all_users' ? allUsers : patients, 'critical') },
              { id: 'barrier_low', label: '🛡️ Impaired Barrier (<60)', count: getTriageCount(activeTab === 'all_users' ? allUsers : patients, 'barrier_low') },
              { id: 'sensitive', label: '⚡ High Sensitivity / Allergies', count: getTriageCount(activeTab === 'all_users' ? allUsers : patients, 'sensitive') },
              { id: 'referred', label: '🤝 Care Circle / Referred', count: getTriageCount(activeTab === 'all_users' ? allUsers : patients, 'referred') },
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setTriageFilter(pill.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  triageFilter === pill.id
                    ? 'bg-[#183a2d] text-white shadow-xs'
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
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            >
              Reset Triage
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-3">
          <div className="h-8 w-8 border-3 border-[#183a2d] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Loading dermatologist dashboard...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* ══════════════════════════════════════════════════════════════
              TAB 1: ALL PLATFORM USERS (PATIENT DISCOVERY & OUTREACH)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'all_users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-[#142e23] flex items-center gap-2">
                    <Compass size={20} className="text-[#2b6d54]" /> All Platform Users & Candidate Patients
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Browse all registered users on AI Skin. Review their clinical skin telemetry, concerns, and DermaIQ scores, or proactively approach them to offer medical oversight.
                  </p>
                </div>
                <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full font-bold self-start sm:self-auto border border-emerald-200">
                  Showing {filteredAllUsers.length} of {allUsers.length} users
                </span>
              </div>

              {allUsers.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-3">
                  <Users size={36} className="text-gray-300 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800">No users found on the platform yet.</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    When platform users register and record their skin profile, they will appear in this directory.
                  </p>
                </div>
              ) : filteredAllUsers.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-3xl border border-[#dce8e1] text-xs text-gray-500 space-y-2">
                  <p className="font-semibold text-gray-700">No users match "{searchTerm}".</p>
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="text-emerald-700 font-bold hover:underline"
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
                        className="p-6 rounded-3xl bg-white border border-[#dce8e1] shadow-[0_4px_20px_rgba(20,40,32,0.04)] hover:shadow-lg hover:border-[#a8cebe] transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Badges Row */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                              {u.skin_type || 'Profile Pending'}
                            </span>
                            {isConnected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 size={12} /> Connected Patient
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Clock size={12} /> Request Pending
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                Not Connected
                              </span>
                            )}
                          </div>

                          {/* Patient Info */}
                          <div>
                            <h3 className="text-lg font-bold text-[#142e23]">{u.name}</h3>
                            <p className="text-xs text-gray-500">{u.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {u.location ? `📍 ${u.location}` : 'Location unrecorded'} {u.age_group ? `• Age: ${u.age_group}` : ''}
                            </p>
                          </div>

                          {/* DermaIQ Score Pill */}
                          {u.latest_score !== null && u.latest_score !== undefined && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950">
                              <Sparkles size={13} className="text-emerald-700" />
                              <span>DermaIQ Index:</span>
                              <span className="font-extrabold text-emerald-800">{u.latest_score}/100</span>
                            </div>
                          )}

                          {/* Skin Concerns */}
                          {u.concerns && u.concerns.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Clinical Concerns:</span>
                              <div className="flex flex-wrap gap-1">
                                {u.concerns.map((cn, i) => (
                                  <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#eef7f8] text-cyan-800 border border-[#d0e9ec]">
                                    {cn}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Referral info if referred by consultant */}
                          {u.referred_by_name && (
                            <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                              Referred by Consultant: {u.referred_by_name} {u.referral_priority ? `(${u.referral_priority.replace('_', ' ')})` : ''}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                          {isConnected ? (
                            <Link
                              to={`/messages?partner=${u.user_id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 text-xs font-bold rounded-xl transition-colors shadow-xs"
                              title="WhatsApp Chat with Patient"
                            >
                              <MessageSquare size={13} />
                              <span>Patient Chat</span>
                            </Link>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                              <Clock size={13} />
                              <span>Request Pending</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenApproachPatientModal(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#183a2d] to-[#255241] hover:from-[#112d22] hover:to-[#1b3e31] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                              title="Proactively approach patient to offer clinical care"
                            >
                              <UserPlus size={13} />
                              <span>Approach Patient</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenPatient(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#183a2d] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            <span>Chart</span>
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
              TAB 2: ALL SKINCARE CONSULTANTS (PEER COLLABORATION)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'all_consultants' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-[#142e23] flex items-center gap-2">
                    <Users size={20} className="text-[#2b6d54]" /> Certified Skincare Consultants
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Browse all verified skincare consultants on the platform. Approach colleagues to establish care circle referral pathways, exchange clinical advice, or start peer chats.
                  </p>
                </div>
                <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full font-bold self-start sm:self-auto border border-emerald-200">
                  {filteredConsultants.length} Consultants Available
                </span>
              </div>

              {allConsultants.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-3">
                  <Users size={36} className="text-gray-300 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800">No consultants found on the platform yet.</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    When skincare consultants register on AI Skin, they will appear in this directory for collaboration.
                  </p>
                </div>
              ) : filteredConsultants.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-3xl border border-[#dce8e1] text-xs text-gray-500 space-y-2">
                  <p className="font-semibold text-gray-700">No consultants match "{searchTerm}".</p>
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredConsultants.map((c) => {
                    const isCollaborating = c.shared_clients_count > 0;
                    const isApproaching = approachingId === c.user_id;

                    return (
                      <div
                        key={c.user_id}
                        className="p-6 rounded-3xl bg-white border border-[#dce8e1] shadow-[0_4px_20px_rgba(20,40,32,0.04)] hover:shadow-lg hover:border-[#a8cebe] transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                              Skincare Consultant
                            </span>
                            {isCollaborating ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 size={12} /> Co-Managing ({c.shared_clients_count})
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                Available Colleague
                              </span>
                            )}
                          </div>

                          {/* Consultant Info */}
                          <div>
                            <h3 className="text-lg font-bold text-[#142e23]">{c.name}</h3>
                            <p className="text-xs text-gray-500">{c.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {c.location ? `📍 ${c.location}` : 'Location unrecorded'} {c.age_group ? `• Age: ${c.age_group}` : ''}
                            </p>
                          </div>

                          {/* Stats Pill */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] font-semibold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                              {c.active_clients_count} Active Clients
                            </span>
                            {c.shared_clients_count > 0 && (
                              <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                {c.shared_clients_count} Mutual Patients
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 italic">
                            {isCollaborating 
                              ? "Actively co-managing patient treatment routines with you in the Care Circle." 
                              : "Certified consultant available for peer discussion, referrals, and holistic routine alignment."}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                          <Link
                            to={`/messages?partner=${c.user_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 text-xs font-bold rounded-xl transition-colors shadow-xs"
                            title={`Open WhatsApp-style Peer Chat with ${c.name}`}
                          >
                            <MessageSquare size={13} />
                            <span>WhatsApp Chat</span>
                          </Link>

                          {c.collaboration_status === 'CONNECTED' || isCollaborating ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl">
                              <CheckCircle2 size={13} />
                              <span>Colleague Connected</span>
                            </span>
                          ) : c.collaboration_status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                              <Clock size={13} />
                              <span>Request Pending</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenApproachConsultantModal(c)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#183a2d] to-[#255241] hover:from-[#112d22] hover:to-[#1b3e31] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                              title="Send introductory peer collaboration message"
                            >
                              <UserPlus size={13} />
                              <span>Approach Colleague</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: MY PATIENT CASES (ROSTER)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'my_patients' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#142e23] flex items-center gap-2">
                      <Stethoscope size={20} className="text-[#2b6d54]" /> Connected Patient Cases
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Authorized patients with active clinical consent under your medical care.
                    </p>
                  </div>
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full font-bold self-start sm:self-auto border border-emerald-200">
                    {filteredPatients.length} Active Patients
                  </span>
                </div>

                {patients.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-4">
                    <Stethoscope size={36} className="text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-gray-800">No patients connected yet.</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      You can switch to the <strong>All Users & Patients</strong> directory tab to browse registered platform users and approach them proactively!
                    </p>
                    <button
                      onClick={() => setActiveTab('all_users')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#183a2d] text-white rounded-xl text-xs font-bold hover:bg-[#112d22] transition-colors cursor-pointer"
                    >
                      <Compass size={14} /> Browse Platform Users Directory
                    </button>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-[#dce8e1] text-xs text-gray-500">
                    No patients matched your search query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.user_id}
                        className="p-6 rounded-3xl bg-white border border-[#dce8e1] shadow-[0_4px_20px_rgba(20,40,32,0.04)] hover:shadow-lg hover:border-[#a8cebe] transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                              {patient.skin_type || 'Profile Pending'}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              Connected {new Date(patient.connected_since).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-[#142e23]">{patient.name}</h3>
                            {patient.location && (
                              <p className="text-xs text-gray-500 mt-0.5">{patient.location}</p>
                            )}
                          </div>

                          {patient.concerns && patient.concerns.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {patient.concerns.map((cn, i) => (
                                <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#eef7f8] text-cyan-800 border border-[#d0e9ec]">
                                  {cn}
                                </span>
                              ))}
                            </div>
                          )}

                          {patient.referred_by_name && (
                            <div className="mt-2 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center justify-between">
                              <span>Referred by: {patient.referred_by_name}</span>
                              {patient.referral_priority && (
                                <span className="font-bold text-[9px] px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-900 uppercase">
                                  {patient.referral_priority.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/messages?partner=${patient.user_id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 text-xs font-bold rounded-xl transition-colors shadow-xs"
                              title="WhatsApp Chat with Patient"
                            >
                              <MessageSquare size={13} />
                              <span>Chat</span>
                            </Link>
                            {patient.referred_by_id && (
                              <Link
                                to={`/messages?partner=${patient.referred_by_id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition-colors shadow-xs"
                                title={`Chat with referring consultant ${patient.referred_by_name}`}
                              >
                                <Users size={13} />
                                <span>Consultant</span>
                              </Link>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenPatient(patient)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#214336] hover:bg-[#18352a] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                          >
                            <span>Chart</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Referring Skincare Consultants */}
              {referringConsultants.length > 0 && (
                <div className="bg-[#f8faf9] border border-[#dce8e1] rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#142e23] flex items-center gap-2">
                        <Users size={18} className="text-[#2b6d54]" /> Referring Skincare Consultants ({referringConsultants.length})
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Colleague consultants actively co-managing patient routines with you.
                      </p>
                    </div>
                    <span className="text-xs text-emerald-800 bg-emerald-100 font-bold px-2.5 py-1 rounded-full">
                      Care Circle
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {referringConsultants.map((c) => (
                      <div key={c.id} className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{c.name}</h4>
                          <p className="text-[11px] text-gray-500">Co-managing patient <span className="font-semibold text-gray-700">{c.patient_name}</span></p>
                        </div>
                        <Link
                          to={`/messages?partner=${c.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 text-xs font-bold rounded-xl transition-colors shadow-xs"
                          title={`WhatsApp Chat with Consultant ${c.name}`}
                        >
                          <MessageSquare size={13} />
                          <span>Chat</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 4: INCOMING PATIENT REQUESTS
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                    <Clock size={20} className="text-amber-600" /> Pending Patient Connection Requests
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Platform patients who have requested clinical authorization to connect with you.
                  </p>
                </div>
                <span className="text-xs text-amber-800 bg-amber-100 px-3 py-1 rounded-full font-bold">
                  {incomingRequests.length} pending
                </span>
              </div>

              {incomingRequests.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-3">
                  <CheckCircle size={36} className="text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800">No pending patient requests.</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    You have addressed all pending clinical requests. Check the All Users & Patients tab to approach more patients!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incomingRequests.map((req) => {
                    const reqName = req.initiator_name || req.client?.name || req.professional?.name || 'Incoming User';
                    const reqRole = req.initiator_role ? req.initiator_role.replace('_', ' ') : (req.professional_type || 'Patient');
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

          {/* ═══ TREATMENT RECOMMENDATIONS TAB ═══ */}
          {activeTab === 'treatment_recommendations' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-6 bg-white rounded-3xl border border-[#dce8e1] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800">
                    <Pill size={13} className="text-emerald-600" />
                    <span>Clinical Treatment & Prescriptions Desk</span>
                  </div>
                  <h2 className="text-xl font-black text-[#143a2d]">Treatment Recommendations</h2>
                  <p className="text-xs text-gray-500 max-w-xl">
                    Formulate, audit, and manage medical prescriptions, therapeutic active ingredients, contraindication alerts, and follow-up clinical milestones for your connected patients.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (patients.length > 0) {
                      setSelectedPatientForTreatment(patients[0]);
                    }
                    setShowNewTreatmentModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#183a2d] hover:bg-[#122e23] text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
                >
                  <Plus size={16} />
                  <span>New Treatment Protocol</span>
                </button>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Prescriptions</span>
                  <div className="text-2xl font-black text-[#143a2d] mt-1">{treatmentsList.length}</div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Patients Under Treatment</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {new Set(treatmentsList.map((t) => t.patient_id)).size}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Clinical Actives Monitored</span>
                  <div className="text-2xl font-black text-cyan-700 mt-1">
                    {new Set(treatmentsList.flatMap((t) => t.prescribed_actives || [])).size}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Scheduled Clinical Reviews</span>
                  <div className="text-2xl font-black text-indigo-700 mt-1">
                    {treatmentsList.filter((t) => (t.follow_up_weeks || 0) > 0).length}
                  </div>
                </div>
              </div>

              {/* Treatments List */}
              {loadingTreatments ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1]">
                  <RefreshCw className="animate-spin text-emerald-600 mx-auto" size={28} />
                  <p className="text-xs text-gray-500 mt-3 font-semibold">Loading treatment prescriptions...</p>
                </div>
              ) : treatmentsList.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                    <Pill size={28} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">No treatment prescriptions issued yet</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                      Prescribe clinical regimens, active therapies (retinoids, azelaic acid, ceramides), and usage instructions for your connected patients.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (patients.length > 0) setSelectedPatientForTreatment(patients[0]);
                      setShowNewTreatmentModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#183a2d] text-white rounded-xl text-xs font-bold hover:bg-[#122e23] cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Create Treatment Protocol</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {treatmentsList
                    .filter((t) => {
                      const q = searchTerm.toLowerCase();
                      return (
                        (t.title && t.title.toLowerCase().includes(q)) ||
                        (t.patient_name && t.patient_name.toLowerCase().includes(q)) ||
                        (t.patient_email && t.patient_email.toLowerCase().includes(q)) ||
                        (t.clinical_notes && t.clinical_notes.toLowerCase().includes(q)) ||
                        (t.prescribed_actives && t.prescribed_actives.some((a) => a.toLowerCase().includes(q)))
                      );
                    })
                    .map((item) => {
                      const isExpanded = expandedTreatmentId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="p-6 bg-white rounded-3xl border border-[#dce8e1] shadow-sm hover:shadow-md transition-all space-y-4"
                        >
                          {/* Top Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#183a2d] to-[#255241] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                                {(item.patient_name || 'P').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-bold text-[#143a2d]">
                                    {item.patient_name || 'Connected Patient'}
                                  </h4>
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    Patient Chart
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">{item.patient_email || 'Verified Patient'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <Clock size={12} />
                                {item.follow_up_weeks ? `${item.follow_up_weeks}w Clinical Review` : '4w Clinical Review'}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Protocol Title */}
                          <div>
                            <h5 className="text-sm font-black text-gray-900">{item.title}</h5>
                          </div>

                          {/* Prescribed Actives */}
                          {item.prescribed_actives && item.prescribed_actives.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                Clinical Therapeutics & Actives:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {item.prescribed_actives.map((act, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  >
                                    <ShieldCheck size={12} className="text-emerald-600" />
                                    {act}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Regimen Products */}
                          {item.recommended_products && item.recommended_products.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                                Recommended Product Regimen:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {item.recommended_products.map((p, i) => (
                                  <div
                                    key={i}
                                    className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-800"
                                  >
                                    <span className="font-bold">{typeof p === 'string' ? p : p.name}</span>
                                    {p.timing && <span className="text-[10px] text-gray-500 ml-1.5">({p.timing})</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contraindications Warning */}
                          {item.contraindications && item.contraindications.length > 0 && (
                            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                              <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold block">Contraindications & Warnings:</span>
                                <span>{item.contraindications.join('; ')}</span>
                              </div>
                            </div>
                          )}

                          {/* Clinical Notes Excerpt */}
                          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                              Attending Clinical Advisory Notes:
                            </span>
                            <p className={isExpanded ? 'whitespace-pre-wrap font-normal' : 'line-clamp-2 font-normal'}>
                              {item.clinical_notes}
                            </p>
                            {item.clinical_notes && item.clinical_notes.length > 120 && (
                              <button
                                onClick={() => setExpandedTreatmentId(isExpanded ? null : item.id)}
                                className="text-[11px] font-bold text-emerald-800 hover:underline pt-1 cursor-pointer block"
                              >
                                {isExpanded ? 'Show Less ▲' : 'Read Full Clinical Notes ▼'}
                              </button>
                            )}
                          </div>

                          {/* Footer Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleInspectUser(item.patient_id)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 py-1 cursor-pointer"
                            >
                              <FileText size={13} />
                              <span>Review Patient Chart</span>
                            </button>
                            <button
                              onClick={() => {
                                const target = patients.find((p) => p.user_id === item.patient_id) || {
                                  user_id: item.patient_id,
                                  name: item.patient_name || 'Patient',
                                };
                                setSelectedPatientForTreatment(target);
                                setShowNewTreatmentModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Edit3 size={13} />
                              <span>Update Treatment Protocol</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ═══ PROGRESS ANALYTICS TAB ═══ */}
          {activeTab === 'progress_analytics' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-6 bg-white rounded-3xl border border-[#dce8e1] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-bold text-cyan-800">
                    <BarChart2 size={13} className="text-cyan-600" />
                    <span>Longitudinal Cohort Outcomes & Recovery</span>
                  </div>
                  <h2 className="text-xl font-black text-[#143a2d]">Progress Analytics</h2>
                  <p className="text-xs text-gray-500 max-w-xl">
                    Longitudinal recovery tracking, barrier repair restoration rates, and clinical triage response stratification across your patient panel.
                  </p>
                </div>
                <button
                  onClick={fetchCohortAnalyticsData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start md:self-auto"
                >
                  <RefreshCw size={14} className={loadingAnalytics ? 'animate-spin' : ''} />
                  <span>Refresh Analytics</span>
                </button>
              </div>

              {/* Clinical Outcomes KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Clinical Cohort</span>
                  <div className="text-2xl font-black text-[#143a2d] mt-1">
                    {cohortAnalytics?.summary?.cohort_size ?? patients.length}
                  </div>
                  <span className="text-[10px] text-gray-500">Connected patients</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Mean Recovery Delta</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    +{(cohortAnalytics?.summary?.mean_recovery_delta ?? 0) > 0 ? cohortAnalytics?.summary?.mean_recovery_delta : (cohortAnalytics?.summary?.mean_recovery_delta ?? 0)} pts
                  </div>
                  <span className="text-[10px] text-emerald-600">Cohort skin recovery</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Barrier Restoration</span>
                  <div className="text-2xl font-black text-teal-700 mt-1">
                    {cohortAnalytics?.summary?.barrier_restoration_rate ?? 0}%
                  </div>
                  <span className="text-[10px] text-teal-600">Barrier score ≥ 70</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Stabilization Rate</span>
                  <div className="text-2xl font-black text-cyan-700 mt-1">
                    {cohortAnalytics?.summary?.stabilization_rate ?? 0}%
                  </div>
                  <span className="text-[10px] text-cyan-700">Responsive protocols</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#dce8e1] shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Critical Triage</span>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {cohortAnalytics?.summary?.critical_count ?? 0}
                  </div>
                  <span className="text-[10px] text-rose-600">Severe / Needs attention</span>
                </div>
              </div>

              {/* Stratification Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'all', label: 'All Patients' },
                  { key: 'critical', label: 'Critical / Severe Concerns' },
                  { key: 'moderate', label: 'Moderately Responsive' },
                  { key: 'optimal', label: 'Optimal / Maintained' },
                  { key: 'improving', label: 'Significant Improvement' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAnalyticsFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      analyticsFilter === f.key
                        ? 'bg-[#183a2d] text-white shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Patient Response Ledger */}
              {loadingAnalytics ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1]">
                  <RefreshCw className="animate-spin text-emerald-600 mx-auto" size={28} />
                  <p className="text-xs text-gray-500 mt-3 font-semibold">Analyzing longitudinal recovery telemetry...</p>
                </div>
              ) : (cohortAnalytics?.patient_analytics || []).length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-3">
                  <BarChart2 size={36} className="text-gray-300 mx-auto" />
                  <h3 className="text-base font-bold text-gray-800">No longitudinal clinical data available yet</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Patient assessment progressions and recovery deltas will populate here as connected patients log their skin checks.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(cohortAnalytics?.patient_analytics || [])
                    .filter((item) => {
                      if (analyticsFilter === 'critical' && item.triage_category !== 'CRITICAL') return false;
                      if (analyticsFilter === 'moderate' && item.triage_category !== 'MODERATE') return false;
                      if (analyticsFilter === 'optimal' && item.triage_category !== 'OPTIMAL') return false;
                      if (analyticsFilter === 'improving' && item.clinical_response !== 'SIGNIFICANT_IMPROVEMENT') return false;

                      const q = searchTerm.toLowerCase();
                      return (
                        (item.name && item.name.toLowerCase().includes(q)) ||
                        (item.email && item.email.toLowerCase().includes(q)) ||
                        (item.primary_concern && item.primary_concern.toLowerCase().includes(q)) ||
                        (item.triage_category && item.triage_category.toLowerCase().includes(q))
                      );
                    })
                    .map((item) => {
                      const isPositiveDelta = item.score_delta > 0;
                      const isNegativeDelta = item.score_delta < 0;

                      return (
                        <div
                          key={item.user_id}
                          className="p-6 bg-white rounded-3xl border border-[#dce8e1] shadow-sm hover:shadow-md transition-all space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-[#183a2d] text-white flex items-center justify-center font-bold text-sm">
                                {(item.name || 'P').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-[#143a2d]">{item.name}</h4>
                                <p className="text-xs text-gray-500">
                                  {item.skin_type} • Primary Condition: {item.primary_concern}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Triage Category */}
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                  item.triage_category === 'CRITICAL'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : item.triage_category === 'MODERATE'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {item.triage_category} Triage
                              </span>

                              {/* Clinical Response */}
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                  item.clinical_response === 'SIGNIFICANT_IMPROVEMENT'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : item.clinical_response === 'GRADUAL_RECOVERY'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                              >
                                {item.clinical_response.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                            {/* Score Delta */}
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">DermaIQ Score</span>
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-lg font-black text-gray-900">
                                  {item.latest_score !== null ? `${item.latest_score}/100` : 'Pending'}
                                </span>
                                {item.score_delta !== 0 && (
                                  <span
                                    className={`text-xs font-bold inline-flex items-center ${
                                      isPositiveDelta ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                  >
                                    {isPositiveDelta ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {isPositiveDelta ? `+${item.score_delta}` : item.score_delta}
                                    {item.pct_improvement !== 0 && ` (${item.pct_improvement > 0 ? '+' : ''}${item.pct_improvement}%)`}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* TEWL & Barrier Score */}
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">Barrier / TEWL Risk</span>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-lg font-black text-emerald-700">
                                  {item.barrier_score ?? 70}/100
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    item.tewl_risk === 'HIGH'
                                      ? 'bg-rose-100 text-rose-800'
                                      : item.tewl_risk === 'MODERATE'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.tewl_risk} Risk
                                </span>
                              </div>
                            </div>

                            {/* Routine Adherence */}
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">Routine Compliance</span>
                              <div className="text-lg font-black text-teal-700 mt-0.5">
                                {item.weekly_adherence_rate}%
                              </div>
                              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="bg-teal-600 h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(item.weekly_adherence_rate, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Adherence Streak */}
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                              <span className="text-[10px] font-bold uppercase text-gray-400 block">Logging Consistency</span>
                              <div className="text-lg font-black text-amber-600 mt-0.5 flex items-center gap-1">
                                <Flame size={16} className="text-amber-500" />
                                <span>{item.streak_days} Days</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Info & Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                            <span className="text-gray-400">
                              Last check-in: {item.last_activity ? new Date(item.last_activity).toLocaleDateString() : 'N/A'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleInspectUser(item.user_id)}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer transition-colors"
                              >
                                View Case Chart
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPatientForTreatment(item);
                                  setShowNewTreatmentModal(true);
                                }}
                                className="px-3.5 py-1.5 bg-[#183a2d] hover:bg-[#122e23] text-white rounded-xl font-bold shadow-xs cursor-pointer transition-colors"
                              >
                                Update Protocol
                              </button>
                            </div>
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

      {/* ═══ AUTHORIZED PATIENT CASE CHART MODAL ═══ */}
      {selectedPatientDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 border border-[#dce8e1] max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    selectedPatientDetail.status === 'ACCEPTED'
                      ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
                      : 'text-amber-800 bg-amber-50 border-amber-200'
                  }`}>
                    {selectedPatientDetail.status === 'ACCEPTED'
                      ? 'Authorized Patient Medical Case Chart'
                      : 'Platform User (Candidate Patient)'}
                  </span>
                  {selectedPatientDetail.status === 'ACCEPTED' && (
                    <span className="text-[11px] text-gray-400">
                      Connected {selectedPatientDetail.connected_since ? new Date(selectedPatientDetail.connected_since).toLocaleDateString() : ''}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-black text-[#142e23] mt-2">{selectedPatientDetail.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Email: {selectedPatientDetail.email} • Location: {selectedPatientDetail.location || 'Not recorded'} • Age: {selectedPatientDetail.age_group || 'Not recorded'}
                </p>

                {/* Candidate Outreach Banner if not connected */}
                {selectedPatientDetail.status === 'PENDING' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-bold">
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-600" /> Clinical Connection Request Pending Approval</span>
                    <span className="text-[11px] font-normal text-amber-700">Awaiting patient response</span>
                  </div>
                )}
                {selectedPatientDetail.status !== 'ACCEPTED' && selectedPatientDetail.status !== 'PENDING' && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-emerald-950 block">Proactive Clinical Care Outreach</span>
                      <p className="text-emerald-800 text-[11px]">Send a personalized medical introduction to add this patient to your care circle.</p>
                    </div>
                    <button
                      onClick={() => handleOpenApproachPatientModal(selectedPatientDetail)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#183a2d] hover:bg-[#112d22] text-white rounded-xl font-bold shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <UserPlus size={13} />
                      <span>Approach Patient</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {selectedPatientDetail.status === 'ACCEPTED' && (
                    <Link
                      to={`/messages?partner=${selectedPatientDetail.user_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 rounded-xl text-xs font-bold transition-colors shadow-xs"
                      title="Live WhatsApp Care Circle Chat with Patient"
                    >
                      <MessageSquare size={13} />
                      <span>WhatsApp Chat</span>
                    </Link>
                  )}
                  <button
                    onClick={() => reportService.downloadPdf('CLINICAL_SUMMARY', selectedPatientDetail.user_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    title="Export Patient Clinical Case PDF"
                  >
                    <FileText size={13} />
                    <span>Clinical PDF</span>
                  </button>
                  <button
                    onClick={() => reportService.downloadExcel('CLINICAL_SUMMARY', selectedPatientDetail.user_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    title="Export Patient Telemetry Matrix"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={() => setShowConsultationMemo(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#183a2d] border border-emerald-200 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    title="Generate Printable & EHR-Ready Clinical Case Summary Memo"
                  >
                    <Printer size={13} className="text-emerald-700" />
                    <span>Case Memo</span>
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatientDetail(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Consultant Referral Dossier (If referred by Consultant) */}
            {selectedPatientDetail.referred_by_name && (
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-800 block">
                    Consultant Referral Dossier
                  </span>
                  <p>
                    Referred by Consultant: <span className="font-bold">{selectedPatientDetail.referred_by_name}</span> • Priority: <span className="font-bold uppercase text-emerald-900">{selectedPatientDetail.referral_priority || 'ROUTINE'}</span>
                  </p>
                  {selectedPatientDetail.referral_notes && (
                    <p className="text-[11px] text-emerald-800 italic mt-1 bg-white/70 p-2 rounded-lg border border-emerald-100">
                      "{selectedPatientDetail.referral_notes}"
                    </p>
                  )}
                </div>
                {selectedPatientDetail.referred_by_id && (
                  <Link
                    to={`/messages?partner=${selectedPatientDetail.referred_by_id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap self-start sm:self-auto transition-colors"
                  >
                    <MessageSquare size={13} />
                    <span>Chat with Consultant</span>
                  </Link>
                )}
              </div>
            )}

            {/* Care Circle & Collaborating Consultants */}
            {selectedPatientDetail.collaborating_professionals?.length > 0 && (
              <div className="p-4 bg-[#f8faf9] rounded-2xl border border-[#dce8e1] space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-[#183a2d]" />
                  Co-Managing Care Team Members
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPatientDetail.collaborating_professionals.map((collab) => (
                    <div key={collab.connection_id} className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {collab.care_role}
                          </span>
                          <span className="text-[10px] text-gray-400">Connected</span>
                        </div>
                        <h5 className="text-sm font-bold text-gray-900 mt-1">{collab.name}</h5>
                        <p className="text-[11px] text-gray-500">{collab.email}</p>
                        {collab.location && <p className="text-[10px] text-gray-400 mt-0.5">{collab.location}</p>}
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
              </div>
            )}

            {/* Clinical Physiology & Allergies */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Cutaneous Physiology & Allergies
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-[#f8faf9] rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Skin Physiology</span>
                  <p className="text-sm font-extrabold text-[#142e23] mt-0.5">
                    {selectedPatientDetail.skin_profile?.skin_type || 'Not specified'}
                  </p>
                </div>
                <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
                    <AlertTriangle size={11} /> Documented Allergies
                  </span>
                  <p className="text-xs font-bold text-rose-800 mt-0.5">
                    {selectedPatientDetail.skin_profile?.allergies || 'None reported'}
                  </p>
                </div>
              </div>

              {selectedPatientDetail.skin_profile?.sensitivities && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Cutaneous Sensitivities:</span> {selectedPatientDetail.skin_profile.sensitivities}
                </div>
              )}

              {selectedPatientDetail.concerns && selectedPatientDetail.concerns.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Diagnosed / Target Concerns</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatientDetail.concerns.map((c) => (
                      <span key={c.id} className="px-3 py-1 bg-cyan-50 text-cyan-800 text-xs font-bold rounded-xl border border-cyan-200">
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
                Physiological & Environmental Telemetry
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#f8faf9] rounded-xl border border-gray-100 text-center">
                  <Moon size={16} className="text-indigo-600 mx-auto mb-1" />
                  <span className="text-gray-400 text-[10px] block">Sleep Recovery</span>
                  <span className="font-bold text-gray-900">
                    {selectedPatientDetail.recent_sleep ? `${(selectedPatientDetail.recent_sleep.duration_minutes / 60).toFixed(1)} hrs` : 'No logs'}
                  </span>
                </div>

                <div className="p-3 bg-[#f8faf9] rounded-xl border border-gray-100 text-center">
                  <Droplet size={16} className="text-cyan-600 mx-auto mb-1" />
                  <span className="text-gray-400 text-[10px] block">Hydration Volume</span>
                  <span className="font-bold text-gray-900">
                    {selectedPatientDetail.recent_hydration ? `${selectedPatientDetail.recent_hydration.water_intake_ml} mL` : 'No logs'}
                  </span>
                </div>

                <div className="p-3 bg-[#f8faf9] rounded-xl border border-gray-100 text-center">
                  <Sun size={16} className="text-amber-600 mx-auto mb-1" />
                  <span className="text-gray-400 text-[10px] block">UV Index Stress</span>
                  <span className="font-bold text-gray-900">
                    {selectedPatientDetail.recent_environment?.uv_exposure || 'No logs'}
                  </span>
                </div>

                <div className="p-3 bg-[#f8faf9] rounded-xl border border-gray-100 text-center">
                  <Sparkles size={16} className="text-emerald-600 mx-auto mb-1" />
                  <span className="text-gray-400 text-[10px] block">Physical Activity</span>
                  <span className="font-bold text-gray-900">
                    {selectedPatientDetail.recent_lifestyle?.physical_activity || 'No logs'}
                  </span>
                </div>
              </div>
            </div>

            {/* DermaIQ Health Score & 5-Pillar Diagnostics */}
            {selectedPatientDetail.latest_assessment && (
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      DermaIQ Health Diagnosis & 5 Pillars
                    </span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 bg-emerald-600 text-white rounded-lg">
                    Score: {selectedPatientDetail.latest_assessment.overall_score}/100
                  </span>
                </div>

                {selectedPatientDetail.latest_assessment.scores && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Condition (35%)</span>
                      <span className="font-bold text-gray-800">{selectedPatientDetail.latest_assessment.scores.skin_condition_score}%</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Lifestyle (20%)</span>
                      <span className="font-bold text-gray-800">{selectedPatientDetail.latest_assessment.scores.lifestyle_score}%</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Sleep (15%)</span>
                      <span className="font-bold text-gray-800">{selectedPatientDetail.latest_assessment.scores.sleep_score}%</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Consistency (20%)</span>
                      <span className="font-bold text-gray-800">{selectedPatientDetail.latest_assessment.scores.routine_consistency_score}%</span>
                    </div>
                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-gray-500 block">Hydration (10%)</span>
                      <span className="font-bold text-gray-800">{selectedPatientDetail.latest_assessment.scores.hydration_score}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Patient Active Skincare Routine (AM / PM / Weekly / Seasonal) */}
            {selectedPatientDetail.active_routine && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart size={13} className="text-emerald-600" />
                    Patient Active Routine (v{selectedPatientDetail.active_routine.version})
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Adherence: {selectedPatientDetail.active_routine.adherence_score}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Morning */}
                  {selectedPatientDetail.active_routine.morning?.steps?.length > 0 && (
                    <div className="p-3 bg-[#f8faf9] rounded-xl border border-gray-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block">☀️ Morning Steps</span>
                      <ul className="space-y-1">
                        {selectedPatientDetail.active_routine.morning.steps.map((st, i) => (
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
                  {selectedPatientDetail.active_routine.evening?.steps?.length > 0 && (
                    <div className="p-3 bg-[#f8faf9] rounded-xl border border-gray-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase block">🌙 Evening Steps</span>
                      <ul className="space-y-1">
                        {selectedPatientDetail.active_routine.evening.steps.map((st, i) => (
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
                  {selectedPatientDetail.active_routine.seasonal?.steps?.length > 0 && (
                    <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/70 space-y-1.5 sm:col-span-2">
                      <span className="text-[10px] font-bold text-teal-800 uppercase block">🍂 Seasonal Adaptation Steps</span>
                      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {selectedPatientDetail.active_routine.seasonal.steps.map((st, i) => (
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

            {/* Past Clinical Directives & Patient Inquiries History */}
            {selectedPatientDetail.past_recommendations?.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={13} className="text-indigo-600" />
                  Communication & Recommendation Thread ({selectedPatientDetail.past_recommendations.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedPatientDetail.past_recommendations.map((pr, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs ${
                        pr.title?.startsWith('[Patient Inquiry]')
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-indigo-50/50 border-indigo-100 text-gray-800'
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
                        <p className="text-[10px] text-indigo-700 font-semibold mt-1">
                          Prescribed: {pr.prescribed_actives.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ ATTENDING PROFESSIONAL PRIVATE CLINICAL SCRATCHPAD ═══ */}
            <div className="p-4 bg-[#f8faf9] rounded-2xl border border-[#dce8e1] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 size={15} className="text-[#183a2d]" />
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Attending Dermatologist Private Clinical Scratchpad
                  </h4>
                </div>
                {scratchpadSavedTime && (
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Saved: {scratchpadSavedTime}
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={privateScratchpad}
                onChange={(e) => setPrivateScratchpad(e.target.value)}
                placeholder="Enter differential diagnoses, histopathology notes, clinical watch-flags (saved locally on your workstation)..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#183a2d] text-gray-800 shadow-2xs font-normal"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-gray-400">
                  Confidential to your dermatologist terminal. Not visible to patient or consultant.
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
                    className="px-3.5 py-1.5 bg-[#183a2d] hover:bg-[#112d22] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Save Clinical Note
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ CLINICAL ACTIVE FORMULATION & ALLERGY SAFETY ANALYZER ═══ */}
            {(() => {
              const activeSafetyResult = evaluateClinicalSafety(selectedActives, selectedPatientDetail);
              return (
                <div className="p-4 bg-white rounded-2xl border border-emerald-200/90 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Prescription Formulation & Allergy Interaction Analyzer
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Cross-reference active therapeutics with patient allergy record, barrier score, and phototype
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
                      Select Active Compounds ({selectedActives.length} selected)
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
                                ? 'bg-[#183a2d] text-white border-[#183a2d] shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
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
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
                      <span className="font-bold text-[11px] text-emerald-800 uppercase tracking-wide block">
                        Clinical Protocol Guidance:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-900">
                        {activeSafetyResult.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Clinical Prescriptions & Advisory Section */}
            <ClinicalPrescriptionForm
              patientId={selectedPatientDetail.user_id}
              patientName={selectedPatientDetail.name || selectedPatientDetail.profile?.name}
              onPrescriptionCreated={async () => {
                const refreshed = await dermatologistService.getPatientDetail(selectedPatientDetail.user_id);
                setSelectedPatientDetail(refreshed);
              }}
            />

            {/* Footer Close */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPatientDetail(null)}
                className="px-5 py-2.5 bg-[#183a2d] hover:bg-[#112d22] text-white text-xs font-bold rounded-xl shadow-md"
              >
                Close Case Chart
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══ APPROACH PATIENT MODAL ═══ */}
      {approachPatientUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Send Clinical Care Request</h3>
                  <p className="text-xs text-gray-500">Proactively reach out to {approachPatientUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setApproachPatientUser(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Recipient summary pill */}
            <div className="p-4 bg-[#f8fbf9] rounded-2xl border border-[#dce8e1] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900">{approachPatientUser.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  {approachPatientUser.skin_type || 'Clinical Profile'}
                </span>
              </div>
              <p className="text-xs text-gray-500">{approachPatientUser.email}</p>
              {approachPatientUser.concerns?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {approachPatientUser.concerns.map((cn, i) => (
                    <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-700">
                      {typeof cn === 'string' ? cn : cn.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmApproachPatient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Clinical Care Message & Introduction Note
                </label>
                <textarea
                  rows={4}
                  value={approachPatientMessage}
                  onChange={(e) => setApproachPatientMessage(e.target.value)}
                  placeholder="Introduce yourself and explain the clinical oversight or treatment guidance you'd like to provide..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#183a2d] text-gray-800"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  The patient will receive an instant notification with your role and medical message, allowing them to review and accept the connection.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setApproachPatientUser(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApproach || !approachPatientMessage.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#183a2d] hover:bg-[#112d22] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
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

      {/* ═══ APPROACH CONSULTANT COLLEAGUE MODAL ═══ */}
      {approachConsultantTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-teal-50 text-teal-800 rounded-2xl border border-teal-200">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Send Peer Collaboration Request</h3>
                  <p className="text-xs text-gray-500">Collaborate with consultant {approachConsultantTarget.name}</p>
                </div>
              </div>
              <button
                onClick={() => setApproachConsultantTarget(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Recipient summary pill */}
            <div className="p-4 bg-[#f8fbf9] rounded-2xl border border-[#dce8e1] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900">{approachConsultantTarget.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                  Certified Skincare Consultant
                </span>
              </div>
              <p className="text-xs text-gray-500">{approachConsultantTarget.email}</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-600">
                <span className="font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  {approachConsultantTarget.active_clients_count || 0} Active Clients
                </span>
                {approachConsultantTarget.location && (
                  <span>📍 {approachConsultantTarget.location}</span>
                )}
              </div>
            </div>

            <form onSubmit={handleConfirmApproachConsultant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Peer Collaboration Note & Referral Channel Terms
                </label>
                <textarea
                  rows={4}
                  value={approachConsultantMessage}
                  onChange={(e) => setApproachConsultantMessage(e.target.value)}
                  placeholder="Introduce yourself to your colleague and propose a mutual referral channel or clinical advice workflow..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#183a2d] text-gray-800"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  The consultant will receive an instant notification with your role and message to accept peer collaboration.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setApproachConsultantTarget(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApproach || !approachConsultantMessage.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#183a2d] to-[#255241] hover:from-[#112d22] hover:to-[#1b3e31] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingApproach ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Collaboration Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ PRINTABLE / EHR CLINICAL CONSULTATION SUMMARY MEMO MODAL ═══ */}
      {showConsultationMemo && selectedPatientDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-emerald-200 max-h-[92vh] overflow-y-auto space-y-6">
            
            {/* Top Bar with Print, Copy, and Close */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                  <Printer size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#183a2d]">Clinical Consultation Memo</h3>
                  <p className="text-[11px] text-gray-500">Standardized medical summary formatted for Electronic Health Records & print</p>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183a2d] hover:bg-[#112d22] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
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
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">DermaIQ Medical Dermatology Network</span>
                  <h4 className="text-lg font-black text-gray-900 mt-0.5">Clinical Dermatology Case Summary</h4>
                  <p className="text-[11px] text-gray-500">
                    Attending: {user?.name ? `Dr. ${user.name}` : 'Clinical Dermatologist'} • Role: Attending Specialist
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
                  <span className="font-bold text-gray-900">{selectedPatientDetail.name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Email / Contact</span>
                  <span className="font-medium text-gray-700">{selectedPatientDetail.email}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Location</span>
                  <span className="font-medium text-gray-700">{selectedPatientDetail.location || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Cutaneous Physiology</span>
                  <span className="font-medium text-gray-700">{selectedPatientDetail.skin_profile?.skin_type || selectedPatientDetail.skin_type || 'Unspecified'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Documented Allergies</span>
                  <span className="font-semibold text-rose-700">{selectedPatientDetail.skin_profile?.allergies || 'None reported'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-gray-400 block">Cutaneous Sensitivities</span>
                  <span className="font-medium text-gray-700">{selectedPatientDetail.skin_profile?.sensitivities || 'None reported'}</span>
                </div>
              </div>

              {/* Diagnostic 5-Pillar Score Matrix */}
              {selectedPatientDetail.latest_assessment && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">DermaIQ Diagnostic 5 Pillars</span>
                    <span className="text-xs font-black text-emerald-800">Overall Score: {selectedPatientDetail.latest_assessment.overall_score}/100</span>
                  </div>
                  {selectedPatientDetail.latest_assessment.scores && (
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[11px]">
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Condition</span>
                        <span className="font-bold">{selectedPatientDetail.latest_assessment.scores.skin_condition_score}%</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Lifestyle</span>
                        <span className="font-bold">{selectedPatientDetail.latest_assessment.scores.lifestyle_score}%</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Sleep</span>
                        <span className="font-bold">{selectedPatientDetail.latest_assessment.scores.sleep_score}%</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Consistency</span>
                        <span className="font-bold">{selectedPatientDetail.latest_assessment.scores.routine_consistency_score}%</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[9px] text-gray-400 block">Hydration</span>
                        <span className="font-bold">{selectedPatientDetail.latest_assessment.scores.hydration_score}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Evaluated Active Safety Review */}
              {(() => {
                const sRes = evaluateClinicalSafety(selectedActives, selectedPatientDetail);
                return (
                  <div className="space-y-1.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Evaluated Active Therapeutics & Safety</span>
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Attending Dermatologist Differential Notes</span>
                <p className="text-[11px] p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-gray-700 whitespace-pre-wrap">
                  {privateScratchpad || 'No differential clinical notes recorded for this case.'}
                </p>
              </div>

              {/* Disclaimer */}
              <div className="pt-3 border-t border-gray-200 text-[10px] text-gray-400 flex items-center justify-between">
                <span>DermaIQ AI-Assisted Clinical Support • Confidential Medical Case Memo</span>
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

      {/* ═══ NEW TREATMENT PROTOCOL PRESCRIPTION MODAL ═══ */}
      {showNewTreatmentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 border border-[#dce8e1] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800">
                  <Pill size={13} className="text-emerald-600" />
                  <span>Clinical Prescription Desk</span>
                </div>
                <h3 className="text-2xl font-black text-[#143a2d]">Write Treatment Protocol</h3>
                <p className="text-xs text-gray-500">
                  Prescribe high-potency clinical actives, regimen products, and contraindication parameters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTreatmentModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Patient Selector */}
            {patients.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <Users size={32} className="text-gray-400 mx-auto" />
                <h4 className="text-sm font-bold text-gray-800">No Connected Patients Available</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  You must have an accepted care connection with a patient before prescribing medical treatments. Visit the "All Users & Patients" tab to approach candidates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Select Patient Case Chart:</label>
                  <select
                    value={selectedPatientForTreatment?.user_id || ''}
                    onChange={(e) => {
                      const found = patients.find((p) => p.user_id === e.target.value);
                      if (found) setSelectedPatientForTreatment(found);
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#183a2d] focus:outline-none"
                  >
                    {patients.map((p) => (
                      <option key={p.user_id} value={p.user_id}>
                        {p.name} ({p.email}) — {p.skin_type || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPatientForTreatment && (
                  <div className="pt-2">
                    <ClinicalPrescriptionForm
                      patientId={selectedPatientForTreatment.user_id}
                      patientName={selectedPatientForTreatment.name}
                      onPrescriptionSubmitted={async () => {
                        await fetchTreatmentsData();
                        await fetchCohortAnalyticsData();
                        setShowNewTreatmentModal(false);
                        toast.success(`Treatment protocol prescribed for ${selectedPatientForTreatment.name}!`);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dermatologist;
