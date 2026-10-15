import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, LogIn, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { notifySuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      notifySuccess('Logged in successfully!');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  };

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
            Sign in to your account
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your skin intelligence dashboard and wellness records
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          {error && <Alert type="error" className="mb-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              icon={LogIn}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick Test Personas (Auto-fills Credentials)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('user@demo.com')}
                className="p-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 font-medium transition text-left"
              >
                <div className="font-bold text-slate-900">User</div>
                <div className="text-[10px] text-slate-500 truncate">user@demo.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('consultant@demo.com')}
                className="p-2 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-slate-700 font-medium transition text-left"
              >
                <div className="font-bold text-slate-900">Consultant</div>
                <div className="text-[10px] text-slate-500 truncate">consultant@demo.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('derm@demo.com')}
                className="p-2 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700 font-medium transition text-left"
              >
                <div className="font-bold text-slate-900">Dermatologist</div>
                <div className="text-[10px] text-slate-500 truncate">derm@demo.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@demo.com')}
                className="p-2 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-slate-700 font-medium transition text-left"
              >
                <div className="font-bold text-slate-900">Administrator</div>
                <div className="text-[10px] text-slate-500 truncate">admin@demo.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
