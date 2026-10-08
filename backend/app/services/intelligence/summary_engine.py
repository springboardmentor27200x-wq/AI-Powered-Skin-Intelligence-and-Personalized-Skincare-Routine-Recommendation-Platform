from __future__ import annotations
import os, json, logging
from typing import Optional
import httpx

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
HTTP_TIMEOUT = 5.0

def get_active_provider() -> str:
    if GROQ_API_KEY: return "groq"
    if OPENROUTER_API_KEY: return "openrouter"
    if GEMINI_API_KEY: return "gemini"
    return "deterministic"

def get_provider_status() -> dict:
    return {
        "active_provider": get_active_provider(),
        "providers": {
            "groq": {"available": bool(GROQ_API_KEY), "model": GROQ_MODEL},
            "openrouter": {"available": bool(OPENROUTER_API_KEY), "model": OPENROUTER_MODEL},
            "gemini": {"available": bool(GEMINI_API_KEY), "model": GEMINI_MODEL},
            "deterministic": {"available": True, "model": "DermaIQ Clinical Rule Engine v1.0"},
        },
    }

async def _call_groq(system_prompt: str, user_prompt: str) -> str:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": GROQ_MODEL, "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}], "max_tokens": 600, "temperature": 0.4},
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()

async def _call_openrouter(system_prompt: str, user_prompt: str) -> str:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        r = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json", "HTTP-Referer": "https://dermaiq.app"},
            json={"model": OPENROUTER_MODEL, "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}], "max_tokens": 600, "temperature": 0.4},
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()

async def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    combined = f"{system_prompt}\n\n{user_prompt}"
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        r = await client.post(url, headers={"Content-Type": "application/json"}, json={"contents": [{"parts": [{"text": combined}]}]})
        r.raise_for_status()
        return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()

async def _call_llm(system_prompt: str, user_prompt: str) -> Optional[str]:
    provider = get_active_provider()
    if provider == "deterministic":
        return None
    try:
        if provider == "groq": return await _call_groq(system_prompt, user_prompt)
        if provider == "openrouter": return await _call_openrouter(system_prompt, user_prompt)
        if provider == "gemini": return await _call_gemini(system_prompt, user_prompt)
    except Exception as exc:
        logger.warning("LLM provider %s failed: %s", provider, exc)
        for fn, key in [(_call_groq, GROQ_API_KEY), (_call_openrouter, OPENROUTER_API_KEY), (_call_gemini, GEMINI_API_KEY)]:
            if not key: continue
            try: return await fn(system_prompt, user_prompt)
            except Exception: continue
    return None

def _rule_assessment_summary(data: dict) -> str:
    scores = data.get("scores", {})
    concerns = data.get("concerns", [])
    sleep = data.get("sleep", {})
    hydration = data.get("hydration", {})
    overall = scores.get("overall_score", 0)
    barrier = scores.get("barrier_score", 0)
    hydration_score = scores.get("hydration_score", 0)
    inflammation = scores.get("inflammation_score", 0)
    aging = scores.get("aging_score", 0)
    if overall >= 80: health_level = "excellent overall skin health"
    elif overall >= 65: health_level = "good skin health with targeted optimization opportunities"
    elif overall >= 50: health_level = "moderate skin health requiring structured intervention"
    else: health_level = "significant skin health concerns requiring immediate attention"
    lines = ["**DermaIQ Clinical Assessment Summary**", "", f"Your skin profile reflects {health_level} (Composite Score: {overall:.0f}/100)."]
    if barrier < 55: lines.append("Your skin barrier function is compromised. Ceramide-rich moisturizers and elimination of harsh surfactants are indicated as first-line intervention.")
    elif barrier >= 75: lines.append("Your skin barrier function is robust, providing a strong foundation for targeted treatment protocols.")
    avg_ml = hydration.get("avg_daily_ml", 0)
    if hydration_score < 60 or avg_ml < 1500: lines.append(f"Hydration metrics indicate sub-optimal intake (avg. {avg_ml:.0f}ml/day). Increasing to 2,000ml/day and incorporating hyaluronic acid serums is recommended.")
    avg_hrs = sleep.get("avg_hours", 0)
    if avg_hrs and avg_hrs < 6.5: lines.append(f"Sleep duration averaging {avg_hrs:.1f}h/night is below the recommended 7-8 hours. Inadequate sleep elevates cortisol, accelerating barrier degradation.")
    top = [c for c in concerns if c.get("severity", "").upper() in ("HIGH", "CRITICAL")][:3]
    if top: lines.append(f"Priority concerns identified: {', '.join(c.get('name','unknown') for c in top)}. A structured 8-week targeted routine has been generated.")
    if inflammation and inflammation < 50: lines.append("Elevated inflammatory markers detected. Niacinamide (4-10%) and fragrance-free formulations are clinically indicated.")
    if aging and aging < 55: lines.append("Anti-aging metrics indicate photoaging risk. Daily SPF 30+ and retinoid-class actives are the standard of care.")
    lines += ["", "*AI-generated skincare insight - Professional dermatological review is recommended for persistent or severe concerns.*"]
    return "\n".join(lines)

def _rule_progress_summary(data: dict) -> str:
    assessment_a = data.get("assessment_a", {})
    assessment_b = data.get("assessment_b", {})
    deltas = data.get("concern_deltas", [])
    score_a = assessment_a.get("overall_score", 0)
    score_b = assessment_b.get("overall_score", 0)
    delta = score_b - score_a
    if delta > 10: trend, action = f"significant improvement of +{delta:.0f} points", "Continue your current regimen - clear positive adaptation is evident."
    elif delta > 0: trend, action = f"modest improvement of +{delta:.0f} points", "You are on the right trajectory. Maintain consistency and consider adding one targeted active."
    elif delta == 0: trend, action = "stable skin health", "Stability achieved. Consider reassessing product actives to drive further gains."
    else: trend, action = f"a decline of {delta:.0f} points", "Review recent routine changes, environmental triggers, or product interactions."
    improved = [d["concern"] for d in deltas if d.get("delta", 0) > 0]
    worsened = [d["concern"] for d in deltas if d.get("delta", 0) < 0]
    lines = ["**DermaIQ Progress Summary**", "", f"Comparing your two assessment checkpoints, your skin health shows {trend}. {action}"]
    if improved: lines.append(f"Improving concerns: {', '.join(improved[:3])}.")
    if worsened: lines.append(f"Concerns requiring attention: {', '.join(worsened[:3])}.")
    lines += ["", "*AI-generated skincare insight - Professional dermatological review is recommended.*"]
    return "\n".join(lines)

def _rule_clinical_briefing(data: dict) -> str:
    client = data.get("client", {})
    latest = data.get("latest_assessment", {})
    history = data.get("assessment_history", [])
    name = client.get("name", "Patient")
    age = client.get("age", "N/A")
    skin_type = latest.get("skin_type", "Not specified")
    overall = latest.get("overall_score", 0)
    concerns = latest.get("top_concerns", [])
    steps = latest.get("routine_step_count", 0)
    trend = "stable"
    if len(history) >= 2:
        d = history[-1].get("overall_score", 0) - history[-2].get("overall_score", 0)
        trend = "improving" if d > 0 else ("declining" if d < 0 else "stable")
    concern_str = ", ".join(concerns[:4]) if concerns else "None identified"
    return (f"**Clinical Patient Briefing - {name}** (Age: {age})\n\n**Skin Type:** {skin_type} | **Score:** {overall:.0f}/100 | **Trend:** {trend.title()}\n\n**Primary Concerns:** {concern_str}\n\nPatient has an active {steps}-step personalized regimen. Assessment history spans {len(history)} data point(s). {'Trend reversal intervention may be warranted.' if trend == 'declining' else 'Current protocol appears clinically appropriate.'}\n\n*DermaIQ AI-generated briefing - verify against clinical examination before prescribing.*")

def _rule_report_executive_summary(data: dict) -> str:
    report_type = data.get("report_type", "Skin Assessment Report")
    score = data.get("overall_score", 0)
    user_name = data.get("user_name", "Patient")
    generated = data.get("generated_at", "N/A")
    if score >= 80: classification, outlook = "Excellent", "Maintain current protocol and consider preventive anti-aging measures."
    elif score >= 65: classification, outlook = "Good", "Targeted optimization of identified concerns will yield measurable improvement."
    elif score >= 50: classification, outlook = "Fair", "A structured clinical intervention plan is recommended within the next 4-6 weeks."
    else: classification, outlook = "Needs Attention", "Immediate professional dermatological consultation is strongly advised."
    return (f"**{report_type} - Executive Summary**\n\n**Patient:** {user_name} | **Generated:** {generated}\n**Classification:** {classification} ({score:.0f}/100)\n\n**Clinical Outlook:** {outlook}\n\n*This report was generated by DermaIQ Intelligence. All AI-generated insights are for informational purposes only.*")

SYSTEM_PROMPT = ("You are DermaIQ, an expert AI clinical skincare intelligence system. Provide evidence-based, professional, and empathetic skincare summaries. Summaries are concise (3-5 paragraphs), use plain clinical language, and always end with a disclaimer that professional dermatological review is recommended. Do NOT claim to diagnose or treat any medical condition.")

# pyrefly: ignore [bad-function-definition]
async def generate_assessment_summary(assessment: dict, skin_profile: dict = None, scores: dict = None, lifestyle: dict = None, sleep: dict = None, hydration: dict = None) -> str:
    ctx = {"scores": scores or assessment.get("scores", {}), "concerns": assessment.get("concerns", []), "skin_profile": skin_profile or {}, "lifestyle": lifestyle or {}, "sleep": sleep or {}, "hydration": hydration or {}}
    result = await _call_llm(SYSTEM_PROMPT, f"Clinical assessment summary for:\n{json.dumps(ctx, default=str, indent=2)}")
    return result if result else _rule_assessment_summary(ctx)

async def generate_progress_summary(comparison_data: dict) -> str:
    result = await _call_llm(SYSTEM_PROMPT, f"Progress summary:\n{json.dumps(comparison_data, default=str, indent=2)}")
    return result if result else _rule_progress_summary(comparison_data)

async def generate_clinical_briefing(client_detail: dict) -> str:
    result = await _call_llm(SYSTEM_PROMPT, f"Clinical briefing:\n{json.dumps(client_detail, default=str, indent=2)}")
    return result if result else _rule_clinical_briefing(client_detail)

async def generate_report_executive_summary(report_data: dict) -> str:
    result = await _call_llm(SYSTEM_PROMPT, f"Report executive summary:\n{json.dumps(report_data, default=str, indent=2)}")
    return result if result else _rule_report_executive_summary(report_data)
