import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Stethoscope, Sparkles, Clock, CheckCircle2, 
  XCircle, AlertCircle, Trash2, ArrowRight, ShieldCheck, 
  Calendar, MapPin, RefreshCw, MessageSquare, Send, X, Pill,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { connectionsService } from '../services/connections';
import api from '../services/api';
import { useToast } from '../components/Toast';

const MyConnections = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [careCircle, setCareCircle] = useState(null);

  // Consultation Hub State
  const [activeConsultationProf, setActiveConsultationProf] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const [data, circleData] = await Promise.all([
        connectionsService.getMyConnections(),
        connectionsService.getCareCircle().catch(() => null),
      ]);
      setConnections(data);
      setCareCircle(circleData);
    } catch (err) {
      console.error('Failed to load my connections:', err);
      toast.error('Failed to load your connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleCancelOrDisconnect = async (connId, isAccepted) => {
    const actionLabel = isAccepted ? 'Disconnect from' : 'Cancel request to';
    if (!window.confirm(`Are you sure you want to ${actionLabel.toLowerCase()} this professional?`)) {
      return;
    }

    try {
      setCancellingId(connId);
      await connectionsService.cancelConnection(connId);
      toast.success(isAccepted ? 'Professional disconnected successfully' : 'Connection request cancelled');
      fetchConnections();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Action failed. Please try again.';
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const handleAcceptConnection = async (connId, profName) => {
    try {
      setProcessingId(connId);
      await connectionsService.acceptConnection(connId);
      toast.success(`Connected with ${profName || 'professional'}! They are now part of your authorized Care Team.`);
      fetchConnections();
    } catch (err) {
      console.error('Failed to accept connection request:', err);
      toast.error(err.response?.data?.detail || 'Failed to accept connection request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConnection = async (connId) => {
    if (!window.confirm('Are you sure you want to decline this connection request?')) return;
    try {
      setProcessingId(connId);
      await connectionsService.rejectConnection(connId);
      toast.info('Connection request declined.');
      fetchConnections();
    } catch (err) {
      console.error('Failed to decline connection request:', err);
      toast.error(err.response?.data?.detail || 'Failed to decline request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenConsultation = async (conn) => {
    setActiveConsultationProf(conn);
    setLoadingRecs(true);
    try {
      const res = await api.get('/recommendations/my');
      setRecommendations(res.data || []);
    } catch {
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryTitle.trim() || !inquiryMessage.trim() || !activeConsultationProf) return;
    setSubmittingInquiry(true);
    try {
      await api.post('/recommendations/inquiry', {
        professional_id: activeConsultationProf.professional_id,
        title: inquiryTitle.trim(),
        message: inquiryMessage.trim(),
      });
      toast.success(`Inquiry sent to ${activeConsultationProf.professional?.name || 'Doctor'}!`);
      setInquiryTitle('');
      setInquiryMessage('');
      const res = await api.get('/recommendations/my');
      setRecommendations(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit inquiry.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const activeConsultants = connections.filter(
    c => c.professional_type === 'SKINCARE_CONSULTANT' && c.status === 'ACCEPTED'
  );
  const activeDermatologists = connections.filter(
    c => c.professional_type === 'DERMATOLOGIST' && c.status === 'ACCEPTED'
  );
  const pendingRequests = connections.filter(
    c => c.status === 'PENDING'
  );
  const historicalConnections = connections.filter(
    c => c.status === 'REJECTED' || c.status === 'CANCELLED'
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ═══ HEADER BAR ═══ */}
      <div className="bg-gradient-to-r from-[#173a30] to-[#265947] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200 border border-white/10">
              <ShieldCheck size={14} /> Authorized Care Team
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              My Professional Connections
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-xl font-normal leading-relaxed">
              Manage your authorized relationships with Skincare Consultants and Clinical Dermatologists. You have complete control to disconnect at any time.
            </p>
          </div>

          <Link
            to="/find-professional"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-emerald-50 text-[#142e23] font-bold rounded-2xl text-xs shadow-lg hover:shadow-xl transition-all self-start md:self-auto"
          >
            <Sparkles size={16} /> Find New Professional
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-3">
          <div className="h-8 w-8 border-3 border-[#214336] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Loading your care team...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* ═══ UNIFIED CARE CIRCLE HUB ═══ */}
          {(careCircle?.primary_consultant || careCircle?.attending_dermatologist) && (
            <div className="bg-gradient-to-br from-[#133026] via-[#1a4436] to-[#235846] rounded-3xl p-6 md:p-8 text-white shadow-xl space-y-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-300 border border-white/10">
                    <ShieldCheck size={14} /> Integrated Skincare Team
                  </div>
                  <h2 className="text-2xl font-black mt-2">Your Unified Care Circle</h2>
                  <p className="text-xs text-emerald-100/80 max-w-xl mt-1 leading-relaxed">
                    {careCircle.primary_consultant && careCircle.attending_dermatologist
                      ? 'Both your Skincare Consultant and Clinical Dermatologist are actively co-managing your skin regimen, assessments, and wellness telemetry together.'
                      : 'Your personal skin health professionals collaborate seamlessly to monitor your progress.'}
                  </p>
                </div>
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebd59] text-white rounded-2xl text-xs font-bold shadow-lg transition-transform active:scale-95 self-start md:self-auto"
                >
                  <MessageSquare size={16} /> Open Care Circle WhatsApp Chat
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Consultant Card */}
                {careCircle.primary_consultant ? (
                  <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">
                        Primary Skincare Consultant
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1">{careCircle.primary_consultant.name}</h4>
                      <p className="text-xs text-emerald-100/70">{careCircle.primary_consultant.email}</p>
                      {careCircle.primary_consultant.location && (
                        <p className="text-xs text-emerald-100/60 mt-1">📍 {careCircle.primary_consultant.location}</p>
                      )}
                    </div>
                    <Link
                      to={`/messages?partner=${careCircle.primary_consultant.user_id}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#133026] hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-sm transition-colors"
                    >
                      <MessageSquare size={14} className="text-[#25D366]" /> Live Chat with {careCircle.primary_consultant.name}
                    </Link>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col justify-between space-y-2 text-center">
                    <p className="text-xs text-emerald-100/70">No Primary Consultant connected yet.</p>
                    <Link
                      to="/find-professional"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Find Skincare Consultant
                    </Link>
                  </div>
                )}

                {/* Dermatologist Card */}
                {careCircle.attending_dermatologist ? (
                  <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                          Attending Clinical Dermatologist
                        </span>
                        {careCircle.attending_dermatologist.referred_by_name && (
                          <span className="text-[9px] font-semibold text-emerald-200 bg-white/10 px-2 py-0.5 rounded-full">
                            Referred by {careCircle.attending_dermatologist.referred_by_name}
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-white mt-1">Dr. {careCircle.attending_dermatologist.name}</h4>
                      <p className="text-xs text-emerald-100/70">{careCircle.attending_dermatologist.email}</p>
                      {careCircle.attending_dermatologist.location && (
                        <p className="text-xs text-emerald-100/60 mt-1">📍 {careCircle.attending_dermatologist.location}</p>
                      )}
                    </div>
                    <Link
                      to={`/messages?partner=${careCircle.attending_dermatologist.user_id}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#133026] hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-sm transition-colors"
                    >
                      <MessageSquare size={14} className="text-[#25D366]" /> Live Chat with Dr. {careCircle.attending_dermatologist.name}
                    </Link>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col justify-between space-y-2 text-center">
                    <p className="text-xs text-emerald-100/70">No Attending Dermatologist connected yet.</p>
                    <Link
                      to="/find-professional"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Connect with Dermatologist
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ ACTIVE CONSULTANTS ═══ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#142e23] flex items-center gap-2">
                <Sparkles size={18} className="text-[#2b6d54]" /> Connected Skincare Consultants
              </h2>
              <span className="text-xs font-bold text-gray-500">{activeConsultants.length} connected</span>
            </div>

            {activeConsultants.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-2">
                <Users size={28} className="text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-600">No connected Skincare Consultants yet.</p>
                <p className="text-[11px] text-gray-400">Discover and connect with a consultant to share routine feedback.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeConsultants.map((conn) => (
                  <div key={conn.id} className="p-6 rounded-3xl bg-white border border-[#dce8e1] shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Consultant
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(conn.responded_at || conn.requested_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-gray-900">{conn.professional?.name}</h3>
                        <p className="text-xs text-gray-500">{conn.professional?.email}</p>
                      </div>

                      {conn.professional?.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={13} /> {conn.professional.location}
                        </div>
                      )}

                      {conn.referred_by_name && (
                        <div className="mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          Referred by: {conn.referred_by_name}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/messages?partner=${conn.professional_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#128C7E] bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 transition-colors shadow-xs"
                          title="Open Live WhatsApp Chat"
                        >
                          <MessageSquare size={13} /> Chat
                        </Link>
                        <button
                          onClick={() => handleOpenConsultation(conn)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#142e23] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        >
                          <FileText size={13} className="text-emerald-600" /> Directives
                        </button>
                      </div>
                      <button
                        onClick={() => handleCancelOrDisconnect(conn.id, true)}
                        disabled={cancellingId === conn.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ ACTIVE DERMATOLOGISTS ═══ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#142e23] flex items-center gap-2">
                <Stethoscope size={18} className="text-[#1d6b99]" /> Connected Clinical Dermatologists
              </h2>
              <span className="text-xs font-bold text-gray-500">{activeDermatologists.length} connected</span>
            </div>

            {activeDermatologists.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-2">
                <Stethoscope size={28} className="text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-600">No connected Dermatologists yet.</p>
                <p className="text-[11px] text-gray-400">Connect with a clinical dermatologist for medical skin observation reviews.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeDermatologists.map((conn) => (
                  <div key={conn.id} className="p-6 rounded-3xl bg-white border border-[#dce8e1] shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                          Active Dermatologist
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(conn.responded_at || conn.requested_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-gray-900">{conn.professional?.name}</h3>
                        <p className="text-xs text-gray-500">{conn.professional?.email}</p>
                      </div>

                      {conn.professional?.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={13} /> {conn.professional.location}
                        </div>
                      )}

                      {conn.referred_by_name && (
                        <div className="mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          Referred by: {conn.referred_by_name} {conn.referral_priority ? `(${conn.referral_priority.replace('_', ' ')})` : ''}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/messages?partner=${conn.professional_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#128C7E] bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 transition-colors shadow-xs"
                          title="Open Live WhatsApp Chat"
                        >
                          <MessageSquare size={13} /> Chat
                        </Link>
                        <button
                          onClick={() => handleOpenConsultation(conn)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#142e23] bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer"
                        >
                          <FileText size={13} className="text-cyan-700" /> Directives
                        </button>
                      </div>
                      <button
                        onClick={() => handleCancelOrDisconnect(conn.id, true)}
                        disabled={cancellingId === conn.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ PENDING REQUESTS ═══ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#142e23] flex items-center gap-2">
                <Clock size={18} className="text-amber-600" /> Pending Connection Requests
              </h2>
              <span className="text-xs font-bold text-gray-500">{pendingRequests.length} pending</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-[#dce8e1] text-xs text-gray-400">
                No pending requests at this time.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pendingRequests.map((conn) => {
                  const isIncoming = conn.initiator_id && user?.id
                    ? (conn.initiator_id !== user.id)
                    : (conn.initiator_role === 'SKINCARE_CONSULTANT' || conn.initiator_role === 'DERMATOLOGIST' || conn.referral_priority?.includes('APPROACH'));

                  const profRole = conn.initiator_role
                    ? conn.initiator_role.replace('_', ' ')
                    : (conn.professional_type === 'DERMATOLOGIST' ? 'Clinical Dermatologist' : 'Skincare Consultant');
                  const profName = conn.initiator_name || conn.professional?.name || 'Professional';
                  const profEmail = conn.professional?.email;

                  return (
                    <div 
                      key={conn.id} 
                      className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between space-y-3 ${
                        isIncoming ? 'bg-emerald-50/40 border-emerald-300' : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isIncoming
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {isIncoming ? `Incoming Request • ${profRole}` : 'Awaiting Approval'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {conn.requested_at ? new Date(conn.requested_at).toLocaleDateString() : ''}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-base text-gray-900">{profName}</h4>
                          <p className="text-xs text-gray-500">{profEmail}</p>
                          {!isIncoming && (
                            <p className="text-xs text-gray-400 mt-0.5">{profRole}</p>
                          )}
                        </div>

                        {/* Custom message from requester */}
                        {conn.referral_notes && (
                          <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                            isIncoming
                              ? 'bg-white/90 border-emerald-200 text-emerald-950'
                              : 'bg-white/80 border-amber-200 text-amber-950'
                          }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                              isIncoming ? 'text-emerald-800' : 'text-amber-800'
                            }`}>
                              {isIncoming ? `Message from ${profRole}:` : 'Note with Request:'}
                            </span>
                            <p className="italic font-medium">"{conn.referral_notes}"</p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2">
                        {isIncoming ? (
                          <>
                            <button
                              onClick={() => handleAcceptConnection(conn.id, profName)}
                              disabled={processingId === conn.id}
                              className="flex-1 px-3 py-2 bg-[#173a30] hover:bg-[#0f2720] text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {processingId === conn.id ? 'Connecting...' : 'Accept Connection'}
                            </button>
                            <button
                              onClick={() => handleRejectConnection(conn.id)}
                              disabled={processingId === conn.id}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className="w-full flex justify-end">
                            <button
                              onClick={() => handleCancelOrDisconnect(conn.id, false)}
                              disabled={cancellingId === conn.id}
                              className="text-xs font-bold text-gray-600 hover:text-rose-700 transition-colors cursor-pointer"
                            >
                              Cancel Request
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═══ PATIENT-PROFESSIONAL CONSULTATION & ADVICE HUB MODAL ═══ */}
      {activeConsultationProf && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 border border-[#dce8e1] max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#142e23] text-white flex items-center justify-center font-bold">
                  {activeConsultationProf.professional_type === 'DERMATOLOGIST' ? <Stethoscope size={18} /> : <Sparkles size={18} />}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {activeConsultationProf.professional_type === 'DERMATOLOGIST' ? 'Board-Certified Dermatologist' : 'Skincare Consultant'}
                  </span>
                  <h3 className="text-xl font-black text-[#142e23] mt-1">
                    {activeConsultationProf.professional?.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {activeConsultationProf.professional?.email} {activeConsultationProf.professional?.location ? `• ${activeConsultationProf.professional.location}` : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveConsultationProf(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Doctor's Issued Recommendations & Prescriptions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill size={14} className="text-indigo-600" />
                  Prescriptions & Clinical Directives
                </h4>
                <span className="text-[10px] text-gray-400 font-medium">
                  {recommendations.length} total entries
                </span>
              </div>

              {loadingRecs ? (
                <div className="p-6 text-center text-xs text-gray-400 animate-pulse">
                  Loading clinical advisories...
                </div>
              ) : recommendations.length === 0 ? (
                <div className="p-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center space-y-1">
                  <p className="text-xs font-bold text-gray-600">No clinical prescriptions issued yet.</p>
                  <p className="text-[11px] text-gray-400">
                    Use the inquiry form below to ask a question or request a review of your routine.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-4 rounded-2xl border text-xs space-y-2 ${
                        rec.title?.startsWith('[Patient Inquiry]')
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-indigo-50/40 border-indigo-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-xs">{rec.title}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {new Date(rec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 italic bg-white/70 p-2.5 rounded-xl border border-indigo-50/80">
                        "{rec.clinical_notes}"
                      </p>

                      {rec.prescribed_actives?.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center pt-1">
                          <span className="text-[10px] font-bold text-gray-500 mr-1">Actives:</span>
                          {rec.prescribed_actives.map((act, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200">
                              {act}
                            </span>
                          ))}
                        </div>
                      )}

                      {rec.recommended_products?.length > 0 && (
                        <div className="text-[11px] text-gray-700 pt-1">
                          <span className="font-bold text-gray-500 text-[10px]">Products: </span>
                          {rec.recommended_products.map((p, i) => (
                            <span key={i} className="font-semibold text-gray-800">
                              {p.name}{i < rec.recommended_products.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Clinical Inquiry Form */}
            <div className="p-5 rounded-2xl bg-[#f8faf9] border border-[#dce8e1] space-y-3">
              <div className="flex items-center gap-2">
                <Send size={15} className="text-emerald-700" />
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Send Inquiry / Request Review from {activeConsultationProf.professional?.name}
                </h4>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Describe symptoms, ask questions regarding active ingredient tolerance, or request routine modifications. Your doctor will review your longitudinal assessment telemetry and respond.
              </p>

              <form onSubmit={handleSendInquiry} className="space-y-3">
                <input
                  type="text"
                  placeholder="Subject / Topic (e.g. Mild flaking after evening retinol step)"
                  value={inquiryTitle}
                  onChange={(e) => setInquiryTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
                <textarea
                  placeholder="Clinical question, observed skin reaction, or product feedback..."
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400">
                    Transmitted securely via authenticated clinical gateway.
                  </span>
                  <button
                    type="submit"
                    disabled={submittingInquiry || !inquiryTitle.trim() || !inquiryMessage.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#142e23] hover:bg-[#0c1f17] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    <Send size={12} />
                    {submittingInquiry ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </div>
              </form>
            </div>

            {/* Close footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveConsultationProf(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Hub
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MyConnections;
