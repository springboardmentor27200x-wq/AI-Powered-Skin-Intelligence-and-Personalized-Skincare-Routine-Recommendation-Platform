import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, User, LogOut, Menu, X, Shield, Activity, Droplets, Moon, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../common/Badge';
import { formatRoleName } from '../../utils/formatters';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
                SkinIntel <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wider">M4</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">AI Skin Intelligence & Wellness</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-none">{user?.full_name}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{formatRoleName(user?.role)}</div>
                </div>
                {user?.role === 'ADMINISTRATOR' && (
                  <Badge variant="purple" size="sm">Admin</Badge>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-emerald-600 px-4 py-2 rounded-xl transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-sm shadow-emerald-200 transition"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="p-3 bg-slate-50 rounded-xl mb-3">
                <div className="font-medium text-sm text-slate-900">{user?.full_name}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
                <div className="mt-1">
                  <Badge variant="primary" size="sm">{formatRoleName(user?.role)}</Badge>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/skin-profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
              >
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Skin Profile</span>
              </Link>
              <Link
                to="/lifestyle"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Lifestyle</span>
              </Link>
              <Link
                to="/sleep"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
              >
                <Moon className="w-4 h-4 text-purple-600" />
                <span>Sleep Tracking</span>
              </Link>
              <Link
                to="/hydration"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
              >
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>Hydration Tracking</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Settings</span>
              </Link>
              {user?.role === 'ADMINISTRATOR' && (
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-purple-700 bg-purple-50 hover:bg-purple-100"
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
