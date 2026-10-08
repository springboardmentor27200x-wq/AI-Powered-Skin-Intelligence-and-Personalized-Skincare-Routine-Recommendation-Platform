import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { User, CheckCircle2, AlertTriangle, Mail, Shield, MapPin, Calendar, Save, Sparkles } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.profile?.name || '');
  const [ageGroup, setAgeGroup] = useState(user?.profile?.age_group || '25_34');
  const [location, setLocation] = useState(user?.profile?.location || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await apiClient.patch('/users/me', {
        name,
        age_group: ageGroup,
        location,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile information.');
    } finally {
      setSaving(false);
    }
  };

  const ageOptions = [
    { value: 'UNDER_18', label: 'Under 18' },
    { value: '18_24', label: '18 - 24' },
    { value: '25_34', label: '25 - 34' },
    { value: '35_44', label: '35 - 44' },
    { value: '45_54', label: '45 - 54' },
    { value: '55_OVER', label: '55 and Over' },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SectionHeader
        badge="Account Settings"
        title="Personal Profile"
        subtitle="Manage your personal information, demographic details, and account credentials."
      />

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[var(--radius-xl)] animate-fade-in shadow-xs">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">Your profile information has been saved successfully!</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-[var(--radius-xl)] animate-fade-in shadow-xs">
          <AlertTriangle size={20} className="text-rose-600 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-2xl)] p-6 md:p-8 shadow-[var(--shadow-sm)] space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[var(--color-border)]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-xl font-bold text-white shadow-sm flex-shrink-0">
            {user?.profile?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] truncate">
              {user?.profile?.name || 'Your Name'}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-brand-light)] text-[var(--color-brand)]">
                <Shield size={10} />
                {user?.role?.replace(/_/g, ' ') || 'USER'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-all"
                />
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                  Age Group
                </label>
                <div className="relative">
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-all appearance-none cursor-pointer"
                  >
                    {ageOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                  Location (City, Country)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, US"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] font-medium focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/15 transition-all"
                  />
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--color-surface-2)] p-4 rounded-[var(--radius-xl)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] flex-shrink-0">
                <Mail size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Account Email</p>
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] flex-shrink-0">
                <Shield size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Role Access</p>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-sm font-semibold rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
