import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProgressAnalytics from "../components/progressanalytics";

export default function Progress() {
  const { user } = useAuth();
  if (user.role !== "user") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Progress</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Progress Tracking</h1>
      <p className="mt-3 text-ink/65">
        How your skin health score has changed over time.
      </p>

      <div className="mt-10">
        <ProgressAnalytics />
      </div>
    </div>
  );
}