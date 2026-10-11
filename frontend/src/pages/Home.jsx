import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";

// ─── Floating Particle ───────────────────────────────────────────────────────
function Particle({ style }) {
  return <div className="lp-particle" style={style} />;
}

// ─── Animated Section Wrapper ─────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Feature Cards Data ───────────────────────────────────────────────────────
const features = [
  {
    icon: "💬",
    title: "AI Skin Chat",
    desc: "Intelligent skincare assistant powered by dermatology knowledge. Get instant answers on routines, ingredients, and skin concerns.",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    icon: "🔬",
    title: "Skin Type Detection",
    desc: "Accurately identifies your Fitzpatrick skin type and active concerns including hyperpigmentation and sensitivity.",
    color: "#0d9488",
    bg: "rgba(13,148,136,0.08)",
  },
  {
    icon: "🧪",
    title: "Ingredient Intelligence",
    desc: "Analyze cosmetic formulas for chemical conflicts, allergen alerts, and comedogenicity ratings.",
    color: "#d97706",
    bg: "rgba(217,119,6,0.08)",
  },
  {
    icon: "🌿",
    title: "Personalized Routines",
    desc: "Dynamic morning, evening & weekly regimens crafted specifically to your skin barrier and lifestyle.",
    color: "#16a34a",
    bg: "rgba(22,163,74,0.08)",
  },
  {
    icon: "📈",
    title: "Skin Health Score",
    desc: "A multi-factorial weighted score tracking progress across condition, sleep, hydration and consistency.",
    color: "#e11d48",
    bg: "rgba(225,29,72,0.08)",
  },
  {
    icon: "💧",
    title: "Lifestyle Intelligence",
    desc: "Correlates sleep quality, hydration, UV exposure, and pollution with your skin health trends.",
    color: "#0284c7",
    bg: "rgba(2,132,199,0.08)",
  },
];

// ─── Steps ────────────────────────────────────────────────────────────────────
const steps = [
  {
    num: "01",
    icon: "💬",
    title: "Chat with AI Assistant",
    desc: "Ask our AI skincare assistant about your skin concerns, ingredients, routines, or any skincare question — 24/7.",
  },
  {
    num: "02",
    icon: "🤖",
    title: "AI Understands Your Skin",
    desc: "Our AI analyzes your concerns, skin type, lifestyle and goals using intelligent skincare science and dermatology knowledge.",
  },
  {
    num: "03",
    icon: "✨",
    title: "Get Your Personalized Plan",
    desc: "Receive a tailored routine, curated products, ingredient safety report, and a real-time skin health score.",
  },
];

// ─── Benefits ─────────────────────────────────────────────────────────────────
const benefits = [
  { icon: "🛡️", label: "Barrier Protection" },
  { icon: "⚗️", label: "Science-Backed Ingredients" },
  { icon: "🎯", label: "Precision Skin Matching" },
  { icon: "📊", label: "Progress Analytics" },
  { icon: "🩺", label: "Dermatologist Oversight" },
  { icon: "🌙", label: "Circadian Skin Intelligence" },
  { icon: "🌱", label: "Clean Beauty Formulas" },
  { icon: "🔒", label: "Private & Secure Data" },
];

// ─── Particles Config ─────────────────────────────────────────────────────────
const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 6 + 3,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: `${Math.random() * 5}s`,
  duration: `${6 + Math.random() * 8}s`,
  opacity: Math.random() * 0.35 + 0.1,
}));

