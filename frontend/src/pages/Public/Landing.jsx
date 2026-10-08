import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Sparkles, Moon, Droplet, Sun, Activity,
  ArrowRight, Heart, Leaf, TrendingUp, Users, Star,
  ChevronRight, CheckCircle2, Zap, Stethoscope, ShieldAlert,
  Layers, Lock, Award, Compass, Sparkle, Check, AlertCircle,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo';

const getRoleHomepage = (user) => {
  if (!user) return '/login';
  const nameSlug = user.profile?.name
    ? user.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
  switch (user.role) {
    case 'SKINCARE_CONSULTANT': return `/consultant/${nameSlug}/dashboard`;
    case 'DERMATOLOGIST': return `/DERMATOLOGIST/${nameSlug}/dashboard`;
    case 'ADMINISTRATOR': return '/admin/dashboard';
    default: return '/dashboard';
  }
};

/* ── Reusable fade-in-on-scroll wrapper ─── */
const FadeInSection = ({ children, delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.45 }
    );
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        } ${className}`}
    >
      {children}
    </div>
  );
};

/* ── Stat counter with animation ─── */
const AnimatedStat = ({ end, suffix = '', label, icon: Icon }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = Math.max(1, Math.floor(end / 40));
    const interval = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(interval); }
      else setCount(current);
    }, 28);
    return () => clearInterval(interval);
  }, [started, end]);

  return (
    <div ref={ref} className="flex flex-col items-center p-6 rounded-3xl bg-white/75 backdrop-blur-md border border-[#e2ebe6] shadow-[0_4px_20px_rgba(20,40,32,0.04)] hover:shadow-lg transition-shadow">
      {Icon && <Icon className="text-[#2d5f4e] mb-2.5" size={22} />}
      <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#163328]">
        {count}{suffix}
      </div>
      <div className="text-xs md:text-sm text-[#4b6b5f] mt-1 font-semibold text-center">{label}</div>
    </div>
  );
};

/* ── Feature cards dataset with rich light-botanical styling ─── */
const features = [
  {
    icon: ShieldCheck,
    title: 'Skin Profile & Concerns',
    desc: 'Record skin type, allergies, sensitivities, and 10+ clinical concerns to drive precise routine modeling.',
    colorBg: 'bg-[#eaf4ef] text-[#22634e] border-[#c8e2d6]',
    cardTint: 'from-[#fbfdfc] to-[#f2f8f4]',
    badge: 'Core Identity',
  },
  {
    icon: Moon,
    title: 'Circadian Sleep Quality',
    desc: 'Log nightly sleep duration, bedtime regularity, and recovery scores to evaluate overnight cellular restoration.',
    colorBg: 'bg-[#eeedf8] text-[#4f46a5] border-[#d8d5f3]',
    cardTint: 'from-[#fdfdfd] to-[#f4f3fb]',
    badge: 'Circadian Cycle',
  },
  {
    icon: Droplet,
    title: 'Hydration Target Intake',
    desc: 'Track daily water consumption against targets to protect epidermal barrier hydration and skin plumpness.',
    colorBg: 'bg-[#e8f4fc] text-[#1d6b99] border-[#cce4f7]',
    cardTint: 'from-[#fcfdff] to-[#f0f7fd]',
    badge: 'Moisture Barrier',
  },
  {
    icon: Sun,
    title: 'Environmental Exposure',
    desc: 'Monitor UV index exposure, ambient pollution, and humidity levels that trigger oxidative skin stress.',
    colorBg: 'bg-[#fef4e8] text-[#a45d16] border-[#fde1c3]',
    cardTint: 'from-[#fffdfb] to-[#fdf7ee]',
    badge: 'Oxidative Shield',
  },
  {
    icon: Activity,
    title: 'Lifestyle & Stress Telemetry',
    desc: 'Log daily stress levels, nutrition quality, and workout frequency influencing cortisol and breakout risks.',
    colorBg: 'bg-[#fceef1] text-[#a82d49] border-[#f8d2db]',
    cardTint: 'from-[#fffcfc] to-[#fdf2f4]',
    badge: 'Biometric Balance',
  },
  {
    icon: TrendingUp,
    title: 'Unified Health Cockpit',
    desc: 'Real-time health statistics, profile completion telemetry, and streamlined daily action triggers in one place.',
    colorBg: 'bg-[#eaf5ed] text-[#266840] border-[#c9e6d1]',
    cardTint: 'from-[#fcfdfc] to-[#f1f9f3]',
    badge: 'Unified View',
  },
];

/* ── Multi-Role Architecture Data ─── */
const rolesData = [
  {
    role: 'USER',
    title: 'Personal Skincare Planner',
    desc: 'Log daily wellness biometrics, monitor hydration and sleep, and manage your complete skin health record.',
    icon: Heart,
    theme: 'border-[#c6ded3] bg-[#f4f9f6] text-[#1e4b3c]',
    iconColor: 'bg-[#d8ece2] text-[#22634e]',
    link: '/register?role=USER',
    linkText: 'Register as User',
  },
  {
    role: 'SKINCARE_CONSULTANT',
    title: 'Consultant Intelligence Desk',
    desc: 'Review client lifestyle history, monitor habit adherence, and curate targeted product regimens.',
    icon: Users,
    theme: 'border-[#cce3e6] bg-[#f2f8f9] text-[#18484f]',
    iconColor: 'bg-[#d6ecf0] text-[#1d6b77]',
    link: '/register?role=SKINCARE_CONSULTANT',
    linkText: 'Join as Consultant',
  },
  {
    role: 'DERMATOLOGIST',
    title: 'Clinical Diagnostics Board',
    desc: 'Analyze longitudinal environmental stress triggers, allergy maps, and historical skin concern trends.',
    icon: Stethoscope,
    theme: 'border-[#cde0ec] bg-[#f3f7fb] text-[#1c415c]',
    iconColor: 'bg-[#d8e8f4] text-[#205d85]',
    link: '/register?role=DERMATOLOGIST',
    linkText: 'Join as Dermatologist',
  },
  {
    role: 'ADMINISTRATOR',
    title: 'Platform Governance Suite',
    desc: 'Oversee user accounts, manage master skin concern registries, and inspect system audit telemetry.',
    icon: ShieldAlert,
    theme: 'border-[#e8decb] bg-[#faf6ef] text-[#543e1c]',
    iconColor: 'bg-[#f4ebd6] text-[#7a5823]',
    link: '/login',
    linkText: 'Admin Portal Sign In',
  },
];

/* ── 3-Step Phone Mockup Workflow Dataset ─── */
const steps = [
  {
    num: '01',
    stepLabel: 'STEP 1',
    title: 'Complete Your Skin Profile',
    desc: 'Log your skin type, clinical concerns, allergen triggers, and sensitivities to initialize your personalized diagnostic profile.',
    badge: 'Clinical Assessment',
    image: '/images/feature-tracking.jpg',
    actionText: 'Comprehensive Profile Ready'
  },
  {
    num: '02',
    stepLabel: 'STEP 2',
    title: 'Multi-Pillar AI Analysis',
    desc: 'Our AI engine calculates 5 core health pillars: barrier integrity, hydration balance, sleep recovery, UV exposure, and lifestyle stressors.',
    badge: '5-Pillar Diagnostic Engine',
    image: '/images/step2-analysis.jpg',
    actionText: 'Scoring 88/100 Optimal'
  },
  {
    num: '03',
    stepLabel: 'STEP 3',
    title: 'Get Your Custom Regimen',
    desc: 'Receive a personalized AM/PM product protocol calibrated for your skin profile and connect with certified doctors.',
    badge: 'Tailored Protocol',
    image: '/images/step3-routine.jpg',
    actionText: 'Custom Protocol Ready'
  },
];

/* ── Testimonials (Balanced representation) ─── */
const testimonials = [
  {
    name: 'Dr. Marcus Sterling, MD',
    role: 'Board-Certified Clinical Dermatologist',
    text: 'Tracking environmental UV exposure and hydration together with patient skin concerns provides unprecedented diagnostic clarity.',
    rating: 5,
    bg: 'bg-[#f4f9f6]'
  },
  {
    name: 'Elena Vance, LE',
    role: 'Licensed Skincare Advisor',
    text: 'The multi-role ecosystem allows me to collaborate with clients seamlessly. The UI is exceptionally polished and intuitive.',
    rating: 5,
    bg: 'bg-[#fbf7f0]'
  },
  {
    name: 'David Chen',
    role: 'Verified Platform User (Engineer)',
    text: 'Correlating my sleep cycles and workout hydration with skin flare-ups finally solved my redness and razor irritation.',
    rating: 5,
    bg: 'bg-[#f3f7fb]'
  },
  {
    name: 'Maya Patel',
    role: 'Verified User & Wellness Creator',
    text: 'The comprehensive skin profiling and barrier scoring gives me the exact daily routine adjustments I need whenever the weather changes.',
    rating: 5,
    bg: 'bg-[#faf6ee]'
  },
];

const Landing = () => {
  const { user } = useAuth();
  const dashboardPath = user ? getRoleHomepage(user) : null;

  return (
    <div className="min-h-screen bg-[#f7f5ee] text-[#1a2f26] flex flex-col font-sans overflow-x-hidden selection:bg-[#2e5949] selection:text-white">

      {/* ═══ AMBIENT LUXURY LIGHT AURA GRADIENTS ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[550px] h-[550px] bg-[#d3ebd9]/60 rounded-full blur-[130px]" />
        <div className="absolute top-[28%] -left-32 w-[500px] h-[500px] bg-[#fbe7d5]/50 rounded-full blur-[130px]" />
        <div className="absolute top-[60%] -right-20 w-[550px] h-[550px] bg-[#dbe8f5]/50 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] bg-[#e3eedd]/60 rounded-full blur-[130px]" />
      </div>

      {/* ═══ STICKY FROSTED NAVBAR ═══ */}
      <header className="sticky top-0 z-50 bg-[#f7f5ee]/85 backdrop-blur-xl border-b border-[#dce6df] shadow-[0_2px_15px_rgba(20,40,32,0.03)] transition-all">
        <div className="max-w-7xl w-full mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo size="lg" to="/" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-[#3d594e]">
            <a href="#features" className="hover:text-[#163328] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#163328] transition-colors">Workflow</a>
            <a href="#roles" className="hover:text-[#163328] transition-colors">Roles & Security</a>
            <a href="#join-care-team" className="hover:text-[#163328] transition-colors text-emerald-800 font-extrabold flex items-center gap-1">
              <span>For Providers</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </a>
            <a href="#testimonials" className="hover:text-[#163328] transition-colors">Reviews</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={dashboardPath}
                className="px-5 py-2.5 bg-[#214336] hover:bg-[#18352a] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-block text-sm font-bold text-[#2d5747] hover:text-[#163328] px-3.5 py-2 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-[#214336] hover:bg-[#18352a] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══ HERO SECTION (FILLED IMAGE HERO WITH BOTH MALE & FEMALE SKINCARE ROUTINE) ═══ */}
      <section className="relative z-10 min-h-[640px] lg:min-h-[720px] flex items-center overflow-hidden border-b border-[#dce6df]">
        {/* Full-Bleed Filled Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-couple.jpg"
            alt="DermaIQ Skincare Regimen - Male and Female Skincare Routine"
            className="w-full h-full object-cover object-[78%_center] sm:object-right lg:object-[82%_center]"
          />
          {/* Subtle directional gradient overlays for pristine high-contrast readability on left, while keeping people vivid on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f7f5ee] via-[#f7f5ee]/95 sm:via-[#f7f5ee]/85 md:via-[#f7f5ee]/70 lg:via-[#f7f5ee]/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f7f5ee]/70 via-transparent to-[#f7f5ee]/20" />
        </div>

        <div className="max-w-7xl w-full mx-auto px-6 py-16 md:py-24 lg:py-28 relative z-10">
          {/* Left Side: Headlines, Description & Action Buttons */}
          <div className="max-w-2xl lg:max-w-xl xl:max-w-2xl space-y-6 text-center lg:text-left">
            <FadeInSection>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/90 backdrop-blur-md border border-[#c6e2d4] text-[#1c5440] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles size={14} className="text-[#2d795b]" />
                Clinical Dermatology • Multi-Vector Intelligence
              </div>
            </FadeInSection>

            <FadeInSection delay={100}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-black text-[#132820] leading-[1.12] tracking-tight uppercase drop-shadow-sm">
                DEVELOPED WITH DERMATOLOGISTS.<br />
                <span className="text-[#2b6d54]">
                  POWERED BY ARTIFICIAL INTELLIGENCE.
                </span>
              </h1>
            </FadeInSection>

            <FadeInSection delay={200}>
              <p className="text-base sm:text-lg text-[#294237] leading-relaxed font-medium max-w-xl">
                Personalized skincare intelligence platform that crafts customized regimens based on your diagnostic skin profile, lifestyle telemetry, circadian sleep, and real-time environmental exposome.
              </p>
            </FadeInSection>

            <FadeInSection delay={300}>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1">
                {user ? (
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#214336] hover:bg-[#18352a] text-white text-sm font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all group"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#214336] hover:bg-[#18352a] text-white text-sm font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all group"
                    >
                      <Sparkles size={16} />
                      <span>Start Skin Assessment</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 px-5 py-3.5 bg-white/90 hover:bg-white text-[#1f302b] text-sm font-bold rounded-2xl border border-[#ccdcd6] shadow-md transition-all backdrop-blur-sm"
                    >
                      <span>Sign In</span>
                    </Link>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-[#2f5444] pt-3">
                <span className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/60">
                  <CheckCircle2 size={15} className="text-[#2b7759]" /> 5-Pillar Assessment
                </span>
                <span className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/60">
                  <CheckCircle2 size={15} className="text-[#2b7759]" /> Instant Regimen
                </span>
                <span className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/60">
                  <CheckCircle2 size={15} className="text-[#2b7759]" /> Certified Network
                </span>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ═══ STATS TELEMETRY BAR ═══ */}
      <section className="relative z-10 py-12 bg-gradient-to-r from-[#edf5f0] via-[#f5f1e7] to-[#edf5f0] border-y border-[#dbe6df]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <AnimatedStat end={6} suffix="+" label="Biometric Telemetry Layers" icon={Layers} />
          <AnimatedStat end={4} suffix="" label="Dedicated Role Portals" icon={Users} />
          <AnimatedStat end={10} suffix="+" label="Master Concern Classifications" icon={Award} />
          <AnimatedStat end={100} suffix="%" label="PostgreSQL Data Sovereignty" icon={Lock} />
        </div>
      </section>

      {/* ═══ THE PROBLEM VS THE SOLUTION SECTION ═══ */}
      <section id="problem-solution" className="relative z-10 py-24 md:py-32 bg-[#faf7ee]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#fbe7d5] border border-[#f5cdb0] text-[#914611] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <AlertCircle size={14} className="text-[#a45214]" />
                The Skincare Dilemma vs Modern Solution
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#132820] tracking-tight">
                Why generic skincare fails — <br />
                <span className="text-[#2b6d54]">and how adaptive telemetry solves it.</span>
              </h2>
              <p className="text-base sm:text-lg text-[#4a6358] leading-relaxed font-normal">
                Traditional skincare relies on costly trial-and-error. DermaIQ bridges personal daily wellness habits directly with clinical dermatological intelligence.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

            {/* The Problem Card */}
            <FadeInSection delay={100}>
              <div className="p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-b from-[#fff8f7] to-[#fef2f0] border border-[#f5c6c0] shadow-[0_8px_30px_rgba(200,60,40,0.06)] hover:shadow-xl transition-all flex flex-col justify-between h-full space-y-6">
                <div className="space-y-6">
                  {/* Problem Image with Overlay Badge */}
                  <div className="relative rounded-2xl overflow-hidden border border-[#f5c6c0] shadow-md group">
                    <img
                      src="/images/problem-confusion.jpg"
                      alt="Overwhelmed with confusing skincare products and ingredient trial-and-error"
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 right-3 bg-rose-950/80 backdrop-blur-md border border-rose-400/30 text-white rounded-xl p-3 text-xs font-bold flex items-center gap-2.5 shadow-lg">
                      <span className="p-1 bg-rose-500 rounded-lg text-white">✕</span>
                      <span>82% of users suffer from ingredient clash & generic routine fatigue</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded-md w-fit border border-rose-200 mb-2">
                      The Traditional Problem
                    </div>
                    <h3 className="text-2xl font-black text-rose-950">The Guesswork & Confusion Trap</h3>
                    <p className="text-sm text-rose-900/80 leading-relaxed mt-2 font-normal">
                      Most people buy products blindly based on viral trends or static formulas, leading to compromised skin barriers, wasted money, and unmanaged flare-ups.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {[
                      'Static routines that ignore changing sleep, hydration, and weather',
                      'Active ingredient clashes and undocumented allergen reactions',
                      'No easy way to share daily lifestyle telemetry with doctors or advisors',
                    ].map((prob, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-rose-900">
                        <span className="text-rose-500 font-bold text-sm">✕</span>
                        <span>{prob}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-rose-200/60 text-xs font-semibold text-rose-800/80 italic">
                  Result: Frustration, damaged moisture barriers, and inconsistent skin health.
                </div>
              </div>
            </FadeInSection>

            {/* The Solution Card */}
            <FadeInSection delay={200}>
              <div className="p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-b from-[#f4f9f6] to-[#eaf4ef] border border-[#c6ded3] shadow-[0_8px_30px_rgba(20,80,50,0.06)] hover:shadow-xl transition-all flex flex-col justify-between h-full space-y-6">
                <div className="space-y-6">
                  {/* Solution Image with Overlay Badge */}
                  <div className="relative rounded-2xl overflow-hidden border border-[#c6ded3] shadow-md group">
                    <img
                      src="/images/solution-intelligence.jpg"
                      alt="Personalized adaptive skincare telemetry and radiant healthy skin"
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 right-3 bg-[#133024]/85 backdrop-blur-md border border-emerald-400/30 text-white rounded-xl p-3 text-xs font-bold flex items-center gap-2.5 shadow-lg">
                      <span className="p-1 bg-emerald-500 rounded-lg text-white">✓</span>
                      <span>Continuous biometric telemetry tailored to your biological profile</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#1e5440] bg-[#d5ede1] px-2.5 py-1 rounded-md w-fit border border-[#b8dec9] mb-2">
                      The DermaIQ Solution
                    </div>
                    <h3 className="text-2xl font-black text-[#143325]">Adaptive Biometric Intelligence</h3>
                    <p className="text-sm text-[#3d6352] leading-relaxed mt-2 font-normal">
                      A living skin passport that tracks your sleep recovery, hydration volume, and local UV index in real-time, backed by certified professional collaboration.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {[
                      'Circadian sleep and environmental stress synchronization in under 60 sec/day',
                      'Allergen safeguards and cutaneous sensitivity contraindication maps',
                      'One-click consent connection with licensed consultants & clinical dermatologists',
                    ].map((sol, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-[#184835]">
                        <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{sol}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#c6ded3]/80 text-xs font-semibold text-[#255c45] italic">
                  Result: Stronger lipid barrier, predictable skin recovery, and expert guidance.
                </div>
              </div>
            </FadeInSection>

          </div>
        </div>
      </section>

      {/* ═══ FEATURE MATRIX SECTION ═══ */}
      <section id="features" className="relative z-10 py-24 md:py-32 bg-[#f4f8f5]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#e4f2ea] border border-[#c4e4d3] text-[#1c5440] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <Zap size={14} className="text-[#2d795b]" />
                Comprehensive 360° Tracking
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#132820] tracking-tight">
                Everything that impacts your skin, <br />
                <span className="text-[#2b6d54]">organized in one intelligent space.</span>
              </h2>
              <p className="text-base sm:text-lg text-[#4a6358] leading-relaxed font-normal">
                Skincare isn't just creams and serums. We log the real physiological and environmental drivers of skin health to give you actionable clarity.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeInSection key={f.title} delay={i * 80}>
                <div className={`group relative p-7 rounded-3xl bg-gradient-to-b ${f.cardTint} border border-[#dce8e1] hover:border-[#a3ccb8] shadow-[0_4px_20px_rgba(20,40,32,0.04)] hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3.5 rounded-2xl border ${f.colorBg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <f.icon size={22} />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/90 text-[#305948] border border-[#d5e4dc] shadow-sm">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#142d22] mb-2 group-hover:text-[#205742] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#4d6b5e] leading-relaxed font-normal flex-1">
                    {f.desc}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ APP PREVIEW & COCKPIT SHOWCASE ═══ */}
      <section className="relative z-10 py-24 md:py-32 bg-gradient-to-b from-[#f4f8f5] via-[#f9f7f0] to-[#f4f8f5] border-t border-[#dbe6df] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center">

          {/* Left: App Showcase Mockup */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <FadeInSection>
              <div className="relative mx-auto max-w-md">
                <div className="p-3 rounded-[2.7rem] bg-gradient-to-b from-[#e5f0e9] via-white to-[#f4ece0] border border-[#d0e3d7] shadow-2xl">
                  <img
                    src="/images/feature-tracking.jpg"
                    alt="DermaIQ Mobile Dashboard Cockpit"
                    className="rounded-[2.2rem] w-full shadow-md object-cover"
                  />
                </div>
              </div>
            </FadeInSection>
          </div>

          {/* Right: Feature Breakdown */}
          <div className="lg:col-span-7 space-y-8 order-1 lg:order-2">
            <FadeInSection delay={100}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#eaf4ef] border border-[#c4e4d3] text-[#1c5440] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <Compass size={14} className="text-[#22634e]" />
                Unified Intelligence Engine
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#132820] leading-tight mt-3">
                A personal skin health dashboard that learns as you log.
              </h2>
              <p className="text-lg text-[#4a6358] leading-relaxed font-normal">
                Every logged night of sleep, every glass of water, and every UV index score maps directly back to your active skin concerns — turning daily routines into actionable wellness guidance.
              </p>
            </FadeInSection>

            <FadeInSection delay={200}>
              <div className="space-y-4">
                {[
                  { title: 'Interactive Onboarding Passport', desc: 'Captures your age category, geographic climate zone, and master concern codes.' },
                  { title: 'Sub-Minute Daily Logging', desc: 'Fast record entry for sleep, water intake, stress, and environmental exposure.' },
                  { title: 'Dynamic Profile Completion Meter', desc: 'Real-time telemetry bar showing profile strength and missing data categories.' },
                  { title: 'Automated OAuth2 & JWT Security', desc: 'Bank-grade authentication with role-isolated dashboard route guards.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/90 border border-[#dbe6df] shadow-sm">
                    <div className="p-1.5 bg-[#e4f2ea] text-[#22634e] rounded-xl border border-[#c6e5d5] mt-0.5 flex-shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#142d22]">{item.title}</h4>
                      <p className="text-xs text-[#506e61] mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>

        </div>
      </section>

      {/* ═══ MULTI-ROLE ECOSYSTEM MATRIX ═══ */}
      <section id="roles" className="relative z-10 py-24 md:py-32 bg-[#faf7ee]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#e4f2ea] border border-[#c4e4d3] text-[#1c5440] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <Users size={14} className="text-[#2d795b]" />
                Role-Based Architecture
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#132820] tracking-tight">
                Designed for users, consultants <br />
                <span className="text-[#2b6d54]">& clinical dermatologists alike.</span>
              </h2>
              <p className="text-base sm:text-lg text-[#4a6358] leading-relaxed font-normal">
                Four distinct role portals with isolated permissions, tailored workflows, and specialized dashboard layouts.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rolesData.map((r, i) => (
              <FadeInSection key={r.role} delay={i * 90}>
                <div className={`p-6 rounded-3xl border ${r.theme} flex flex-col justify-between h-full shadow-[0_4px_15px_rgba(20,40,32,0.03)] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
                  <div>
                    <div className={`p-3 rounded-2xl w-fit mb-4 ${r.iconColor}`}>
                      <r.icon size={24} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/80 rounded-md w-fit mb-2 border border-black/5">
                      {r.role}
                    </div>
                    <h3 className="text-lg font-bold text-[#142d22] mb-2">{r.title}</h3>
                    <p className="text-xs text-[#506e61] leading-relaxed font-normal">{r.desc}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-black/5">
                    <Link
                      to={r.link}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a4032] hover:text-[#0f281f] group/btn transition-colors"
                    >
                      <span>{r.linkText}</span>
                      <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DEDICATED PROFESSIONAL CARE NETWORK SECTION ═══ */}
      <section id="join-care-team" className="relative z-10 py-20 md:py-28 bg-[#f2f7f4] border-t border-[#d8e6df]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#e4f2ea] border border-[#c4e4d3] text-[#1c5440] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles size={14} className="text-[#2d795b]" />
                Professional Care Network
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#132820] tracking-tight">
                Are you a Skincare Consultant <br />
                <span className="text-[#2b6d54]">or Clinical Dermatologist?</span>
              </h2>
              <p className="text-base sm:text-lg text-[#4a6358] leading-relaxed font-normal">
                Join our certified provider ecosystem to connect directly with motivated users, review authorized wellness telemetry, and deliver precision skincare regimens.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Consultant Card */}
            <FadeInSection delay={100}>
              <div className="p-8 md:p-10 rounded-[2.5rem] bg-white border border-[#cce3e6] shadow-[0_6px_30px_rgba(20,40,32,0.04)] hover:shadow-xl hover:border-[#a0cbcf] transition-all flex flex-col justify-between h-full space-y-6">
                <div className="space-y-5">
                  {/* Consultant Consultation Photo */}
                  <div className="relative rounded-2xl overflow-hidden border border-[#cce3e6] shadow-md group">
                    <img
                      src="/images/consultant-consultation.jpg"
                      alt="Certified Skincare Consultant reviewing client routine on tablet"
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-teal-900/80 backdrop-blur-md border border-teal-300/30 text-white rounded-full px-3 py-1 text-[11px] font-bold">
                      Advisor Portal
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-teal-50 text-teal-800 rounded-2xl border border-teal-200">
                      <Sparkles size={24} />
                    </div>
                    <span className="text-[11px] uppercase font-extrabold tracking-wider px-3 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-200">
                      Skincare Consultant
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-[#14393d]">Join as Skincare Advisor</h3>
                    <p className="text-sm text-[#4d6b6e] leading-relaxed mt-1 font-normal">
                      Expand your private practice with verified client connections. Review client skin profiles, track routine adherence, and guide tailored product regimens with real-time telemetry.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {[
                      'Receive direct connection requests from proactive clients',
                      'Access authorized read-only sleep, hydration & stress logs',
                      'Guide structured AM/PM skincare routines with confidence',
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-[#1e484f]">
                        <CheckCircle2 size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <Link
                    to="/register?role=SKINCARE_CONSULTANT"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#173a3c] hover:bg-[#112d2f] text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all group"
                  >
                    <span>Register as Skincare Consultant</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </FadeInSection>

            {/* Dermatologist Card (Male representation) */}
            <FadeInSection delay={200}>
              <div className="p-8 md:p-10 rounded-[2.5rem] bg-white border border-[#cde0ec] shadow-[0_6px_30px_rgba(20,40,32,0.04)] hover:shadow-xl hover:border-[#9ec1da] transition-all flex flex-col justify-between h-full space-y-6">
                <div className="space-y-5">
                  {/* Dermatologist Clinical Photo */}
                  <div className="relative rounded-2xl overflow-hidden border border-[#cde0ec] shadow-md group">
                    <img
                      src="/images/male-dermatologist.jpg"
                      alt="Dr. Arthur Vangs, Clinical Dermatologist reviewing patient skin charts"
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-cyan-950/80 backdrop-blur-md border border-cyan-300/30 text-white rounded-full px-3 py-1 text-[11px] font-bold">
                      Clinical Board MD
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-cyan-50 text-cyan-800 rounded-2xl border border-cyan-200">
                      <Stethoscope size={24} />
                    </div>
                    <span className="text-[11px] uppercase font-extrabold tracking-wider px-3 py-1 bg-cyan-50 text-cyan-800 rounded-full border border-cyan-200">
                      Clinical Dermatologist
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-[#1c415c]">Join as Clinical Dermatologist</h3>
                    <p className="text-sm text-[#46657c] leading-relaxed mt-1 font-normal">
                      Access consent-governed patient charts with longitudinal data. Review cutaneous allergen contraindications, monitor physiological trends, and evaluate flare-up progressions.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {[
                      'Consent-governed read-only patient medical case charts',
                      'Documented cutaneous allergy & sensitivity contraindication alerts',
                      'Longitudinal UV exposure, humidity & climate stress correlations',
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-[#1c415c]">
                        <CheckCircle2 size={16} className="text-cyan-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <Link
                    to="/register?role=DERMATOLOGIST"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#183a2d] hover:bg-[#112d22] text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all group"
                  >
                    <span>Register as Dermatologist</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>



      {/* ═══ 3 EASY STEPS WORKFLOW WITH PHONE MOCKUPS (MATCHING REFERENCE) ═══ */}
      <section id="how-it-works" className="relative z-10 py-24 md:py-32 bg-gradient-to-b from-[#faf7ee] via-[#edf5f0] to-[#f4f8f5] border-t border-[#dbe6df]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#e4f2ea] border border-[#c4e4d3] text-[#1c5440] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <Smartphone size={14} className="text-[#2d795b]" />
                Interactive 3-Step Journey
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#132820] tracking-tight">
                3 EASY STEPS TO PRECISION SKINCARE
              </h2>
              <p className="text-base sm:text-lg text-[#4a6358] leading-relaxed">
                From completing your initial profile assessment to receiving tailored dermatological routines in under 3 minutes.
              </p>
            </div>
          </FadeInSection>

          {/* 3 Phone Mockups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {steps.map((s, i) => (
              <FadeInSection key={s.num} delay={i * 120}>
                <div className="relative p-6 sm:p-7 rounded-[2.5rem] bg-white/90 border border-[#d7e5de] backdrop-blur-md text-center group hover:border-[#a3ccb8] transition-all duration-300 shadow-[0_6px_25px_rgba(20,40,32,0.04)] hover:shadow-2xl flex flex-col h-full items-center">

                  {/* Step Phone Mockup Image */}
                  <div className="w-full max-w-[240px] mb-6 rounded-3xl overflow-hidden border border-[#d2e4d9] shadow-lg group-hover:scale-105 transition-transform duration-500 bg-[#f9faf9] relative">
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold py-1 px-2 rounded-lg truncate">
                      {s.actionText}
                    </div>
                  </div>

                  {/* Step Indicator Header */}
                  <div className="text-xs font-black uppercase tracking-widest text-[#215642] px-3 py-1 bg-[#e4f2ea] rounded-full border border-[#c6e5d5] mb-2">
                    {s.stepLabel}
                  </div>

                  <h3 className="text-xl font-bold text-[#142d22] mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-[#506e61] leading-relaxed font-normal flex-1">{s.desc}</p>

                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-5 text-[#a8cdbe] z-20 transform -translate-y-1/2">
                      <ChevronRight size={32} />
                    </div>
                  )}
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="relative z-10 py-24 md:py-32 bg-[#f4f8f5]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeInSection>
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#fef5e8] border border-[#fbdcb8] text-[#a45d16] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                Trusted & Verified
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#132820] tracking-tight">
                Validated by skin experts & everyday users
              </h2>
              <p className="text-base sm:text-lg text-[#4a6358] leading-relaxed font-normal">
                Discover why dermatologists, consultants, and skincare enthusiasts rely on DermaIQ.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeInSection key={t.name} delay={i * 100}>
                <div className={`p-7 rounded-3xl ${t.bg} border border-[#dce8e1] flex flex-col h-full hover:border-[#a3ccb8] transition-all shadow-[0_4px_15px_rgba(20,40,32,0.03)] hover:shadow-lg`}>
                  <div className="flex gap-1.5 mb-5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={17} className="text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm md:text-base text-[#244135] leading-relaxed font-normal flex-1 italic">
                    "{t.text}"
                  </p>
                  <div className="mt-6 pt-5 border-t border-[#d8e5df] flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#214336] flex items-center justify-center font-bold text-white text-sm shadow-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-[#142d22] text-sm">{t.name}</div>
                      <div className="text-xs text-[#527566] font-semibold">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA CONVERSION BANNER ═══ */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <FadeInSection>
            <div className="relative rounded-[3rem] p-10 md:p-16 bg-gradient-to-br from-[#1e4437] via-[#245242] to-[#18392d] text-white border border-[#3b735f] shadow-2xl overflow-hidden text-center">
              {/* Background ambient orbs */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7ad4ae]/15 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

              <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 text-white rounded-full text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
                  <Sparkles size={13} />
                  Start In Seconds
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                  Transform your daily skincare routine with true intelligence.
                </h2>
                <p className="text-base sm:text-lg text-[#d3ebe0] leading-relaxed font-normal">
                  Join thousands building their adaptive skin passport today. Instant setup, zero friction, and always private.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                  {user ? (
                    <Link
                      to={dashboardPath}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-[#eef6f2] text-[#1a382d] font-extrabold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                    >
                      <span>Open Your Dashboard</span>
                      <ArrowRight size={18} />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-[#eef6f2] text-[#1a382d] font-extrabold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5"
                      >
                        <span>Create Free Account</span>
                        <ArrowRight size={18} />
                      </Link>
                      <Link
                        to="/login"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#142f25]/80 hover:bg-[#142f25] text-white font-bold rounded-2xl border border-white/20 shadow-md transition-all"
                      >
                        Sign In
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ MEDICAL SAFETY DISCLAIMER ═══ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-[#edf5f0] border-l-4 border-[#277858] p-6 rounded-r-3xl shadow-sm border-y border-r border-[#d4e4db] text-xs sm:text-sm text-[#274b3d] space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#1e5a42] text-xs">
            <ShieldCheck size={16} className="text-[#277858]" />
            Medical Safety & Regulatory Disclaimer
          </div>
          <p className="leading-relaxed font-normal">
            This platform provides personalized skincare wellness telemetry and lifestyle habit tracking. It is not a substitute for licensed medical diagnosis, clinical treatment, or prescription therapy. Users experiencing severe, cystic, or acute dermatological symptoms should immediately consult a certified medical practitioner.
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 mt-auto bg-[#1b382d] text-[#c9ded5] py-12 border-t border-[#295444]">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2 space-y-4">
              <BrandLogo size="lg" dark={true} to="/" />
              <p className="text-xs sm:text-sm leading-relaxed max-w-sm font-normal text-[#b8d4c9]">
                Personalized skincare intelligence combining circadian sleep metrics, hydration logging, environmental UV tracking, and clinical concern mapping into a unified passport.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Platform Links</h4>
              <div className="flex flex-col gap-2.5 text-xs sm:text-sm font-medium">
                <a href="#features" className="hover:text-white transition-colors">Tracking Features</a>
                <a href="#roles" className="hover:text-white transition-colors">Role Architecture</a>
                <a href="#how-it-works" className="hover:text-white transition-colors">3-Step Workflow</a>
                <a href="#testimonials" className="hover:text-white transition-colors">Expert Reviews</a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Account & Access</h4>
              <div className="flex flex-col gap-2.5 text-xs sm:text-sm font-medium">
                <Link to="/login" className="hover:text-white transition-colors">Member Sign In</Link>
                <Link to="/register" className="hover:text-white transition-colors">Create Skin Passport</Link>
                <Link to="/onboarding" className="hover:text-white transition-colors">Onboarding Wizard</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-[#2d5c4b]/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9ebfb2]">
            <p>&copy; 2026 DermaIQ Intelligence & Personalized Planner - by Deep Kamble</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/security" className="hover:text-white transition-colors">Security Standards</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
