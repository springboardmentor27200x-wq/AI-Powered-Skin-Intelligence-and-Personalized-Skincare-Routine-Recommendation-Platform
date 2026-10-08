import React, { useState, useEffect } from 'react';
import { 
  Users, Stethoscope, Search, MapPin, Sparkles, 
  CheckCircle2, Clock, ShieldCheck, UserCheck, AlertCircle, X
} from 'lucide-react';
import { professionalsService } from '../services/professionals';
import { connectionsService } from '../services/connections';
import { useToast } from '../components/Toast';

const FindProfessional = () => {
  const toast = useToast();
  const [professionals, setProfessionals] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, SKINCARE_CONSULTANT, DERMATOLOGIST
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedProf, setSelectedProf] = useState(null);
  const [connectingId, setConnectingId] = useState(null);

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const roleFilter = activeTab === 'ALL' ? null : activeTab;
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (locationQuery.trim()) params.location = locationQuery.trim();

      const [profsData, connsData] = await Promise.all([
        professionalsService.getProfessionals(params),
        connectionsService.getMyConnections().catch(() => [])
      ]);

      setProfessionals(profsData);
      setMyConnections(connsData);
    } catch (err) {
      console.error('Failed to load professionals directory:', err);
      setError('Unable to load professionals directory. Please try again.');
      toast.error('Failed to fetch professionals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDirectory();
    }, 250);
    return () => clearTimeout(timer);
  }, [activeTab, searchQuery, locationQuery]);

  const getConnectionStatus = (profId) => {
    const conn = myConnections.find(
      c => c.professional_id === profId && (c.status === 'PENDING' || c.status === 'ACCEPTED')
    );
    return conn ? conn.status : null;
  };

  const handleConnect = async (prof) => {
    try {
      setConnectingId(prof.id);
      await connectionsService.createConnection(prof.id);
      toast.success(`Connection request sent to ${prof.name}!`);
      // Refresh connection statuses
      const updatedConns = await connectionsService.getMyConnections();
      setMyConnections(updatedConns);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to send connection request.';
      toast.error(msg);
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ═══ HEADER BAR ═══ */}
      <div className="bg-gradient-to-r from-[#1b3d30] to-[#285745] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200 border border-white/10">
              <Sparkles size={14} /> Professional Directory
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Find a Skincare Consultant or Dermatologist
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-2xl font-normal leading-relaxed">
              Discover certified skincare advisors and clinical dermatologists. Send a connection request to securely share your skin profile and wellness logs for personalized routine reviews.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ CONTROLS & FILTER BAR ═══ */}
      <div className="bg-white rounded-3xl border border-[#dce8e1] p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Role Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#f4f8f5] rounded-2xl border border-[#dce8e1] w-fit">
            {[
              { key: 'ALL', label: 'All Professionals', icon: Users },
              { key: 'SKINCARE_CONSULTANT', label: 'Consultants', icon: Sparkles },
              { key: 'DERMATOLOGIST', label: 'Dermatologists', icon: Stethoscope },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#214336] text-white shadow-md'
                    : 'text-[#3d5c4f] hover:text-[#18392d] hover:bg-white/60'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Inputs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#f8faf9] border border-[#dce8e1] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#214336]"
              />
            </div>

            <div className="relative w-full sm:w-56">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Filter by city/state..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#f8faf9] border border-[#dce8e1] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#214336]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ DIRECTORY RESULTS ═══ */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-3">
          <div className="h-8 w-8 border-3 border-[#214336] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Searching directory...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl space-y-3">
          <AlertCircle size={28} className="text-rose-600 mx-auto" />
          <p className="text-sm font-bold text-rose-800">{error}</p>
          <button 
            onClick={fetchDirectory} 
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : professionals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#dce8e1] space-y-3">
          <Users size={36} className="text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No professionals found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search query, location filter, or switching between role tabs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((prof) => {
            const isDerm = prof.role === 'DERMATOLOGIST';
            const connStatus = getConnectionStatus(prof.id);
            const isConnecting = connectingId === prof.id;

            return (
              <div 
                key={prof.id}
                className="p-6 rounded-3xl bg-white border border-[#dce8e1] shadow-[0_4px_20px_rgba(20,40,32,0.04)] hover:shadow-lg hover:border-[#a8cebe] transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Role Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-3 rounded-2xl ${
                      isDerm 
                        ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {isDerm ? <Stethoscope size={22} /> : <Sparkles size={22} />}
                    </div>

                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                      isDerm 
                        ? 'bg-cyan-50 text-cyan-800 border-cyan-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {isDerm ? 'Dermatologist' : 'Skincare Consultant'}
                    </span>
                  </div>

                  {/* Profile Header */}
                  <div>
                    <h3 className="text-lg font-bold text-[#142e23]">{prof.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">{prof.email}</p>
                  </div>

                  {/* Location Info */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{prof.location || 'Location not specified'}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProf(prof)}
                    className="flex-1 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    View Profile
                  </button>

                  {connStatus === 'ACCEPTED' ? (
                    <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
                      <CheckCircle2 size={14} /> Connected
                    </span>
                  ) : connStatus === 'PENDING' ? (
                    <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-200">
                      <Clock size={14} /> Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(prof)}
                      disabled={isConnecting}
                      className="flex-1 px-3 py-2.5 bg-[#214336] hover:bg-[#18352a] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isConnecting ? 'Sending...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ PUBLIC PROFILE MODAL ═══ */}
      {selectedProf && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 border border-[#dce8e1]">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  selectedProf.role === 'DERMATOLOGIST'
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {selectedProf.role === 'DERMATOLOGIST' ? <Stethoscope size={24} /> : <Sparkles size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#142e23]">{selectedProf.name}</h3>
                  <span className="text-xs font-bold text-gray-500">
                    {selectedProf.role === 'DERMATOLOGIST' ? 'Clinical Dermatologist' : 'Licensed Skincare Consultant'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProf(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="p-3 bg-[#f8faf9] rounded-xl border border-gray-100">
                <span className="font-bold text-gray-400 block uppercase tracking-wider text-[10px]">Email Address</span>
                <span className="font-semibold text-gray-800 text-sm mt-0.5 block">{selectedProf.email}</span>
              </div>
              <div className="p-3 bg-[#f8faf9] rounded-xl border border-gray-100">
                <span className="font-bold text-gray-400 block uppercase tracking-wider text-[10px]">Location</span>
                <span className="font-semibold text-gray-800 text-sm mt-0.5 block">{selectedProf.location || 'Global Remote'}</span>
              </div>
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-emerald-800">
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Connecting allows this professional to view your skin type, logged concerns, and hydration/sleep averages in read-only mode to provide tailored recommendations.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setSelectedProf(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              {getConnectionStatus(selectedProf.id) === 'ACCEPTED' ? (
                <span className="px-4 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs border border-emerald-200">
                  Already Connected
                </span>
              ) : getConnectionStatus(selectedProf.id) === 'PENDING' ? (
                <span className="px-4 py-2.5 bg-amber-50 text-amber-700 font-bold rounded-xl text-xs border border-amber-200">
                  Request Pending
                </span>
              ) : (
                <button
                  onClick={() => {
                    handleConnect(selectedProf);
                    setSelectedProf(null);
                  }}
                  className="px-5 py-2.5 bg-[#214336] hover:bg-[#18352a] text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Send Connection Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindProfessional;
