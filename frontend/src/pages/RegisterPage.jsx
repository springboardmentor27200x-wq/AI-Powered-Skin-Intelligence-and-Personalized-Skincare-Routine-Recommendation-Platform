import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User as UserIcon, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'USER',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { notifySuccess } = useNotification();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
      notifySuccess('Account created successfully! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(', '));
      } else {
        setError('Failed to create account. Please check your information and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'USER', label: 'Standard User (Personal Skincare Tracking)' },
    { value: 'SKINCARE_CONSULTANT', label: 'Skincare Consultant (Practitioner)' },
    { value: 'DERMATOLOGIST', label: 'Dermatologist (Medical Specialist)' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Create your account
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Start building your personal skincare intelligence workspace
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          {error && <Alert type="error" className="mb-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              required
              icon={UserIcon}
              placeholder="Alex Rivera"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="alex@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />

            <Select
              label="Account Role"
              required
              options={roleOptions}
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              helperText="Administrators are provisioned separately by system policy."
            />

            <Input
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              icon={Lock}
              placeholder="Repeat your password"
              value={formData.confirm_password}
              onChange={(e) => handleChange('confirm_password', e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              icon={UserPlus}
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
