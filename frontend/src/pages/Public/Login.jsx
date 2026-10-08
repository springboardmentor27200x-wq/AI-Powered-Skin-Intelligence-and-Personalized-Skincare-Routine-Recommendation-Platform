import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { extractErrorMessage } from '../../utils/error';
import { Sparkles, Eye, EyeOff, ArrowRight, Brain, Shield, TrendingUp, AlertCircle, Wrench } from 'lucide-react';
import { Spinner } from '../../components/ui/LoadingState';
import BrandLogo from '../../components/BrandLogo';
import { useMaintenance } from '../../context/MaintenanceContext';

// ─── Brand Panel (left side on desktop) ────────────────────────────────────

const BrandPanel = () => (
  <div
    className="hidden md:flex flex-col justify-between p-12 text-white"
    style={{ backgroundColor: 'var(--color-sidebar-bg)' }}
  >
    {/* Logo */}
    <BrandLogo size="lg" dark={true} to="/" />

    {/* Features */}
    <div className="space-y-6">
      {[
        { Icon: Brain,    title: 'Neural Net Analysis',     desc: 'ConcernNet detects 10 skin concerns from your biometric profile.' },
        { Icon: Shield,   title: 'Safety-Aware Routines',   desc: 'Allergen and sensitivity constraints are never overridden by AI.'  },
        { Icon: TrendingUp, title: 'Track Your Progress',   desc: 'Monitor your skin health score across every assessment.'          },
      ].map(({ Icon, title, desc }) => (
        <div key={title} className="flex items-start gap-4">
          <div className="w-9 h-9 bg-white/10 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-[var(--color-brand)]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{desc}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Disclaimer */}
    <p className="text-[10px] text-white/25 leading-relaxed">
      AI analysis indicates concerns. Not a substitute for professional medical advice.
    </p>
  </div>
);

// ─── Login Page ─────────────────────────────────────────────────────────────

const Login = () => {
  const { login, logout } = useAuth();
  const { maintenanceMode } = useMaintenance();
  const toast = useToast();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errs = {};
    if (!email.trim())    errs.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password)        errs.password = 'Password is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setServerError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (maintenanceMode && userData?.role !== 'ADMINISTRATOR') {
        logout();
        const mErr = 'Platform is currently undergoing scheduled maintenance. Non-administrator logins are temporarily restricted. Please return once maintenance completes.';
        setServerError(mErr);
        toast.error('Maintenance mode is active. Only Administrator accounts permitted.');
        return;
      }
      toast.success('Welcome back!');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Invalid email or password. Please try again.');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Brand panel */}
      <BrandPanel />

      {/* Auth panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        {/* Mobile logo */}
        <BrandLogo size="md" to="/" className="mb-8 md:hidden" />

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-[var(--color-text-primary)] tracking-tight mb-1">
              Welcome back.
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Continue your skincare journey.</p>
          </div>

          {/* Maintenance Mode Notice */}
          {maintenanceMode && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-300 rounded-[var(--radius-lg)] px-4 py-3 mb-5" role="alert">
              <Wrench size={16} className="text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-amber-900">Maintenance Mode Active</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                  DermaIQ is undergoing scheduled maintenance. Only System Administrators can sign in at this time.
                </p>
              </div>
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-[var(--radius-lg)] px-4 py-3 mb-5" role="alert">
              <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-red-700 font-medium">{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (serverError) setServerError('');
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 bg-white border rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:border-[var(--color-brand)] ${
                  fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                }`}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Password
                </label>
                <button type="button" className="text-[10px] font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (serverError) setServerError('');
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="Your password"
                  className={`w-full px-4 py-3 pr-11 bg-white border rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:border-[var(--color-brand)] ${
                    fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  }`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-[var(--radius-lg)] transition-all shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] mt-2"
            >
              {loading ? (
                <>
                  <Spinner size={16} className="border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={14} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Create account link */}
          <p className="text-xs text-[var(--color-text-muted)] text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors"
            >
              Create account
            </Link>
          </p>

          {/* Quick Demo Credentials Picker */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2.5 text-center">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Patient', email: 'user@example.com', badge: 'USER' },
                { role: 'Consultant', email: 'consultant@example.com', badge: 'CARE' },
                { role: 'Dermatologist', email: 'dermatologist@example.com', badge: 'CLINIC' },
                { role: 'Administrator', email: 'admin@example.com', badge: 'ADMIN' },
              ].map(({ role, email: demoEmail, badge }) => (
                <button
                  key={demoEmail}
                  type="button"
                  onClick={() => {
                    setEmail(demoEmail);
                    setPassword('password123');
                    setServerError('');
                    setFieldErrors({});
                  }}
                  className="flex flex-col items-start p-2.5 rounded-[var(--radius-md)] bg-white border border-[var(--color-border)] hover:border-[var(--color-brand)] hover:bg-[#fafaf6] text-left transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)]">
                      {role}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 group-hover:bg-[#d8eee2] group-hover:text-[#1c5540]">
                      {badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-full font-mono mt-0.5">
                    {demoEmail}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] text-center mt-2.5">
              Default password: <code className="font-bold text-[var(--color-text-secondary)]">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