// ─── Skincare SVG Illustration ────────────────────────────────────────────────
function SkinIllustration() {
  return (
    <svg viewBox="0 0 480 520" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 460, height: "auto" }}>
      {/* Background glow */}
      <ellipse cx="240" cy="300" rx="200" ry="200" fill="url(#glow1)" opacity="0.4" />
      {/* Serum bottle body */}
      <rect x="170" y="120" width="80" height="180" rx="20" fill="url(#bottle1)" />
      <rect x="185" y="100" width="50" height="30" rx="8" fill="#c7f0e4" />
      <rect x="198" y="86" width="24" height="18" rx="6" fill="#5cb89e" />
      {/* Bottle cap shine */}
      <ellipse cx="210" cy="120" rx="40" ry="6" fill="rgba(255,255,255,0.3)" />
      {/* Bottle label */}
      <rect x="178" y="170" width="64" height="80" rx="8" fill="rgba(255,255,255,0.25)" />
      <rect x="184" y="180" width="52" height="3" rx="2" fill="rgba(255,255,255,0.6)" />
      <rect x="184" y="190" width="40" height="2" rx="2" fill="rgba(255,255,255,0.4)" />
      <rect x="184" y="198" width="46" height="2" rx="2" fill="rgba(255,255,255,0.4)" />
      {/* Bottle shine */}
      <rect x="188" y="130" width="10" height="60" rx="5" fill="rgba(255,255,255,0.35)" />
      {/* Droplets */}
      <ellipse cx="300" cy="160" rx="14" ry="20" fill="url(#drop1)" opacity="0.9" />
      <ellipse cx="140" cy="230" rx="10" ry="14" fill="url(#drop2)" opacity="0.8" />
      <ellipse cx="340" cy="270" rx="8" ry="11" fill="url(#drop1)" opacity="0.7" />
      {/* Leaf 1 */}
      <path d="M80 310 Q100 260 150 280 Q130 320 80 310Z" fill="url(#leaf1)" opacity="0.85" />
      <path d="M80 310 L150 280" stroke="#5cb89e" strokeWidth="1.5" opacity="0.6" />
      {/* Leaf 2 */}
      <path d="M370 200 Q410 160 420 210 Q390 240 370 200Z" fill="url(#leaf2)" opacity="0.8" />
      <path d="M370 200 L420 210" stroke="#a3cfbb" strokeWidth="1.5" opacity="0.5" />
      {/* Leaf 3 small */}
      <path d="M330 360 Q360 330 370 360 Q350 385 330 360Z" fill="url(#leaf1)" opacity="0.7" />
      {/* Sparkle dots */}
      {[
        [120, 140, 5], [360, 140, 4], [110, 360, 4], [370, 390, 5],
        [240, 80, 3], [300, 400, 3], [155, 200, 3.5], [340, 310, 3]
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#10b981" opacity={0.4 + i * 0.04}>
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" />
          <animate attributeName="r" values={`${r};${r * 1.6};${r}`} dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Defs */}
      <defs>
        <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#f0fdf4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bottle1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="60%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="drop1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="drop2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="leaf1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="leaf2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a3cfbb" />
          <stop offset="100%" stopColor="#5cb89e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Dashboard Preview ────────────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div className="lp-dash-preview">
      <div className="lp-dash-inner">
        <div className="lp-dash-header">
          <div>
            <div className="lp-dash-eyebrow">AI Skin Intelligence</div>
            <div className="lp-dash-title">Welcome, Kusumitha 👋</div>
          </div>
          <div className="lp-dash-score">
            <div className="lp-score-ring">
              <svg viewBox="0 0 44 44" style={{ width: 44, height: 44 }}>
                <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="#10b981" strokeWidth="4"
                  strokeDasharray="113" strokeDashoffset="28" strokeLinecap="round"
                  transform="rotate(-90 22 22)" />
              </svg>
              <span>75</span>
            </div>
            <small>Health Score</small>
          </div>
        </div>
        <div className="lp-dash-cards">
          {[
            { label: "Skin Type", value: "Oily", icon: "✨" },
            { label: "Streak 🔥", value: "7 Days", icon: "" },
            { label: "Adherence", value: "82%", icon: "" },
            { label: "Concerns", value: "3 Active", icon: "" },
          ].map((c) => (
            <div key={c.label} className="lp-dash-card">
              <div className="lp-dash-card-label">{c.label}</div>
              <div className="lp-dash-card-value">{c.value}</div>
            </div>
          ))}
        </div>
        <div className="lp-dash-bar-section">
          <div className="lp-dash-bar-label">Morning Routine Progress</div>
          <div className="lp-dash-bar-track">
            <div className="lp-dash-bar-fill" style={{ width: "71%" }} />
          </div>
          <div className="lp-dash-bar-pct">71.4%</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="lp-root">

      {/* ── LANDING NAV ─────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link to="/" className="lp-logo">
            <span className="lp-logo-icon">🌿</span>
            <span>SkinIntelligence <strong>AI</strong></span>
          </Link>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#benefits">Benefits</a>
            <Link to="/login" className="lp-nav-login">Login</Link>
            <Link to="/register" className="lp-nav-cta">Get Started</Link>
          </div>
          <button className="lp-nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div className="lp-mobile-menu"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
              <a href="#benefits" onClick={() => setMenuOpen(false)}>Benefits</a>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="lp-nav-cta" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="lp-hero">
        {/* Background particles */}
        <div className="lp-particles" aria-hidden="true">
          {particles.map(p => (
            <Particle key={p.id} style={{
              width: p.size, height: p.size,
              left: p.left, top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
              opacity: p.opacity,
            }} />
          ))}
        </div>

        <div className="lp-hero-inner">
          {/* LEFT TEXT */}
          <div className="lp-hero-text">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lp-hero-badge"
            >
              <span className="lp-badge-dot" /> AI-Powered Skincare Intelligence
            </motion.div>

            <motion.h1
              className="lp-hero-heading"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              Understand Your Skin.
              <br />
              <span className="lp-heading-accent">Care for It Smarter.</span>
            </motion.h1>

            <motion.p
              className="lp-hero-sub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              The world's most intelligent AI skincare platform. Chat with our AI assistant,
              get dermatologist-grade routines, track your progress, and discover ingredients that actually work for your skin.
            </motion.p>

            <motion.div
              className="lp-hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              <Link to="/register" className="lp-btn-primary">
                Get Started Free <span>→</span>
              </Link>
              <Link to="/login" className="lp-btn-outline">
                💬 Chat with AI
              </Link>
            </motion.div>

            <motion.div
              className="lp-hero-trust"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.65 }}
            >
              <span>🔒 Private & Secure</span>
              <span>🩺 Dermatologist-Reviewed</span>
              <span>⚗️ Science-Backed</span>
            </motion.div>
          </div>

          {/* RIGHT ILLUSTRATION */}
          <motion.div
            className="lp-hero-visual"
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="lp-hero-glow" />
            <div className="lp-hero-img-wrap">
              <SkinIllustration />
              {/* Floating badges */}
              <motion.div className="lp-float-badge lp-float-top"
                animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <span>🎯</span> 99% Match Score
              </motion.div>
              <motion.div className="lp-float-badge lp-float-mid"
                animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
                <span>🔥</span> 7 Day Streak
              </motion.div>
              <motion.div className="lp-float-badge lp-float-bot"
                animate={{ y: [0, -6, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
                <span>✨</span> Skin Score: 75/100
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* scroll indicator */}
        <motion.div className="lp-scroll-hint"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="lp-scroll-mouse"><div className="lp-scroll-dot" /></div>
        </motion.div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" className="lp-section lp-features-section">
        <div className="lp-section-inner">
          <FadeUp>
            <div className="lp-section-label">Platform Features</div>
            <h2 className="lp-section-title">Everything Your Skin Needs, <br /><span className="lp-heading-accent">Powered by AI</span></h2>
            <p className="lp-section-sub">
              Six intelligent modules working together to deliver truly personalized skincare science.
            </p>
          </FadeUp>

          <div className="lp-features-grid">
            {features.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.08}>
                <div className="lp-feature-card" style={{ "--card-accent": f.color, "--card-bg": f.bg }}>
                  <div className="lp-feature-icon" style={{ background: f.bg, color: f.color }}>
                    {f.icon}
                  </div>
                  <h3 className="lp-feature-title">{f.title}</h3>
                  <p className="lp-feature-desc">{f.desc}</p>
                  <div className="lp-feature-arrow">→</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section id="how-it-works" className="lp-section lp-hiw-section">
        <div className="lp-section-inner">
          <FadeUp>
            <div className="lp-section-label">How It Works</div>
            <h2 className="lp-section-title">Three Steps to <span className="lp-heading-accent">Radiant Skin</span></h2>
          </FadeUp>

          <div className="lp-hiw-grid">
            {steps.map((s, i) => (
              <FadeUp key={s.num} delay={i * 0.15}>
                <div className="lp-hiw-card">
                  <div className="lp-hiw-num">{s.num}</div>
                  <div className="lp-hiw-icon">{s.icon}</div>
                  <h3 className="lp-hiw-title">{s.title}</h3>
                  <p className="lp-hiw-desc">{s.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="lp-hiw-connector" aria-hidden="true">→</div>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ─────────────────────────────────── */}
      <section className="lp-section lp-preview-section">
        <div className="lp-section-inner lp-preview-inner">
          <FadeUp className="lp-preview-text">
            <div className="lp-section-label">Live Platform Preview</div>
            <h2 className="lp-section-title">Your Skin Intelligence <span className="lp-heading-accent">Dashboard</span></h2>
            <p className="lp-section-sub lp-preview-sub">
              Track your skin health score, daily routine adherence, 30-day activity streaks,
              and personalized product matches — all in one beautiful dashboard.
            </p>
            <div className="lp-preview-actions">
              <Link to="/register" className="lp-btn-primary">Create Free Account</Link>
              <Link to="/login" className="lp-btn-ghost">Sign In →</Link>
            </div>
          </FadeUp>
          <FadeUp delay={0.2} className="lp-preview-visual">
            <DashboardPreview />
          </FadeUp>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────────── */}
      <section id="benefits" className="lp-section lp-benefits-section">
        <div className="lp-section-inner">
          <FadeUp>
            <div className="lp-section-label">Platform Benefits</div>
            <h2 className="lp-section-title">Built on <span className="lp-heading-accent">Dermatology Science</span></h2>
          </FadeUp>
          <div className="lp-benefits-grid">
            {benefits.map((b, i) => (
              <FadeUp key={b.label} delay={i * 0.06}>
                <div className="lp-benefit-pill">
                  <span className="lp-benefit-icon">{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="lp-section lp-cta-section">
        <div className="lp-cta-glow" />
        <FadeUp>
          <div className="lp-cta-inner">
            <div className="lp-cta-icon">🌿</div>
            <h2 className="lp-cta-title">Start Your Skin Intelligence Journey Today</h2>
            <p className="lp-cta-sub">
              Join thousands of users who are taking control of their skin health with AI-powered personalization.
            </p>
            <div className="lp-cta-actions">
              <Link to="/register" className="lp-btn-primary lp-btn-lg">Get Started Free</Link>
              <Link to="/login" className="lp-btn-white">Login to Dashboard</Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <span className="lp-logo-icon">🌿</span>
              <span>SkinIntelligence <strong>AI</strong></span>
            </div>
            <p>An AI-enabled platform for personalized skin, lifestyle & wellness intelligence.</p>
          </div>
          <div className="lp-footer-links">
            <div>
              <h4>Platform</h4>
              <Link to="/register">Get Started</Link>
              <Link to="/login">Login</Link>
            </div>
            <div>
              <h4>Features</h4>
              <a href="#features">AI Scanner</a>
              <a href="#features">Routines</a>
              <a href="#features">Progress</a>
            </div>
            <div>
              <h4>Info</h4>
              <a href="#how-it-works">How It Works</a>
              <a href="#benefits">Benefits</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 AI Skin Intelligence Platform. Built for Academic Excellence.</span>
        </div>
      </footer>
    </div>
  );
}
