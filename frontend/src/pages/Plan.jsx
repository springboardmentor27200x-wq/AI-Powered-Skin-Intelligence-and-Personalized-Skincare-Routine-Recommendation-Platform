import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AssessmentPanel from "../components/AssessmentPanel";
import RoutinePanel from "../components/RoutinePanel";
import AdherenceTracker from "../components/adherencetracker";


export default function Plan() {
  const { user } = useAuth();
  const [assessmentReady, setAssessmentReady] = useState(false);
  const [assessmentVersion, setAssessmentVersion] = useState(0);

  if (user.role !== "user") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Skin plan</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Assessment & Routine</h1>
      <p className="mt-3 text-ink/65">
        Your skin health score, priority concerns, and a routine built to match.
      </p>

      <div className="mt-10 space-y-6">
        <AssessmentPanel
          onAssessmentReady={(a) => {
            setAssessmentReady(!!a);
            setAssessmentVersion((v) => v + 1);
          }}
        />
        <AdherenceTracker />
        <RoutinePanel assessmentReady={assessmentReady} refreshKey={assessmentVersion} />

      </div>
    </div>
  );
}
