import React, { useState } from 'react';
import { User, Lock, Save, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { authService } from '../services/authService';
import { formatRoleName } from '../utils/formatters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';

export function SettingsPage() {
  const { user, updateCurrentUser } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  // Profile Form
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const updated = await authService.updateMe(profileData);
      updateCurrentUser(updated);
      notifySuccess('Account details updated successfully!');
    } catch (err) {
      console.error('Failed to update account:', err);
      const msg = err.response?.data?.detail || 'Failed to update account details.';
      notifyError(typeof msg === 'string' ? msg : 'Error updating profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.new_password !== passwordData.confirm_new_password) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(passwordData);
      notifySuccess('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_new_password: '',
      });
    } catch (err) {
      console.error('Password change failed:', err);
      const msg = err.response?.data?.detail || 'Failed to change password. Ensure current password is correct.';
      setPasswordError(typeof msg === 'string' ? msg : 'Failed to change password.');
      notifyError('Password update failed.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <User className="w-6 h-6 text-slate-700" />
          Account & Security Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, email address, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Role & ID Card */}
        <Card className="md:col-span-1 bg-slate-900 text-white border-slate-800">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-900/40 mb-3">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <h3 className="font-bold text-lg text-white">{user?.full_name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

            <div className="mt-4">
              <Badge variant="wellness" size="md">
                {formatRoleName(user?.role)}
              </Badge>
            </div>

            <div className="w-full mt-6 pt-4 border-t border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Account ID:</span>
                <span className="font-mono text-white">#{user?.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Details */}
        <Card
          title="Account Profile"
          subtitle="Update your full name and primary email address"
          className="md:col-span-2"
        >
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              required
              icon={User}
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
            />

            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                isLoading={isUpdatingProfile}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Change Password Card */}
      <Card
        title="Security & Password"
        subtitle="Update your password to keep your skincare records safe"
      >
        {passwordError && <Alert type="error" className="mb-4">{passwordError}</Alert>}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <Input
            label="Current Password"
            type="password"
            required
            icon={Lock}
            placeholder="••••••••"
            value={passwordData.current_password}
            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
          />

          <Input
            label="New Password"
            type="password"
            required
            icon={Lock}
            placeholder="At least 6 characters"
            value={passwordData.new_password}
            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            icon={Lock}
            placeholder="Repeat new password"
            value={passwordData.confirm_new_password}
            onChange={(e) => setPasswordData({ ...passwordData, confirm_new_password: e.target.value })}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="secondary"
              icon={ShieldCheck}
              isLoading={isChangingPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
