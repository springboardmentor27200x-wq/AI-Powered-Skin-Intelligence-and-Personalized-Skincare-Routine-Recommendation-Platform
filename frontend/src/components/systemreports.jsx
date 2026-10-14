import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { downloadSystemReportPdf, downloadSystemReportExcel } from "../api/client";

export default function SystemReports() {
  const { token } = useAuth();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function run(kind, download) {
    setError("");
    setBusy(kind);
    try {
      await download(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <h2 className="font-display text-lg text-ink">System reports</h2>
      <p className="mt-1 text-sm text-ink/60">
        Download a platform-wide summary: users by role, platform analytics, and recommendation monitoring. It
        contains totals only, with no individual user's data.
      </p>

      {error && <p className="mt-4 rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => run("pdf", downloadSystemReportPdf)}
          disabled={busy !== ""}
          className="focus-ring rounded-full bg-clinical-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-clinical-600 disabled:opacity-60"
        >
          {busy === "pdf" ? "Preparing..." : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={() => run("excel", downloadSystemReportExcel)}
          disabled={busy !== ""}
          className="focus-ring rounded-full border border-clinical-500 px-5 py-2 text-sm font-medium text-clinical-600 transition hover:bg-clinical-50 disabled:opacity-60"
        >
          {busy === "excel" ? "Preparing..." : "Download Excel"}
        </button>
      </div>
    </div>
  );
}