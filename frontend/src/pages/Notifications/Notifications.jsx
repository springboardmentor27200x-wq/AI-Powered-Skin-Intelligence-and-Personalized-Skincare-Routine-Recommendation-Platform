import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Calendar,
  Droplet,
  Moon,
  TrendingUp,
  Package,
  Settings,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  Shield,
  Laptop,
} from 'lucide-react';
import { notificationService, browserNotification } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'ROUTINE', label: 'Routines', icon: Calendar },
  { key: 'HYDRATION', label: 'Hydration', icon: Droplet },
  { key: 'SLEEP', label: 'Sleep', icon: Moon },
  { key: 'PROGRESS', label: 'Progress', icon: TrendingUp },
  { key: 'REPLENISHMENT', label: 'Replenishment', icon: Package },
  { key: 'PLATFORM', label: 'System', icon: Shield },
];

export default function Notifications() {
  const { user } = useAuth();
  const isDermatologist = user?.role === 'DERMATOLOGIST';
  const isConsultant = user?.role === 'SKINCARE_CONSULTANT';
  const isAdmin = user?.role === 'ADMINISTRATOR';
  const isProfessional = isDermatologist || isConsultant || isAdmin;

  const categories = isProfessional
    ? [
        { key: 'ALL', label: 'All Alerts' },
        {
          key: 'PLATFORM',
          label: isDermatologist
            ? 'Clinical Cases & Referrals'
            : isConsultant
            ? 'Client Requests & Messages'
            : 'System Alerts',
          icon: Shield,
        },
      ]
    : DEFAULT_CATEGORIES;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(() => browserNotification.getPermission());
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    routine_reminders: true,
    hydration_reminders: true,
    sleep_reminders: true,
    product_replenishment: true,
    progress_alerts: true,
    platform_announcements: true,
    morning_time: '07:00',
    evening_time: '21:00',
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSavedMsg, setPrefSavedMsg] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const catParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const res = await notificationService.getNotifications({
        category: catParam,
        unread_only: unreadOnly,
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, unreadOnly]);

  const loadPreferences = async () => {
    try {
      const res = await notificationService.getPreferences();
      if (res.data) setPreferences(res.data);
    } catch (e) {
      console.error('Failed to load notification preferences:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  const handleSyncReminders = async () => {
    setSyncing(true);
    try {
      const res = await notificationService.triggerSync();
      await loadNotifications();
      const count = res.data?.generated ?? 0;
      if (count > 0 && browserPermission === 'granted') {
        const title = isProfessional ? 'DermaIQ Clinical Alerts' : 'DermaIQ Care Reminders';
        const body = isProfessional
          ? `${count} updated clinical alert${count > 1 ? 's' : ''} (patient cases/referrals/messages) synced.`
          : `${count} new routine or hydration reminder${count > 1 ? 's' : ''} generated for you.`;
        browserNotification.show(title, { body });
      }
    } catch (e) {
      console.error('Failed to sync alerts:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleRequestBrowserPermission = async () => {
    const perm = await browserNotification.requestPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      browserNotification.show('DermaIQ Desktop Notifications Enabled', {
        body: 'You will now receive desktop alerts for morning & evening steps and hydration goals!',
      });
    }
  };

  const handleTestBrowserNotification = () => {
    browserNotification.show('DermaIQ Test Alert', {
      body: 'Browser push notifications are working smoothly on this device!',
    });
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefSavedMsg('');
    try {
      const res = await notificationService.updatePreferences(preferences);
      setPreferences(res.data);
      setPrefSavedMsg('Preferences saved successfully!');
      setTimeout(() => setPrefSavedMsg(''), 3000);
    } catch (e) {
      console.error('Failed to update preferences:', e);
    } finally {
      setSavingPrefs(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'ROUTINE': return <Calendar size={18} className="text-[#8b7355]" />;
      case 'HYDRATION': return <Droplet size={18} className="text-cyan-500" />;
      case 'SLEEP': return <Moon size={18} className="text-purple-500" />;
      case 'PROGRESS': return <TrendingUp size={18} className="text-emerald-500" />;
      case 'REPLENISHMENT': return <Package size={18} className="text-amber-500" />;
      default: return <Sparkles size={18} className="text-[#8b7355]" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#fafaf6] pb-16">
      {/* Header Banner */}
      <div className="bg-white border-b border-[#e8e4dc] px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f5f0e8] border border-[#d4cabb] flex items-center justify-center text-[#8b7355]">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#2c2417]">Notification Center</h1>
                {unreadCount > 0 && (
                  <span className="bg-[#8b7355] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8b7355]">
                {isProfessional
                  ? 'Patient triage, connection requests, colleague referrals, and clinical messaging'
                  : 'Real-time routine reminders, hydration targets, and care team alerts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncReminders}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-[#d4cabb] text-[#2c2417] hover:bg-[#f5f0e8] transition-all disabled:opacity-50"
              title={isProfessional ? 'Sync pending patient cases and referrals' : 'Sync routine and hydration reminders'}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin text-[#8b7355]' : ''} />
              <span>{syncing ? 'Syncing...' : isProfessional ? 'Sync Clinical Alerts' : 'Sync Reminders'}</span>
            </button>
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                showPreferences
                  ? 'bg-[#8b7355] text-white border-[#8b7355]'
                  : 'bg-white border-[#d4cabb] text-[#8b7355] hover:bg-[#f5f0e8]'
              }`}
            >
              <Settings size={14} /> Preferences
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-[#d4cabb] text-[#2c2417] hover:bg-[#f5f0e8] transition-all"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Notification Preferences Drawer */}
        {showPreferences && (
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-[#f0ede8] pb-3">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[#8b7355]" />
                <h2 className="text-sm font-bold text-[#2c2417] uppercase tracking-wider">Reminder Preferences</h2>
              </div>
              <span className="text-xs text-[#8b7355]">Configured per clinical protocol</span>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(isProfessional
                  ? [
                      {
                        key: 'platform_announcements',
                        label: isDermatologist
                          ? 'Clinical Cases & Referral Alerts'
                          : isConsultant
                          ? 'Client Request & Message Alerts'
                          : 'Administrative System Alerts',
                        desc: 'Real-time notifications for patient connection requests, colleague referrals, and clinical messages',
                      },
                    ]
                  : [
                      { key: 'routine_reminders', label: 'Daily Routine Reminders', desc: 'Morning & evening step reminders' },
                      { key: 'hydration_reminders', label: 'Hydration Reminders', desc: 'Water intake logging prompts' },
                      { key: 'sleep_reminders', label: 'Sleep Quality Reminders', desc: 'Evening rest and recovery alerts' },
                      { key: 'product_replenishment', label: 'Product Depletion Alerts', desc: 'Predicted refill timing notifications' },
                      { key: 'progress_alerts', label: 'Score & Progress Updates', desc: 'Skin health trajectory changes' },
                      { key: 'platform_announcements', label: 'Platform Announcements', desc: 'Intelligence updates and new models' },
                    ]
                ).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] hover:bg-[#f5f0e8] transition-all cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={preferences[item.key] ?? true}
                      onChange={(e) =>
                        setPreferences({ ...preferences, [item.key]: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-[#8b7355] rounded focus:ring-[#8b7355]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#2c2417]">{item.label}</p>
                      <p className="text-[11px] text-[#8b7355]">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {!isProfessional && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#8b7355] mb-1">Morning Routine Reminder Time</label>
                    <input
                      type="time"
                      value={preferences.morning_time || '07:00'}
                      onChange={(e) => setPreferences({ ...preferences, morning_time: e.target.value })}
                      className="w-full text-xs font-medium border border-[#d4cabb] rounded-lg p-2.5 bg-white text-[#2c2417] focus:outline-none focus:ring-2 focus:ring-[#8b7355]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#8b7355] mb-1">Evening Routine Reminder Time</label>
                    <input
                      type="time"
                      value={preferences.evening_time || '21:00'}
                      onChange={(e) => setPreferences({ ...preferences, evening_time: e.target.value })}
                      className="w-full text-xs font-medium border border-[#d4cabb] rounded-lg p-2.5 bg-white text-[#2c2417] focus:outline-none focus:ring-2 focus:ring-[#8b7355]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#f0ede8]">
                {prefSavedMsg ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> {prefSavedMsg}
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="bg-[#8b7355] hover:bg-[#745f44] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  {savingPrefs ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Browser & Desktop Notifications Banner */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              browserPermission === 'granted'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : browserPermission === 'denied'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <Laptop size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2c2417]">
                {browserPermission === 'granted'
                  ? 'Desktop & Browser Notifications Enabled'
                  : browserPermission === 'denied'
                  ? 'Browser Notifications Blocked'
                  : 'Enable Desktop & Browser Notifications'}
              </p>
              <p className="text-[11px] text-[#8b7355] mt-0.5">
                {browserPermission === 'granted'
                  ? isProfessional
                    ? 'You will receive real-time desktop popups for incoming patient connection requests and clinical messages.'
                    : 'You will receive real-time desktop popups for skincare routines and hydration targets.'
                  : browserPermission === 'denied'
                  ? 'Notifications are blocked in your browser. You can re-enable them in your browser site settings.'
                  : isProfessional
                  ? 'DermaIQ currently runs in-app clinical alerts. Click below to allow your browser to show desktop push alerts.'
                  : 'DermaIQ currently runs in-app alerts. Click below to allow your browser to show desktop push alerts.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {browserPermission !== 'granted' && browserPermission !== 'unsupported' && (
              <button
                onClick={handleRequestBrowserPermission}
                className="bg-[#8b7355] hover:bg-[#745f44] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
              >
                Allow Browser Notifications
              </button>
            )}
            {browserPermission === 'granted' && (
              <button
                onClick={handleTestBrowserNotification}
                className="bg-[#f5f0e8] hover:bg-[#ebdcc9] text-[#6b583f] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#d4cabb] transition-colors"
              >
                Send Test Alert
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-[#8b7355] text-white shadow-xs'
                    : 'bg-white border border-[#e8e4dc] text-[#8b7355] hover:bg-[#f5f0e8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-[#8b7355] cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-[#8b7355] rounded"
            />
            Unread Only
          </label>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-[#e8e4dc] animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-12 text-center">
            <Bell size={36} className="text-[#8b7355] mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-bold text-[#2c2417] mb-1">
              {isProfessional ? 'No Clinical Alerts' : 'No Notifications'}
            </h3>
            <p className="text-xs text-[#8b7355] max-w-sm mx-auto">
              {unreadOnly
                ? 'You have read all your notifications.'
                : isProfessional
                ? 'You have no pending connection requests, patient referrals, or unread messages right now.'
                : 'You have no active alerts right now. Keep maintaining your daily routine!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-2xl border p-4 transition-all flex items-start gap-4 ${
                  notif.is_read
                    ? 'bg-white border-[#e8e4dc]'
                    : 'bg-[#fdfbf7] border-[#d4cabb] shadow-xs'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#faf8f5] border border-[#e8e4dc] flex items-center justify-center shrink-0">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b7355] bg-[#f5f0e8] px-2 py-0.5 rounded-md">
                        {notif.category}
                      </span>
                      {notif.priority === 'HIGH' && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                          Priority
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#b5a397] flex items-center gap-1">
                      <Clock size={11} /> {formatTimestamp(notif.created_at)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#2c2417] mb-1">{notif.title}</h4>
                  <p className="text-xs text-[#4a3e2e] leading-relaxed mb-3">{notif.message}</p>

                  <div className="flex items-center justify-between pt-1">
                    {notif.action_url ? (
                      <Link
                        to={notif.action_url}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8b7355] hover:text-[#745f44]"
                      >
                        Take action <ArrowRight size={12} />
                      </Link>
                    ) : <span />}

                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-xs text-[#8b7355] hover:underline font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
