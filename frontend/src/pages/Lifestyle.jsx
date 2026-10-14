import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LifestyleTracker from "../components/lifestyletracker";

export default function Lifestyle() {
  const { user } = useAuth();
  if (user.role !== "user") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Lifestyle & sleep</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Log today, track the trend</h1>
      <p className="mt-3 text-ink/65">
        Sleep, water, activity, stress, and habits — one entry per day.
      </p>

      <div className="mt-10 rounded-2xl border border-clay bg-white p-6">
        <LifestyleTracker />
      </div>
    </div>
  );
}