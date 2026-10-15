import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
            SI
          </div>
          <span className="font-semibold text-slate-800">AI Skin Intelligence & Personalized Skincare Planner</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Milestones 1–4 implemented locally
          </span>
          <span>•</span>
          <span>Confidential Internship Project</span>
        </div>
      </div>
    </footer>
  );
}
