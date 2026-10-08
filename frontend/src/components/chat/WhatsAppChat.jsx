import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, Check, CheckCheck, Clock, Users, Stethoscope, 
  Sparkles, Paperclip, ChevronRight, X, Phone, Video, MoreVertical, 
  FileText, Shield, AlertCircle, Heart, Pill, User, RefreshCw, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chatService';
import { connectionsService } from '../../services/connections';
import { professionalsService } from '../../services/professionals';
import api from '../../services/api';
import { useToast } from '../Toast';

const WhatsAppChat = ({ initialPartnerId = null }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, SPECIALISTS, CLIENTS, UNREAD
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Patient Dossier Slide-Over
  const [showDossier, setShowDossier] = useState(false);
  const [dossierData, setDossierData] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Refer Dermatologist Modal
  const [showReferModal, setShowReferModal] = useState(false);
  const [availableDermatologists, setAvailableDermatologists] = useState([]);
  const [selectedDermaId, setSelectedDermaId] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [referralPriority, setReferralPriority] = useState('HIGH_PRIORITY');
  const [submittingReferral, setSubmittingReferral] = useState(false);

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  // 1. Fetch Conversations
  const fetchConversations = async (keepSelection = true) => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);

      if (!selectedPartner || !keepSelection) {
        if (initialPartnerId) {
          const match = data.find(c => c.partner_id === initialPartnerId);
          if (match) {
            setSelectedPartner(match);
            return;
          } else {
            const stub = {
              partner_id: initialPartnerId,
              name: 'Care Circle Contact',
              care_role: 'Care Team Colleague',
              status: 'ACCEPTED',
              unread_count: 0,
            };
            setSelectedPartner(stub);
            return;
          }
        }
        if (data.length > 0) {
          setSelectedPartner(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  // 2. Fetch Messages for Selected Partner
  const fetchMessages = async (partnerId, markRead = true) => {
    if (!partnerId) return;
    try {
      const msgs = await chatService.getMessages(partnerId);
      setMessages(msgs);
      if (markRead) {
        setConversations(prev => prev.map(c => 
          c.partner_id === partnerId ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 3. Load quick suggestions
  useEffect(() => {
    fetchConversations(false);
    chatService.getSuggestions().then(setSuggestions).catch(() => {});
  }, [initialPartnerId]);

  // When selected partner changes, fetch thread
  useEffect(() => {
    if (selectedPartner) {
      setLoadingMessages(true);
      fetchMessages(selectedPartner.partner_id);

      // Setup polling every 4 seconds
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(() => {
        fetchMessages(selectedPartner.partner_id, false);
      }, 4000);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selectedPartner?.partner_id]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (textToSend = null, msgType = 'TEXT', meta = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedPartner || sending) return;

    try {
      setSending(true);
      const newMsg = await chatService.sendMessage(selectedPartner.partner_id, {
        message: text,
        message_type: msgType,
        meta_data: meta,
      });

      setMessages(prev => [...prev, newMsg]);
      setInputText('');

      // Update conversation last message in list
      setConversations(prev => prev.map(c => {
        if (c.partner_id === selectedPartner.partner_id) {
          return {
            ...c,
            last_message: text,
            last_message_at: newMsg.created_at,
            last_message_sender_id: user?.id,
          };
        }
        return c;
      }));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Inspect Patient Dossier
  const handleOpenDossier = async () => {
    if (!selectedPartner) return;
    try {
      setLoadingDossier(true);
      setShowDossier(true);
      // If user is consultant or dermatologist, fetch client details
      const detailEndpoint = user?.role === 'DERMATOLOGIST' 
        ? `/dermatologist/patients/${selectedPartner.partner_id}`
        : `/consultant/clients/${selectedPartner.partner_id}`;

      const res = await api.get(detailEndpoint);
      setDossierData(res.data);
    } catch (err) {
      console.error('Failed to load dossier:', err);
      toast.error('Could not load clinical chart for this contact.');
    } finally {
      setLoadingDossier(false);
    }
  };

  // Open Refer to Dermatologist Modal
  const handleOpenReferModal = async () => {
    try {
      setShowReferModal(true);
      const dermas = await professionalsService.getProfessionals({ role: 'DERMATOLOGIST' });
      setAvailableDermatologists(dermas);
      if (dermas.length > 0) setSelectedDermaId(dermas[0].id);
    } catch (err) {
      toast.error('Failed to load available dermatologists.');
    }
  };

  // Submit Referral
  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    if (!selectedPartner || !selectedDermaId || !referralNotes.trim()) return;

    try {
      setSubmittingReferral(true);
      await connectionsService.referDermatologist(
        selectedPartner.partner_id,
        selectedDermaId,
        referralNotes.trim(),
        referralPriority
      );
      toast.success('Dermatologist referred successfully! Both are now in the Care Circle.');
      setShowReferModal(false);
      setReferralNotes('');
      fetchMessages(selectedPartner.partner_id);
      fetchConversations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Referral failed.');
    } finally {
      setSubmittingReferral(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const pName = (c.partner_name || '').toLowerCase();
    const cRole = (c.care_team_role || '').toLowerCase();
    const lMsg = (c.last_message || '').toLowerCase();
    const sTerm = (searchTerm || '').trim().toLowerCase();

    const matchesSearch = !sTerm || pName.includes(sTerm) || cRole.includes(sTerm) || lMsg.includes(sTerm);

    if (!matchesSearch) return false;

    if (activeFilter === 'SPECIALISTS') {
      return c.partner_role === 'DERMATOLOGIST' || c.partner_role === 'SKINCARE_CONSULTANT';
    }
    if (activeFilter === 'CLIENTS') {
      return c.partner_role === 'USER';
    }
    if (activeFilter === 'UNREAD') {
      return (c.unread_count || 0) > 0;
    }
    return true;
  });

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'DERMATOLOGIST':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SKINCARE_CONSULTANT':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getRoleShortLabel = (role) => {
    switch (role) {
      case 'DERMATOLOGIST':
        return 'Doctor';
      case 'SKINCARE_CONSULTANT':
        return 'Consultant';
      default:
        return 'Client';
    }
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-3xl overflow-hidden border border-[#d6e5e8] shadow-2xl bg-white max-w-7xl mx-auto">
      
      {/* ═══════════════════════════════════════════════════════════
          LEFT SIDEBAR: WHATSAPP CONVERSATIONS LIST
      ══════════════════════════════════════════════════════════════ */}
      <div className="w-full sm:w-80 md:w-96 flex flex-col border-r border-[#e9edef] bg-[#ffffff] flex-shrink-0">
        
        {/* WhatsApp Top Profile Header */}
        <div className="p-4 bg-[#f0f2f5] border-b border-[#e9edef] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#008069] flex items-center justify-center text-white font-black text-sm shadow-sm ring-2 ring-emerald-200">
              {user?.profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#111b21] leading-tight">
                {user?.profile?.name || 'My Profile'}
              </h2>
              <span className="text-[11px] font-semibold text-[#008069] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Care Circle Active
              </span>
            </div>
          </div>

          <button
            onClick={() => fetchConversations()}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
            title="Refresh conversations"
          >
            <RefreshCw size={17} className={loadingConvs ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* WhatsApp Search Bar */}
        <div className="p-3 bg-white border-b border-[#f0f2f5]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search or start new chat..."
              className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#008069] text-gray-800 placeholder-gray-500 font-medium"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
            {['ALL', 'SPECIALISTS', 'CLIENTS', 'UNREAD'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all whitespace-nowrap ${
                  activeFilter === f
                    ? 'bg-[#008069] text-white shadow-xs'
                    : 'bg-[#f0f2f5] text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f5f6f6]">
          {loadingConvs ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-[#008069] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400 font-medium">Syncing Care Circle channels...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Users size={32} className="text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-600">No conversations found.</p>
              <p className="text-[11px] text-gray-400">
                Connect with clients or specialists in your care circle to start chatting.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedPartner?.partner_id === conv.partner_id;
              return (
                <div
                  key={conv.partner_id}
                  onClick={() => setSelectedPartner(conv)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all hover:bg-[#f5f6f6] ${
                    isSelected ? 'bg-[#f0f2f5] border-l-4 border-[#008069]' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-base shadow-sm ${
                      conv.partner_role === 'DERMATOLOGIST' 
                        ? 'bg-blue-600' 
                        : conv.partner_role === 'SKINCARE_CONSULTANT' 
                        ? 'bg-teal-700' 
                        : 'bg-emerald-600'
                    }`}>
                      {conv.partner_name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-[#111b21] truncate">
                        {conv.partner_name}
                      </h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-1 font-medium">
                        {conv.last_message_at ? formatMessageTime(conv.last_message_at) : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                        {conv.last_message_sender_id === user?.id && (
                          <CheckCheck size={14} className="text-[#53bdeb] flex-shrink-0" />
                        )}
                        <span>{conv.last_message || 'No messages yet'}</span>
                      </p>

                      {conv.unread_count > 0 && (
                        <span className="ml-2 w-5 h-5 rounded-full bg-[#25d366] text-white font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    {/* Role & Provenance pill */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(conv.partner_role)}`}>
                        {getRoleShortLabel(conv.partner_role)}
                      </span>
                      {conv.connection_status === 'PENDING' && (
                        <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">
                          Pending
                        </span>
                      )}
                      {conv.referred_by_name && (
                        <span className="text-[9px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[130px]">
                          Ref: {conv.referred_by_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT MAIN PANE: WHATSAPP ACTIVE CHAT ROOM
      ══════════════════════════════════════════════════════════════ */}
      {selectedPartner ? (
        <div className="flex-1 flex flex-col bg-[#efeae2] relative min-w-0">
          
          {/* WhatsApp Chat Top Header */}
          <div className="px-5 py-3.5 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center justify-between flex-shrink-0 shadow-xs z-10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow-sm ${
                  selectedPartner.partner_role === 'DERMATOLOGIST' 
                    ? 'bg-blue-600' 
                    : selectedPartner.partner_role === 'SKINCARE_CONSULTANT' 
                    ? 'bg-teal-700' 
                    : 'bg-emerald-600'
                }`}>
                  {selectedPartner.partner_name?.[0]?.toUpperCase() || 'P'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#111b21] truncate">
                    {selectedPartner.partner_name}
                  </h3>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(selectedPartner.partner_role)}`}>
                    {selectedPartner.care_team_role}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {selectedPartner.partner_location ? `${selectedPartner.partner_location} • ` : ''}Active now
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Consultant or Dermatologist can inspect client dossier */}
              {user?.role !== 'USER' && selectedPartner.partner_role === 'USER' && (
                <button
                  onClick={handleOpenDossier}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-[#111b21] text-xs font-bold border border-gray-200 shadow-xs transition-colors cursor-pointer"
                  title="Inspect Skin Profile & 5 Pillars"
                >
                  <FileText size={14} className="text-[#008069]" />
                  <span className="hidden sm:inline">Clinical Chart</span>
                </button>
              )}

              {/* Consultant can refer Dermatologist to this client */}
              {user?.role === 'SKINCARE_CONSULTANT' && selectedPartner.partner_role === 'USER' && (
                <button
                  onClick={handleOpenReferModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Refer a Dermatologist to this client"
                >
                  <Stethoscope size={14} />
                  <span className="hidden md:inline">Refer Doctor</span>
                </button>
              )}
            </div>
          </div>

          {/* WhatsApp Wallpaper Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3"
            style={{
              backgroundImage: `radial-gradient(#cfd8dc 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          >
            {/* Care Circle Introductory Pill */}
            <div className="text-center my-3">
              <span className="px-3.5 py-1.5 rounded-xl bg-white/90 text-gray-600 text-[11px] font-semibold shadow-xs border border-gray-200/80 inline-flex items-center gap-1.5">
                <Shield size={12} className="text-[#008069]" />
                Messages are end-to-end encrypted within your authorized DermaIQ Care Circle
              </span>
            </div>

            {loadingMessages ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <div className="w-6 h-6 border-2 border-[#008069] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading conversation thread...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center bg-white/70 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 max-w-md mx-auto space-y-2 mt-8">
                <MessageSquare size={32} className="text-[#008069] mx-auto opacity-70" />
                <h4 className="text-sm font-bold text-gray-800">Say Hello to {selectedPartner.partner_name}!</h4>
                <p className="text-xs text-gray-500">
                  Ask clinical questions, review prescribed actives, or report routine progress.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} transition-all`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-xs relative text-xs leading-relaxed ${
                        isMine
                          ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                          : 'bg-white text-[#111b21] rounded-tl-none border border-gray-100'
                      }`}
                    >
                      {/* Clinical Referral Card Preview */}
                      {msg.message_type === 'REFERRAL' && (
                        <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-950 space-y-1">
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span className="flex items-center gap-1">
                              <Stethoscope size={13} className="text-purple-700" /> Clinical Care Circle Referral
                            </span>
                            {msg.meta_data?.priority && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] bg-purple-700 text-white font-extrabold uppercase">
                                {msg.meta_data.priority}
                              </span>
                            )}
                          </div>
                          {msg.meta_data?.referral_notes && (
                            <p className="text-[11px] italic text-purple-900 bg-white/70 p-2 rounded-lg">
                              "{msg.meta_data.referral_notes}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Main Message Content */}
                      <p className="whitespace-pre-wrap font-normal">{msg.message}</p>

                      {/* Message Footer: Time + Double Ticks */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400 select-none">
                        <span>{formatMessageTime(msg.created_at)}</span>
                        {isMine && (
                          msg.is_read ? (
                            <CheckCheck size={14} className="text-[#53bdeb]" title="Read" />
                          ) : (
                            <CheckCheck size={14} className="text-gray-400" title="Delivered" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp Quick Response Chips */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2 bg-[#f0f2f5] border-t border-[#e9edef] flex items-center gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
              <span className="text-[10px] font-extrabold text-[#008069] uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                <Sparkles size={11} /> Quick Suggest:
              </span>
              {suggestions.map((sug) => (
                <button
                  key={sug.id}
                  onClick={() => setInputText(sug.text)}
                  className="px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-[11px] font-semibold text-gray-700 border border-gray-200 transition-colors whitespace-nowrap shadow-2xs hover:border-[#008069] cursor-pointer"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          )}

          {/* WhatsApp Composer Bottom Bar */}
          <div className="p-3 bg-[#f0f2f5] border-t border-[#d1d7db] flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => {
                if (user?.role !== 'USER') handleOpenDossier();
                else toast.info('You can ask your care team any question below.');
              }}
              className="p-2.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
              title="Attach clinical note or photo"
            >
              <Paperclip size={18} />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex-1 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 py-2.5 px-4 bg-white rounded-2xl text-xs text-gray-800 placeholder-gray-500 focus:outline-none shadow-xs border border-gray-200 font-medium"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="w-10 h-10 rounded-full bg-[#008069] hover:bg-[#00705c] disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-md cursor-pointer flex-shrink-0 hover:scale-105 active:scale-95"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* Empty Right Pane when no conversation selected */
        <div className="flex-1 hidden sm:flex flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#e9edef] flex items-center justify-center text-gray-400">
            <MessageSquare size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-[#111b21]">DermaIQ Care Circle Messenger</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Select a client, skincare consultant, or clinical dermatologist from the left sidebar to start coordinating personalized care.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SLIDE-OVER: PATIENT CLINICAL DOSSIER
      ══════════════════════════════════════════════════════════════ */}
      {showDossier && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="text-[#008069]" size={18} />
                  <h3 className="text-base font-extrabold text-gray-900">Patient Clinical Chart</h3>
                </div>
                <button
                  onClick={() => setShowDossier(false)}
                  className="p-1 rounded-xl hover:bg-gray-100 text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {loadingDossier ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading patient metrics...</div>
              ) : dossierData ? (
                <div className="space-y-4 text-xs">
                  {/* Basic info */}
                  <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-1">
                    <h4 className="font-extrabold text-sm text-teal-950">{dossierData.name}</h4>
                    <p className="text-gray-500">{dossierData.email} • {dossierData.location || 'Location unrecorded'}</p>
                    <p className="text-teal-800 font-bold mt-1">Skin Type: {dossierData.skin_profile?.skin_type || 'Unspecified'}</p>
                  </div>

                  {/* 5-Pillar Scores */}
                  {dossierData.latest_assessment && (
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span>DermaIQ Health Index</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#008069] text-white">
                          {dossierData.latest_assessment.overall_score}/100
                        </span>
                      </div>
                      {dossierData.latest_assessment.scores && (
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-gray-100">
                            Condition: {dossierData.latest_assessment.scores.skin_condition_score}%
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-gray-100">
                            Hydration: {dossierData.latest_assessment.scores.hydration_score}%
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-gray-100">
                            Lifestyle: {dossierData.latest_assessment.scores.lifestyle_score}%
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-gray-100">
                            Sleep: {dossierData.latest_assessment.scores.sleep_score}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Routine */}
                  {dossierData.active_routine && (
                    <div className="p-4 rounded-2xl bg-[#f8faf9] border border-[#dce8e1] space-y-2">
                      <h5 className="font-extrabold text-gray-800 uppercase text-[10px] tracking-wider">
                        Active Routine (v{dossierData.active_routine.version})
                      </h5>
                      <p className="text-gray-600">Adherence Score: {dossierData.active_routine.adherence_score}%</p>
                      {dossierData.active_routine.morning?.steps?.length > 0 && (
                        <div className="mt-1">
                          <span className="font-bold text-amber-700 block">Morning:</span>
                          <span className="text-gray-500">
                            {dossierData.active_routine.morning.steps.map(s => s.title).join(' → ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collaborating Professionals */}
                  {dossierData.collaborating_professionals?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                      <h5 className="font-extrabold text-purple-900 uppercase text-[10px] tracking-wider">
                        Co-Managing Care Team
                      </h5>
                      {dossierData.collaborating_professionals.map((cp, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-gray-800">{cp.name}</span>
                          <span className="text-purple-700 font-semibold">{cp.care_role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <button
              onClick={() => setShowDossier(false)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
            >
              Close Chart
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: REFER TO DERMATOLOGIST
      ══════════════════════════════════════════════════════════════ */}
      {showReferModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="text-teal-700" size={18} />
                <h3 className="text-base font-extrabold text-gray-900">Refer Patient to Dermatologist</h3>
              </div>
              <button onClick={() => setShowReferModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Connect <strong>{selectedPartner?.partner_name}</strong> directly with a licensed Dermatologist. Both of you will be linked in the Care Circle simultaneously.
            </p>

            <form onSubmit={handleSubmitReferral} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Select Verified Dermatologist
                </label>
                <select
                  value={selectedDermaId}
                  onChange={(e) => setSelectedDermaId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-700"
                  required
                >
                  {availableDermatologists.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name} {d.location ? `(${d.location})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Referral Priority
                </label>
                <select
                  value={referralPriority}
                  onChange={(e) => setReferralPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="ROUTINE">Routine Consultation</option>
                  <option value="HIGH_PRIORITY">High Priority (Active Flare-Up)</option>
                  <option value="URGENT">Urgent (Severe Reaction)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Clinical Rationale / Notes for Doctor
                </label>
                <textarea
                  rows={3}
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="e.g. Persistent cystic breakouts on cheeks, poor response to OTC salicylic acid. Recommend prescription evaluation."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-700"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReferModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReferral || !referralNotes.trim()}
                  className="flex-1 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  {submittingReferral ? 'Connecting...' : 'Confirm Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WhatsAppChat;
