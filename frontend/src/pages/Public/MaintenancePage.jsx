import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldAlert, Clock, Mail, LogIn, RefreshCw, Cpu, Activity } from 'lucide-react';
import BrandLogo, { BrandLogoIcon } from '../../components/BrandLogo';

export default function MaintenancePage({ config = {} }) {
  const headline = config.maintenance_headline || 'System Maintenance in Progress';
  const message =
    config.maintenance_message ||
    'DermaIQ is undergoing scheduled clinical algorithm optimization and infrastructure upgrades. Our diagnostic telemetry services will resume shortly.';
  const supportEmail = config.support_email || 'clinical@dermaiq.ai';
  const appName = config.app_name || 'DermaIQ';

  return (
    <div className="min-h-screen bg-[#fafaf6] flex flex-col justify-between selection:bg-[#d8eee2] selection:text-[#163328]">
      {/* Top Bar */}
      <header className="px-6 py-6 border-b border-[#e8e4dc] bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" to="/" />
          <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Maintenance Mode Active
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12 text-center space-y-8 flex-1 flex flex-col justify-center">
        {/* Animated Icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-3xl bg-[#1b382d]/10 animate-ping opacity-30" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1b382d] to-[#277858] p-5 shadow-xl flex items-center justify-center text-white border border-[#3e7863]">
            <BrandLogoIcon size={56} className="animate-pulse" />
          </div>
        </div>

        {/* Headline & Description */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#edf5f0] text-[#1c5440] border border-[#c6e2d4]">
            <Wrench size={13} className="text-[#277858]" />
            Routine Clinical Infrastructure Upgrade
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#163328] tracking-tight">
            {headline}
          </h1>
          <p className="text-sm sm:text-base text-[#4a3e2e] leading-relaxed max-w-xl mx-auto font-normal">
            {message}
          </p>
        </div>

        {/* Live Systems Maintenance Checklist */}
        <div className="bg-white rounded-2xl border border-[#e8e4dc] p-5 text-left space-y-3 shadow-xs max-w-md mx-auto w-full">
          <h3 className="text-xs font-bold text-[#163328] uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-[#277858]" /> Maintenance Diagnostics
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#277858] font-medium">
              <span>Database Indexes & Telemetry</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">Completed</span>
            </div>
            <div className="flex items-center justify-between text-amber-800 font-medium">
              <span>Neural Model & Tensor Optimization</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> In Progress
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-400 font-medium">
              <span>Clinical Gateways & SSL Handshake</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200">Pending</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1b382d] hover:bg-[#274b3d] text-white shadow-md transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> Check Status Again
          </button>

          <Link
            to="/login?maintenance_bypass=true"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#f5f0e8] text-[#1b382d] border border-[#d4cabb] transition-all cursor-pointer shadow-2xs"
          >
            <LogIn size={14} /> Administrator Portal Login
          </Link>
        </div>

        <p className="text-xs text-[#8b7355]">
          Need urgent access or have questions? Email{' '}
          <a href={`mailto:${supportEmail}`} className="underline font-bold text-[#1b382d]">
            {supportEmail}
          </a>
        </p>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-[#e8e4dc] bg-white/60 text-center text-xs text-[#8b7355]">
        <p>&copy; {new Date().getFullYear()} {appName} Intelligence. All rights reserved.</p>
      </footer>
    </div>
  );
}
