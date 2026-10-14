import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchDailyLogs } from "../api/client";
import DashboardOverview from "../components/dashboardoverview";
import ClientRoster from "../components/clientroster";
import {
  downloadAssessmentReportPdf, downloadAssessmentReportExcel,
  downloadRoutineReportPdf,
  downloadProductsReportPdf, downloadProductsReportExcel,
  downloadProgressReportPdf, downloadProgressReportExcel,
  downloadSkinHealthReportPdf,
} from "../api/client";
import { Navigate } from "react-router-dom";
const COPY = {
  user: {
    heading: "Your skin, tracked.",
    detail: "Keep your skin profile and daily lifestyle log up to date — it's what the assessment engine and routine generator will use.",
  },
  skincare_consultant: {
    heading: "Client overview.",
    detail: "Client profiles and assessment reports will surface in this dashboard.",
  },
  dermatologist: {
    heading: "Patient insights.",
    detail: "Condition reports and treatment recommendations will surface here.",
  },
  administrator: {
    heading: "Platform overview.",
    detail: "User management, analytics, and system reports will surface here.",
  },
};

function label(word) {
  return word ? word.replace(/_/g, " ") : word;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const copy = COPY[user.role] ?? COPY.user;
  if (user.role === "administrator") return <Navigate to="/admin" replace />;
  const [latestLog, setLatestLog] = useState(null);
  const [loadingLog, setLoadingLog] = useState(user.role === "user");

  useEffect(() => {
    if (user.role !== "user") return;
    fetchDailyLogs(token, 1)
      .then((logs) => setLatestLog(logs[0] || null))
      .catch(() => setLatestLog(null))
      .finally(() => setLoadingLog(false));
  }, [token, user.role]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const loggedToday = latestLog?.log_date === todayISO;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">
        {user.role.replace("_", " ")} dashboard
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink">{copy.heading}</h1>
      <p className="mt-3 max-w-lg text-ink/65">{copy.detail}</p>

      {user.role === "user" && (
        <>
          <div className="mt-10">
            <DashboardOverview />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Link
              to="/skin-profile"
              className="rounded-2xl border border-clay bg-white p-6 transition hover:border-clinical-400 hover:shadow-sm"
            >
              <h2 className="font-display text-lg text-ink">Skin profile</h2>
              <p className="mt-2 text-sm text-ink/65">
                Skin type, concerns, allergies, and sensitivities.
              </p>
            </Link>
            <Link
              to="/lifestyle"
              className="rounded-2xl border border-clay bg-white p-6 transition hover:border-clinical-400 hover:shadow-sm"
            >
              <h2 className="font-display text-lg text-ink">Lifestyle & sleep</h2>
              <p className="mt-2 text-sm text-ink/65">
                Log today's sleep, water, activity, stress, and habits.
              </p>
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-clay bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">Recent activity</h2>
              <Link to="/lifestyle" className="focus-ring text-sm font-medium text-clinical-600 hover:underline">
                View full history →
              </Link>
            </div>

            {loadingLog ? (
              <p className="mt-4 text-sm text-ink/50">Loading...</p>
            ) : latestLog ? (
              <div className="mt-4">
                <p className="text-sm text-ink/70">
                  <span className="font-medium text-ink">{latestLog.log_date}</span>
                  {loggedToday && (
                    <span className="ml-2 rounded-full bg-clinical-50 px-2 py-0.5 text-xs font-medium text-clinical-700">
                      Today
                    </span>
                  )}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
                  <dt className="text-ink/50">Sleep</dt>
                  <dd className="text-ink">
                    {latestLog.sleep_quality ? label(latestLog.sleep_quality) : "—"}
                    {latestLog.sleep_hours ? ` · ${latestLog.sleep_hours}h` : ""}
                  </dd>
                  <dt className="text-ink/50">Water</dt>
                  <dd className="text-ink">
                    {latestLog.water_intake_liters ? `${latestLog.water_intake_liters} L` : "—"}
                  </dd>
                  <dt className="text-ink/50">Activity</dt>
                  <dd className="text-ink">{label(latestLog.activity_level) || "—"}</dd>
                  <dt className="text-ink/50">Stress</dt>
                  <dd className="text-ink">{label(latestLog.stress_level) || "—"}</dd>
                </dl>
                {!loggedToday && (
                  <p className="mt-4 text-sm text-ink/60">
                    You haven't logged today yet.{" "}
                    <Link to="/lifestyle" className="font-medium text-clinical-600 hover:underline">
                      Log today
                    </Link>
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/50">
                No entries yet.{" "}
                <Link to="/lifestyle" className="font-medium text-clinical-600 hover:underline">
                  Log today
                </Link>{" "}
                to start tracking.
              </p>
            )}
            <div className="mt-6 rounded-2xl border border-clay bg-white p-6">
  <h2 className="font-display text-lg text-ink">Reports</h2>
  <p className="mt-1 text-sm text-ink/60">Download a snapshot of any part of your plan.</p>
  <div className="mt-4 flex flex-wrap gap-2">
    {[
      ["Skin health (combined, PDF)", () => downloadSkinHealthReportPdf(token)],
      ["Assessment — PDF", () => downloadAssessmentReportPdf(token)],
      ["Assessment — Excel", () => downloadAssessmentReportExcel(token)],
      ["Routine — PDF", () => downloadRoutineReportPdf(token)],
      ["Products — PDF", () => downloadProductsReportPdf(token)],
      ["Products — Excel", () => downloadProductsReportExcel(token)],
      ["Progress — PDF", () => downloadProgressReportPdf(token)],
      ["Progress — Excel", () => downloadProgressReportExcel(token)],
    ].map(([label, handler]) => (
      <button
        key={label}
        onClick={handler}
        className="focus-ring rounded-full border border-clay px-4 py-1.5 text-sm text-ink/70 transition hover:border-clinical-400 hover:text-ink"
      >
        {label}
      </button>
    ))}
  </div>
</div>

            <p className="mt-5 border-t border-clay/60 pt-4 text-xs text-ink/45">
              One entry per day — saving today's log again updates it, it never creates a duplicate.
            </p>
          </div>
        </>
      )}

      {(user.role === "skincare_consultant" || user.role === "dermatologist") && (
        <div className="mt-10">
          <ClientRoster role={user.role} />
        </div>
      )}
    </div>
  );
}
