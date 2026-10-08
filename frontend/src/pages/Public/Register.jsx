import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { extractErrorMessage } from '../../utils/error';
import { Sparkles, Eye, EyeOff, ArrowRight, User, Stethoscope, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Spinner } from '../../components/ui/LoadingState';
import BrandLogo from '../../components/BrandLogo';

// ─── Role options ───────────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'USER',
    label: 'User / Patient',
    badge: 'Individual',
    Icon: User,
    desc: 'Track your skin health, get personalized routines, and connect with professionals.',
  },
  {
    id: 'SKINCARE_CONSULTANT',
    label: 'Skincare Consultant',
    badge: 'Advisor',
    Icon: Sparkles,
    desc: 'Receive client requests, review routine adherence, and guide personalized regimens.',
  },
  {
    id: 'DERMATOLOGIST',
    label: 'Dermatologist',
    badge: 'Medical',
    Icon: Stethoscope,
    desc: 'Clinical workspace to evaluate authorized patient cases and provide guidance.',
  },
];

// ─── Brand panel (reused from Login) ───────────────────────────────────────

const BrandPanel = () => (
  <div
    className="hidden md:flex flex-col justify-between p-12 text-white flex-shrink-0"
    style={{ backgroundColor: 'var(--color-sidebar-bg)', minWidth: 340, maxWidth: 380 }}
  >
    <BrandLogo size="lg" dark={true} to="/" />

    <div className="space-y-5">
      <p className="text-xl font-black leading-tight">
        Your skin journey<br />starts here.
      </p>
      <p className="text-sm text-white/50 leading-relaxed">
        Create your account to get a personalized skin assessment, track your progress, and build a safety-aware skincare routine.
      </p>
      <div className="space-y-2">
        {[
          'Free skin health assessment',
          'Personalized routine generation',
          'Progress tracking over time',
          'Safety-aware recommendations',
        ].map(f => (
          <div key={f} className="flex items-center gap-2.5">
            <CheckCircle2 size={13} className="text-[var(--color-brand)]" aria-hidden="true" />
            <span className="text-xs text-white/60">{f}</span>
          </div>
        ))}
      </div>
    </div>

    <p className="text-[10px] text-white/20">Not medical advice. Always consult a professional.</p>
  </div>
);

// ─── Register ───────────────────────────────────────────────────────────────

const Register = () => {
  const { register: doRegister } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role')?.toUpperCase();
  const validRole = ['USER', 'SKINCARE_CONSULTANT', 'DERMATOLOGIST'].includes(initialRole)
    ? initialRole
    : 'USER';

  const [selectedRole, setSelectedRole] = useState(validRole);
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPwd, setConfirmPwd]     = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [serverError, setServerError]   = useState('');

  const validate = () => {
    const errs = {};
    if (!fullName.trim())                    errs.fullName = 'Full name is required.';
    if (!email.trim())                       errs.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email))   errs.email    = 'Enter a valid email address.';
    if (!password)                           errs.password = 'Password is required.';
    else if (password.length < 8)            errs.password = 'Password must be at least 8 characters.';
    if (password !== confirmPwd)             errs.confirmPwd = 'Passwords do not match.';
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
      await doRegister(email, password, confirmPwd, fullName, selectedRole);
      toast.success('Account created successfully! Welcome to DermaIQ.');
      navigate('/onboarding');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Registration failed. Please try again.');
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete, rightEl }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full px-4 py-3 ${rightEl ? 'pr-11' : ''} bg-white border rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:border-[var(--color-brand)] ${
            error ? 'border-red-400 bg-red-50' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {rightEl}
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );

  const PwdToggle = ({ show, onToggle, fieldId }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      aria-label={show ? `Hide ${fieldId}` : `Show ${fieldId}`}
    >
      {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
    </button>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
      <BrandPanel />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 overflow-y-auto">
        {/* Mobile logo */}
        <BrandLogo size="md" to="/" className="mb-8 md:hidden" />

        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-[var(--color-text-primary)] tracking-tight mb-1">Create account.</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Begin your personalized skincare journey.</p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-[var(--radius-lg)] px-4 py-3 mb-5" role="alert">
              <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-red-700 font-medium">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Role selector */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Account type</p>
              <div className="space-y-2">
                {ROLES.map(role => {
                  const { Icon } = role;
                  const selected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full text-left border-2 rounded-[var(--radius-xl)] p-3.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--color-brand)] ${
                        selected
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]'
                          : 'border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]'
                      }`}
                      aria-pressed={selected}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-surface-3)]'}`}>
                          <Icon size={14} className={selected ? 'text-white' : 'text-[var(--color-text-muted)]'} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${selected ? 'text-[var(--color-brand-dark)]' : 'text-[var(--color-text-primary)]'}`}>{role.label}</p>
                          <p className={`text-[10px] mt-0.5 leading-relaxed ${selected ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'}`}>{role.desc}</p>
                        </div>
                        {selected && <CheckCircle2 size={15} className="text-[var(--color-brand)] flex-shrink-0" aria-hidden="true" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field
              id="fullName" label="Full name" value={fullName}
              onChange={e => {
                setFullName(e.target.value);
                if (serverError) setServerError('');
                if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: '' }));
              }}
              placeholder="Your full name" autoComplete="name"
              error={fieldErrors.fullName}
            />

            <Field
              id="email" label="Email address" type="email" value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (serverError) setServerError('');
                if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="you@example.com" autoComplete="email"
              error={fieldErrors.email}
            />

            <Field
              id="password" label="Password" type={showPwd ? 'text' : 'password'} value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (serverError) setServerError('');
                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
              }}
              placeholder="Min. 8 characters" autoComplete="new-password"
              error={fieldErrors.password}
              rightEl={<PwdToggle show={showPwd} onToggle={() => setShowPwd(v => !v)} fieldId="password" />}
            />

            <Field
              id="confirmPwd" label="Confirm password" type={showConfirm ? 'text' : 'password'} value={confirmPwd}
              onChange={e => {
                setConfirmPwd(e.target.value);
                if (serverError) setServerError('');
                if (fieldErrors.confirmPwd) setFieldErrors(prev => ({ ...prev, confirmPwd: '' }));
              }}
              placeholder="Repeat your password" autoComplete="new-password"
              error={fieldErrors.confirmPwd}
              rightEl={<PwdToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} fieldId="confirm password" />}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-[var(--radius-lg)] transition-all shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] mt-2"
            >
              {loading ? (
                <><Spinner size={16} className="border-white/30 border-t-white" /> Creating account...</>
              ) : (
                <> Create Account <ArrowRight size={14} aria-hidden="true" /> </>
              )}
            </button>
          </form>

          <p className="text-xs text-[var(--color-text-muted)] text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
