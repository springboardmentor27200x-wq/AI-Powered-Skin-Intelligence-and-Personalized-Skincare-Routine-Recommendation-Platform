import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Activity,
  Moon,
  Droplets,
  Lock,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/common/Button';

export function LandingPage() {
  const features = [
    {
      icon: Sparkles,
      title: 'Skin Profile Intelligence',
      description:
        'Map your skin type, age bracket, dermatological concerns, allergies, and known sensitivities into a structured profile.',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Activity,
      title: 'Lifestyle & Exposure Tracking',
      description:
        'Record physical activity, daily screen time, UV/outdoor exposure, pollution, and indoor climate factors.',
      color: 'bg-teal-50 text-teal-600',
    },
    {
      icon: Moon,
      title: 'Restorative Sleep Tracking',
      description:
        'Log sleep duration, subjective sleep quality ratings, consistency, and bedtime schedules over time.',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: Droplets,
      title: 'Hydration Monitoring',
      description:
        'Track daily water intake with quick presets (+250ml cup, +500ml bottle) and monitor daily hydration consistency.',
      color: 'bg-sky-50 text-sky-600',
    },
    {
      icon: Lock,
      title: 'Secure JWT Authentication',
      description:
        'Production-grade bcrypt password hashing, token validation, and safe session handling.',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      icon: Users,
      title: 'Role-Based Access Control',
      description:
        'Built with dedicated role tiers for Users, Skincare Consultants, Dermatologists, and Administrators.',
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Milestones 1–4 • Skin intelligence workflow</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            AI Skin Intelligence &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Personalized Planner
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The foundational platform for holistic skincare tracking. Build your skin profile, monitor lifestyle exposures, log sleep quality, and track daily hydration.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight} className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>

          {/* Persona quick notice */}
          <div className="mt-12 p-4 rounded-2xl bg-white border border-slate-200/80 max-w-2xl mx-auto shadow-sm text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Ready-to-Test Demo Personas (Password: <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">Password123!</code>):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="font-semibold text-slate-800 block">User:</span>
                <span className="text-slate-500 font-mono text-[11px]">user@demo.com</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="font-semibold text-slate-800 block">Consultant:</span>
                <span className="text-slate-500 font-mono text-[11px]">consultant@demo.com</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="font-semibold text-slate-800 block">Dermatologist:</span>
                <span className="text-slate-500 font-mono text-[11px]">derm@demo.com</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="font-semibold text-slate-800 block">Admin:</span>
                <span className="text-slate-500 font-mono text-[11px]">admin@demo.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Clean, Modular Full-Stack Foundation
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Engineered with FastAPI, SQLAlchemy ORM, PostgreSQL, React, and Tailwind CSS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap Scope Assurance */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">
                <CheckCircle2 className="w-4 h-4" /> Milestones 1–3
              </div>
              <h3 className="text-lg font-bold text-white">
                From skin assessment to a routine you can track
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Build a scored skin assessment, review ingredient compatibility, compare suitable products, and track daily routine consistency.
              </p>
            </div>
            <Link to="/register">
              <Button variant="wellness" size="md">
                Launch Workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
