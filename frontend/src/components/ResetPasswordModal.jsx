import React, { useState, useEffect } from 'react';
import { 
  X, Mail, KeyRound, ShieldCheck, CheckCircle2, 
  ArrowRight, RefreshCw, Eye, EyeOff, AlertCircle 
} from 'lucide-react';
import { authService } from '../services/auth';
import { extractErrorMessage } from '../utils/error';
import { Spinner } from './ui/LoadingState';

export default function ResetPasswordModal({ isOpen, onClose, initialEmail = '', onResetSuccess }) {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Initialize email when opened
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setStep(1);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setResendCooldown(0);
    }
  }, [isOpen, initialEmail]);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(cleanEmail);
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to send verification code. Please check the email and try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    if (!newPassword) {
      setError('Please enter your new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(email.trim(), cleanOtp, newPassword, confirmPassword);
      setStep(3);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to reset password. Please check your verification code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onResetSuccess) {
      onResetSuccess(email.trim());
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header with Brand Pattern */}
        <div className="bg-[#162822] text-white p-6 relative border-b-2 border-[#c89b27]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#c89b27]">
              <KeyRound size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Reset Password</h2>
              <p className="text-xs text-[#c89b27] font-medium">Email OTP Verification</p>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 1 ? 'text-[#c89b27]' : 'text-white/40'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-[#c89b27] text-[#162822]' : 'bg-white/10'}`}>1</span>
              <span>Email</span>
            </div>
            <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full bg-[#c89b27] transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 2 ? 'text-[#c89b27]' : 'text-white/40'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-[#c89b27] text-[#162822]' : 'bg-white/10'}`}>2</span>
              <span>Verify &amp; Reset</span>
            </div>
            <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full bg-[#c89b27] transition-all duration-300 ${step === 3 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 3 ? 'text-[#c89b27]' : 'text-white/40'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-[#c89b27] text-[#162822]' : 'bg-white/10'}`}>3</span>
              <span>Done</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700 animate-in fade-in" role="alert">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="text-center sm:text-left mb-2">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Forgot your account password?
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                  Enter your registered email address. We will send a secure 6-digit verification code to reset your password.
                </p>
              </div>

              <div>
                <label htmlFor="reset-email" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 pl-10 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                </div>
              </div>

              {/* Demo quick fill hint */}
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-1">
                <span>Demo account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('user@example.com');
                    if (error) setError('');
                  }}
                  className="font-semibold text-[var(--color-brand)] hover:underline"
                >
                  Use user@example.com
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Spinner size={14} className="border-white/30 border-t-white" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Send Reset Code
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                <p className="text-xs text-emerald-900 font-medium">
                  Verification code dispatched to: <strong className="font-bold">{email}</strong>
                </p>
                <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-700">
                  <span>Code expires in 10 minutes.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError('');
                    }}
                    className="underline hover:text-emerald-900 font-semibold"
                  >
                    Change email
                  </button>
                </div>
              </div>

              {/* OTP Input */}
              <div>
                <label htmlFor="otp-code" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                      if (error) setError('');
                    }}
                    placeholder="123456"
                    className="w-full text-center tracking-[8px] font-mono font-bold text-lg px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
                  />
                  <ShieldCheck size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                  New Password (min. 8 characters)
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter new strong password"
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    aria-label={showNewPwd ? 'Hide password' : 'Show password'}
                  >
                    {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPwd ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Resend Code Link */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-[var(--color-text-muted)]">Didn&apos;t receive code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleRequestOtp}
                  className="font-semibold text-[var(--color-brand)] hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                >
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Spinner size={14} className="border-white/30 border-t-white" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Password Reset Successful!
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed max-w-xs mx-auto">
                  Your DermaIQ account password has been updated. You can now sign in using your new credentials.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow"
                >
                  Sign In with New Password
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
