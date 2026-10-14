import { Link } from "react-router-dom";
import SkinScoreDial from "../components/SkinScoreDial";

const ROLES = [
  {
    name: "User",
    detail: "Track your skin profile, follow a generated routine, and watch your score move.",
  },
  {
    name: "Skincare Consultant",
    detail: "Review client profiles and assessment reports, manage recommendations.",
  },
  {
    name: "Dermatologist",
    detail: "See patient insights, condition reports, and treatment recommendations.",
  },
  {
    name: "Administrator",
    detail: "Manage users, monitor recommendations, and oversee platform health.",
  },
];

const FEATURES = [
  {
    title: "Skin Assessment Engine",
    detail: "Identifies concerns, scores conditions, and prioritizes what to treat first.",
  },
  {
    title: "Personalized Routines",
    detail: "Morning, evening, and weekly plans built from your profile and goals.",
  },
  {
    title: "Ingredient Intelligence",
    detail: "Suitability checks, interaction analysis, and allergy detection before you buy.",
  },
  {
    title: "Product Recommendations",
    detail: "Suitability-scored products with budget-aware alternatives.",
  },
  {
    title: "Progress Tracking",
    detail: "Before/after comparisons and trend analysis as your routine takes effect.",
  },
  {
    title: "Role-Based Dashboards",
    detail: "Separate views for users, consultants, dermatologists, and admins.",
  },
];

export default function Landing() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">
            AI skin intelligence platform
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl">
            Skincare, read like a lab result.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
            One score built from your skin condition, lifestyle, sleep, routine consistency, and
            hydration &mdash; with a routine and product plan generated to move it.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="focus-ring rounded-full bg-clinical-500 px-6 py-3 font-medium text-white transition hover:bg-clinical-600"
            >
              Create your profile
            </Link>
            <Link
              to="/login"
              className="focus-ring rounded-full border border-ink/15 px-6 py-3 font-medium text-ink transition hover:border-ink/30"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="flex justify-center">
          <SkinScoreDial />
        </div>
      </section>

      <section className="border-y border-clay/70 bg-white/60 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl text-ink">Built for four kinds of people</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((role) => (
              <div
                key={role.name}
                className="rounded-2xl border border-clay bg-mist p-6 transition hover:border-clinical-400 hover:shadow-sm"
              >
                <h3 className="font-display text-lg text-ink">{role.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{role.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-2xl text-ink">What the platform does</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <div className="mb-3 h-px w-10 bg-bloom-500" />
              <h3 className="font-display text-lg text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-clinical-700 py-16 text-mist">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl">Start your skin profile today</h2>
            <p className="mt-2 text-clinical-100/80">Free to create. Takes about three minutes.</p>
          </div>
          <Link
            to="/register"
            className="focus-ring rounded-full bg-mist px-6 py-3 font-medium text-clinical-700 transition hover:bg-white"
          >
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
}
