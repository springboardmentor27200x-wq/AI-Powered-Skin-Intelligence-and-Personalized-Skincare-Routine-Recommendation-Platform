import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { adminService } from '../../services/admin';

export default function TermsOfService() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadTerms = async () => {
      try {
        const res = await adminService.getPublicSetting('legal_terms');
        setData(res?.value || null);
      } catch (err) {
        console.warn('Using standard terms fallback:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTerms();
  }, []);

  const title = data?.title || 'Terms of Clinical & Wellness Service';
  const lastUpdated = data?.last_updated || 'October 2026';
  const effectiveDate = data?.effective_date || 'October 1, 2026';
  const summary =
    data?.summary ||
    'These Terms of Service govern your access to the DermaIQ platform, its AI-assisted skincare analysis, routine planner, and care circle coordination network.';
  const sections = data?.sections || [];

  return (
    <div className="min-h-screen bg-[#fafaf6] text-[#2c2417] flex flex-col selection:bg-[#d8eee2] selection:text-[#163328]">
      {/* ═══ TOP NAVIGATION BAR ═══ */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e8e4dc] px-6 py-4 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" to="/" />

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b382d] hover:text-[#2d795b] px-3 py-2 rounded-xl border border-[#d4cabb] bg-white hover:bg-[#f5f0e8] transition-all"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section className="bg-gradient-to-b from-white to-[#fafaf6] border-b border-[#e8e4dc] py-14 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#fbf6e8] border border-[#fae2aa] text-[#8a5d15] rounded-full text-xs font-bold uppercase tracking-wider">
            <FileText size={14} className="text-[#a87019]" />
            Clinical Platform Governance • Service Agreement
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#163328] tracking-tight">
            {title}
          </h1>

          <div className="flex items-center justify-center gap-6 text-xs text-[#6e5d48] font-medium pt-1">
            <span>Effective: <strong className="text-[#163328]">{effectiveDate}</strong></span>
            <span>•</span>
            <span>Last Updated: <strong className="text-[#163328]">{lastUpdated}</strong></span>
          </div>

          {/* Policy Navigation Tabs */}
          <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
            <Link
              to="/privacy"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#d4cabb] text-[#4d3d29] hover:bg-[#f5f0e8] transition-all"
            >
              Privacy Policy
            </Link>
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1b382d] text-white shadow-xs">
              Terms of Service
            </span>
            <Link
              to="/security"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#d4cabb] text-[#4d3d29] hover:bg-[#f5f0e8] transition-all"
            >
              Security Standards
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ MAIN TERMS CONTENT ═══ */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-10">
        {/* Medical Advisory Callout */}
        <div className="bg-[#fff9eb] border-l-4 border-[#d49a24] p-6 rounded-r-2xl border border-[#fae7be] shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#8a5d15] text-xs">
            <AlertTriangle size={15} className="text-[#d49a24]" /> Clinical Disclaimer & Wellness Agreement
          </div>
          <p className="text-sm leading-relaxed text-[#5e4313] font-medium">
            {summary}
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-[#277858] mx-auto" />
            <p className="text-xs text-[#8b7355]">Loading legal service agreements...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((sec, idx) => (
              <article
                key={idx}
                className="bg-white rounded-2xl border border-[#e8e4dc] p-6 sm:p-8 shadow-xs hover:border-[#fae2aa] transition-all space-y-3"
              >
                <h2 className="text-lg sm:text-xl font-bold text-[#163328] flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#fef8eb] text-[#8a5d15] text-xs font-extrabold flex items-center justify-center border border-[#fde4af] shrink-0">
                    {idx + 1}
                  </span>
                  {sec.heading}
                </h2>
                <div className="text-sm leading-relaxed text-[#4a3e2e] font-normal pl-9 whitespace-pre-line">
                  {sec.body}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Legal Dispute & Notice Box */}
        <div className="bg-white rounded-2xl border border-[#e8e4dc] p-6 flex items-center justify-between flex-wrap gap-4 shadow-xs">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#163328] flex items-center gap-2">
              <Mail size={16} className="text-[#8a5d15]" /> Official Legal & Licensing Notices
            </h4>
            <p className="text-xs text-[#6e5d48]">
              For contract inquiries, healthcare provider affiliations, or IP concerns, contact legal counsel.
            </p>
          </div>
          <a
            href="mailto:legal@dermaiq.ai"
            className="px-4 py-2 bg-[#1b382d] hover:bg-[#274b3d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Contact Legal Counsel
          </a>
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#1b382d] text-[#c9ded5] py-8 border-t border-[#295444] px-6 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" dark={true} to="/" />
          <div className="flex gap-6 text-[#9ebfb2]">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-white font-bold">Terms of Service</Link>
            <Link to="/security" className="hover:text-white transition-colors">Security Standards</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
