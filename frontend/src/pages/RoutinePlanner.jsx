import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRoutine, generateRoutine, getTodayChecklist, updateChecklist } from "../services/api";

function StepCard({ step, isChecked, onToggle }) {
  return (
    <div className="card" style={{
      marginBottom: 14, padding: 18, borderLeft: `4px solid ${isChecked ? "var(--green-dark)" : "var(--border)"}`,
      background: isChecked ? "#f4f8f6" : "white", transition: "all .2s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {onToggle && (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(step.id)}
              style={{ width: 20, height: 20, marginTop: 2, cursor: "pointer" }}
            />
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <strong style={{ fontSize: 16 }}>Step {step.step_number}: {step.name}</strong>
              <span className="badge badge-user">{step.category}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>• {step.frequency}</span>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.5 }}>
              {step.description}
            </p>
            {step.key_ingredients && step.key_ingredients.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-dark)" }}>Key Ingredients:</span>
                {step.key_ingredients.map((ing, idx) => (
                  <span key={idx} style={{
                    fontSize: 11, background: "var(--green-light)", color: "var(--green-dark)",
                    padding: "2px 8px", borderRadius: 12, fontWeight: 600
                  }}>
                    {ing}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoutinePlanner() {
  const [routine, setRoutine] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [completionRate, setCompletionRate] = useState(0.0);
  const [activeTab, setActiveTab] = useState("morning");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    try {
      const [rRes, cRes] = await Promise.all([getRoutine(), getTodayChecklist()]);
      setRoutine(rRes.data);
      setCompletedSteps(cRes.data.completed_steps || []);
      setCompletionRate(cRes.data.completion_rate || 0.0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const r = await generateRoutine();
      setRoutine(r.data);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const toggleChecklistStep = async (stepId) => {
    const updated = completedSteps.includes(stepId)
      ? completedSteps.filter((id) => id !== stepId)
      : [...completedSteps, stepId];
    
    setCompletedSteps(updated);
    try {
      const res = await updateChecklist(updated);
      setCompletionRate(res.data.completion_rate);
    } catch {
      // error fallback
    }
  };

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: 40 }}>Loading personalized routine…</div>;
  }

  if (!routine) {
    return (
      <section>
        <div className="dashboard-head">
          <div>
            <p className="eyebrow">Routine Generator</p>
            <h1>Personalized Skincare Routine</h1>
          </div>
        </div>
        <div className="card empty" style={{ textAlign: "center", padding: "60px 24px", maxWidth: 640, margin: "40px auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>☀️🌙</div>
          <h2 style={{ fontSize: 24, marginBottom: 10, color: "var(--text-main)" }}>No Skin Profile Found</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Please create your skin profile first. Skincare routines are uniquely tailored to whether your skin is Oily, Dry, Sensitive, Combination, or Normal, and customized to address your individual concerns.
          </p>
          <Link to="/profile" className="primary" style={{ display: "inline-block", padding: "10px 24px", fontSize: 15, textDecoration: "none" }}>
            👉 Create Skin Profile
          </Link>
        </div>
      </section>
    );
  }

  const morningSteps = routine?.morning_steps || [];
  const eveningSteps = routine?.evening_steps || [];
  const weeklyTreatments = routine?.weekly_treatments || [];
  const seasonalAdvice = routine?.seasonal_advice || [];

  return (
    <section>
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Routine Generator</p>
          <h1>Personalized Skincare Routine</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            Tailored morning, evening, weekly treatment, and seasonal guidance.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="primary" onClick={handleRegenerate} disabled={generating}>
            {generating ? "Generating…" : "⚡ Regenerate Adaptive Routine"}
          </button>
        </div>
      </div>

      {/* Daily Skincare Checklist Progress Bar */}
      <div className="card" style={{ marginBottom: 28, background: "linear-gradient(135deg, #ffffff 0%, #f4f8f6 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 6 }}>
            📋 Daily Skincare Checklist Completion
          </h3>
          <strong style={{ fontSize: 16, color: "var(--green-dark)" }}>{completionRate}% Completed</strong>
        </div>
        <div style={{ width: "100%", background: "var(--green-light)", borderRadius: 10, height: 16, overflow: "hidden" }}>
          <div style={{
            width: `${completionRate}%`,
            height: "100%",
            background: completionRate >= 100 ? "#22c55e" : "var(--green-dark)",
            borderRadius: 10,
            transition: "width .4s ease"
          }} />
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, margin: 0 }}>
          Check off steps as you perform your morning and evening skincare routine to maintain high consistency scoring!
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 10, flexWrap: "wrap" }}>
        {[
          { key: "morning", label: "🌅 Morning Routine", count: morningSteps.length },
          { key: "evening", label: "🌙 Evening Routine", count: eveningSteps.length },
          { key: "weekly", label: "🗓️ Weekly Treatments", count: weeklyTreatments.length },
          { key: "seasonal", label: "🍂 Seasonal Advice", count: seasonalAdvice.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? "primary" : "secondary"}
            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8 }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab Content: Morning */}
      {activeTab === "morning" && (
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>🌅 Morning Skincare Routine</h3>
          {morningSteps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              isChecked={completedSteps.includes(step.id)}
              onToggle={toggleChecklistStep}
            />
          ))}
        </div>
      )}

      {/* Tab Content: Evening */}
      {activeTab === "evening" && (
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>🌙 Evening Skincare Routine</h3>
          {eveningSteps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              isChecked={completedSteps.includes(step.id)}
              onToggle={toggleChecklistStep}
            />
          ))}
        </div>
      )}

      {/* Tab Content: Weekly */}
      {activeTab === "weekly" && (
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>🗓️ Weekly Special Treatments</h3>
          <div style={{ display: "grid", gap: 14 }}>
            {weeklyTreatments.map((w, idx) => (
              <div key={idx} className="card" style={{ borderLeft: "4px solid var(--purple)", padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ fontSize: 16 }}>{w.day}: {w.name}</strong>
                  <span className="badge badge-dermatologist">{w.category}</span>
                </div>
                <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>{w.description}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Key Actives:</span>
                  {w.ingredients?.map((ing, i) => (
                    <span key={i} style={{ fontSize: 11, background: "var(--purple-light)", color: "var(--purple)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Seasonal */}
      {activeTab === "seasonal" && (
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 14 }}>🍂 Climate & Seasonal Skincare Protocols</h3>
          <div style={{ display: "grid", gap: 14 }}>
            {seasonalAdvice.map((s, idx) => (
              <div key={idx} className="card" style={{ borderLeft: "4px solid var(--blue)", padding: 18 }}>
                <strong style={{ fontSize: 16, display: "block", marginBottom: 6 }}>{s.title}</strong>
                <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>👉 {s.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
