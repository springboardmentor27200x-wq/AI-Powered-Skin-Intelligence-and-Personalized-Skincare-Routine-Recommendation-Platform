import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Skincare Knowledge Base ─────────────────────────────────── */
function getAIResponse(input) {
  const t = input.toLowerCase();

  if (/^(hi|hello|hey|hii|helo|howdy|good morning|good evening)/.test(t))
    return "Hello! 👋 I'm **SkinAI Assistant** — your intelligent skincare companion powered by dermatology science.\n\nI can help you with personalized routines, ingredient safety, skin concern treatments, and understanding your skin data.\n\nWhat would you like to know today? 💚";

  if (/acne|pimple|breakout|blemish|zit|blackhead|whitehead/.test(t))
    return "🔬 **Acne Management Guide**\n\n**Cleansing:**\n• Salicylic acid 2% cleanser — AM & PM\n• Never scrub aggressively (spreads bacteria)\n\n**Treatments:**\n• **Niacinamide 10%** — reduces sebum and redness\n• **Benzoyl Peroxide 2.5%** — spot treat active breakouts\n• **Azelaic Acid 10%** — gentle and multi-benefit\n\n**Don't:**\n• Pop pimples — causes scarring\n• Touch your face throughout the day\n• Skip moisturizer (dry skin = rebound oil)\n\n💡 *For persistent acne, visit the **Dermatologist** section in your sidebar.*";

  if (/oily|greasy|shiny|sebum|large pore/.test(t))
    return "💧 **Oily Skin Control Strategy**\n\n• **Foaming cleanser** with salicylic acid — twice daily\n• **Niacinamide 10%** — #1 ingredient for sebum control\n• Use **oil-free, non-comedogenic** moisturizer (yes, always moisturize!)\n• **Clay mask** (kaolin/bentonite) — 1-2x per week\n• **Blotting papers** — midday emergency\n\n⚠️ **Avoid:** Alcohol-based toners — they strip skin, causing rebound oiliness.\n\n📊 *Track your hydration in the **Progress** section — dehydration worsens oiliness!*";

  if (/dry|flaky|tight|dull|dehydrat|peeling/.test(t))
    return "🌿 **Dry Skin Hydration Protocol**\n\n1. **Hyaluronic Acid** on damp skin (2 layers) → seals moisture\n2. **Ceramide moisturizer** → repairs skin barrier (CeraVe, La Roche-Posay)\n3. **Squalane oil** at night → lightweight barrier support\n\n**Lifestyle:**\n• Drink **2.5–3L water** daily (check your Hydration Tracker!)\n• Use a humidifier — ambient moisture protects skin\n• Switch to a **gentle sulfate-free cleanser**\n• Avoid hot showers\n\n💤 *Poor sleep dramatically worsens dehydration — check your Sleep Tracker!*";

  if (/sensitiv|redness|irrit|react|flush|rosacea/.test(t))
    return "🛡️ **Sensitive Skin Protocol**\n\n**Safe ingredients:**\nCentella Asiatica · Panthenol · Aloe Vera · Oat Extract · Ceramides\n\n**Avoid:**\nFragrance · Alcohol · Essential oils · Strong acids\n\n**Rules:**\n• Patch test every new product for **72 hours**\n• Introduce one new product at a time\n• Mineral sunscreen only (Zinc Oxide)\n• Keep your routine minimal — under 5 steps\n\n⚠️ *If redness is persistent or spreading, consult a Dermatologist via your dashboard.*";

  if (/dark spot|hyperpigment|melasma|uneven tone|brighten|pigment/.test(t))
    return "✨ **Hyperpigmentation Treatment Plan**\n\n**Morning (AM):**\n• Vitamin C 10–15% serum — antioxidant + brightening\n• Niacinamide 5% — inhibits melanin transfer\n• **SPF 50+ — absolutely essential**\n\n**Evening (PM):**\n• Alpha Arbutin 2% — gentle melanin inhibitor\n• Tranexamic Acid — reduces spot intensity\n• Azelaic Acid 10% — multi-benefit brightener\n\n⏱️ Expect results in **8–12 weeks** with consistency.\n\n☀️ *Without SPF, all brightening products are significantly less effective. Never skip it.*";

  if (/wrinkle|aging|anti-aging|fine line|collagen|retinol|retinoid/.test(t))
    return "⏰ **Anti-Aging Skincare Science**\n\n**Gold standard ingredients:**\n• **Retinol** — the most clinically proven anti-aging ingredient\n• **Vitamin C** — collagen synthesis + UV protection\n• **Peptides** — signal skin to build collagen\n• **SPF** — prevents 80% of visible aging\n\n**Retinol starter schedule:**\n• Weeks 1–2: 1×/week\n• Weeks 3–4: 2×/week\n• Month 2: Every other night\n• Month 3+: Nightly\n\n⚠️ Always apply SPF the morning after retinol use. Buffer with moisturizer if irritation occurs.";

  if (/sunscreen|spf|sun protect|uv |uvb|uva/.test(t))
    return "☀️ **Sunscreen — Your Most Important Skincare Product**\n\n• **SPF 30+ every day** (rain, indoors, cloudy — UV penetrates glass)\n• Reapply every **2 hours** when outdoors\n• Apply **¼ teaspoon** for face + neck (most people use 25% of the needed amount)\n\n**Types:**\n• **Mineral (Zinc Oxide)** — best for sensitive skin, reef-safe\n• **Chemical** — lightweight, no white cast, great for darker skin tones\n\n**Look for:** PA++++ rating for UVA broad-spectrum protection\n\n💡 *Your UV exposure is in Skin Profile → Environmental Factors.*";

  if (/vitamin c|ascorbic|glow|luminous/.test(t))
    return "⚡ **Vitamin C Guide**\n\n**Best form:** L-Ascorbic Acid at 10–20%\n\n**How to use:**\n• Apply on **clean, dry skin** in the morning\n• Wait 1–2 min before next product\n• Store in a cool, dark place\n• Discard if it turns **orange/brown** (oxidized)\n\n**Power combos:**\n• Vitamin C + Vitamin E + Ferulic Acid → enhanced stability\n• Vitamin C + SPF → superior photoprotection\n\n**Avoid same time as:** Retinol · AHAs/BHAs (use AM vs PM to avoid irritation)";

  if (/niacinamide|vitamin b3/.test(t))
    return "💊 **Niacinamide (Vitamin B3) — The All-Rounder**\n\n**What it does:**\n• Minimizes pore appearance\n• Controls sebum production\n• Reduces redness and inflammation\n• Fades dark spots and brightens\n• Strengthens skin barrier\n\n**How to use:**\n• 5% for most skin types · 10% for oily/acne skin\n• Use morning and/or evening — very gentle\n• Layer over hyaluronic acid, under moisturizer\n\n✅ **Myth busted:** Niacinamide and Vitamin C CAN be used together — research confirms compatibility!";

  if (/hyaluronic|hydration|moisture/.test(t))
    return "💧 **Hyaluronic Acid — The Hydration Hero**\n\n**Key tip:** Apply on **damp skin**, not dry — it draws moisture from surroundings.\n\n**Molecular weights matter:**\n• High MW → surface plumping, immediate glow\n• Low MW → deeper penetration, lasting hydration\n\n**Application:**\n• Pat gently (don't rub)\n• Immediately seal with moisturizer\n• Layer twice for intense hydration days\n\n📊 *Track your water intake in the **Hydration Tracker** — internal hydration boosts HA effectiveness!*";

  if (/morning routine|am routine|morning skincare/.test(t))
    return "🌅 **Ideal Morning Routine**\n\n1️⃣ **Gentle Cleanser** — removes overnight buildup\n2️⃣ **Toner** (optional) — pH balance, hydration prep\n3️⃣ **Vitamin C Serum** — antioxidant + brightening\n4️⃣ **Treatment Serum** — niacinamide, peptides, etc.\n5️⃣ **Eye Cream** — targeted treatment\n6️⃣ **Moisturizer** — barrier support\n7️⃣ **SPF 30+** ← ALWAYS the final step\n\n⏱️ 5–8 minutes is all you need. Check your personalized routine in **Routine Planner**!";

  if (/night routine|pm routine|evening|bedtime/.test(t))
    return "🌙 **Ideal Night Routine**\n\n1️⃣ **Oil Cleanser** — dissolves sunscreen & makeup\n2️⃣ **Water Cleanser** — double cleanse\n3️⃣ **Exfoliant** 2–3×/week (AHA/BHA)\n4️⃣ **Toner/Essence** — hydration layering\n5️⃣ **Active Serum** — retinol, peptides, acids\n6️⃣ **Eye Cream**\n7️⃣ **Moisturizer** — thicker at night for barrier repair\n\n💤 *Log sleep quality in the **Sleep Tracker** — skin repairs itself during deep sleep (10PM–2AM)!*";

  if (/mix|combine|together|conflict|avoid|compatible|layer/.test(t))
    return "⚗️ **Ingredient Compatibility Guide**\n\n✅ **Safe to combine:**\n• Niacinamide + Hyaluronic Acid\n• Vitamin C + SPF\n• Peptides + Retinol\n• Ceramides + Anything\n• AHA + Hyaluronic Acid\n\n❌ **Avoid together:**\n• Retinol + AHA/BHA → over-exfoliation\n• Retinol + Vitamin C → use AM/PM separately\n• Benzoyl Peroxide + Retinol → deactivates retinol\n• Multiple strong acids simultaneously\n\n💡 *Use **Ingredient Intelligence** in your sidebar to scan any product for conflicts!*";

  if (/sleep|rest|tired|insomnia|fatigue/.test(t))
    return "😴 **Sleep & Skin Connection**\n\n**During sleep, skin:**\n• Repairs DNA damage from UV\n• Produces growth hormone → collagen synthesis\n• Increases blood flow → nutrients to skin cells\n• Regenerates cells 3× faster than when awake\n\n**Poor sleep causes:**\n• Elevated cortisol → collagen breakdown\n• Increased inflammation → breakouts\n• Puffy eyes, dullness, dehydration\n\n**Sleep skincare tips:**\n• 7–9 hours per night\n• Silk pillowcase — less friction\n• Sleep on your **back** if possible\n• Never sleep with makeup on\n\n📊 *Log in your **Sleep Tracker** daily!*";

  if (/stress|cortisol|anxiety|mental/.test(t))
    return "🧘 **Stress & Skin: The Cortisol Connection**\n\nHigh cortisol causes:\n• Increased sebum → oily skin & acne\n• Collagen breakdown → premature aging\n• Impaired skin barrier → sensitivity\n• Slower wound healing\n\n**Management strategies:**\n• 10 min daily meditation — reduces cortisol 20%\n• Regular exercise (but cleanse afterward)\n• Adaptogen herbs: Ashwagandha, Holy Basil\n• Journaling, nature walks, breathing exercises\n\n📊 *Rate your stress level daily in the **Lifestyle Tracker** to see patterns!*";

  if (/food|diet|eat|nutrition|sugar|dairy|gut/.test(t))
    return "🥑 **Skin-Nourishing Nutrition**\n\n**Eat more:**\n• Fatty fish (salmon) — Omega-3, anti-inflammatory\n• Avocados — vitamin E, healthy fats\n• Berries — antioxidants, vitamin C\n• Leafy greens — vitamins A, C, K\n• Walnuts — zinc + omega-3\n• Green tea — EGCG reduces redness\n\n**Minimize:**\n• High glycemic foods (sugar, white bread) → insulin spike → acne\n• Dairy — linked to breakouts for many\n• Alcohol — dehydrates, causes inflammation\n• Ultra-processed foods → systemic inflammation\n\n📊 *Track in **Lifestyle Tracker**!*";

  if (/skin score|health score|score|rating|progress/.test(t))
    return "📊 **Skin Health Score Breakdown**\n\nYour score is calculated from:\n• **Routine Adherence (30%)** — daily routine consistency\n• **Skin Condition (25%)** — self-reported condition logs\n• **Sleep Quality (20%)** — Sleep Tracker data\n• **Hydration (15%)** — water intake vs. goal\n• **Stress Level (10%)** — Lifestyle Tracker data\n\n**Score guide:**\n• 80–100 → Excellent 🌟\n• 60–79 → Good 👍\n• 40–59 → Needs attention ⚠️\n• Below 40 → Action required ❗\n\n📈 *View your full breakdown in **Progress Tracker**!*";

  if (/product|recommend|buy|brand|serum|moisturizer|cleanser/.test(t))
    return "🧴 **Science-Backed Product Recommendations**\n\n**By category:**\n• **Cleansers:** CeraVe Foaming · La Roche-Posay Toleriane\n• **Vitamin C:** Paula's Choice C15 · Skinceuticals CE Ferulic\n• **Niacinamide:** The Ordinary 10% · COSRX\n• **Moisturizer:** CeraVe PM · Neutrogena Hydro Boost\n• **Retinol:** Differin 0.1% (beginner) · ROC Retinol Correxion\n• **SPF:** EltaMD UV Clear SPF46 · Supergoop Unseen SPF40\n\n💡 *For your **fully personalized product list** based on your skin profile, visit the **Products** section in your sidebar!*";

  if (/thank|thanks|great|perfect|helpful|amazing|awesome/.test(t))
    return "You're welcome! 💚 I'm always here to help you on your skincare journey.\n\nRemember — great skin is built with **consistency over time**, not perfection. Small daily habits compound into visible results.\n\n🌿 Keep logging your progress, stick to your routine, and your skin health score will reflect your dedication!\n\nIs there anything else I can help you with?";

  return "🌿 Great question about skincare! Let me help you better.\n\nI specialize in:\n• 🔬 **Acne & breakouts** — treatments & prevention\n• 💧 **Dry, oily, sensitive skin** — tailored routines\n• ☀️ **Sun protection** — SPF guide\n• ✨ **Dark spots** — brightening ingredients\n• 🌙 **Anti-aging** — retinol & collagen care\n• ⚗️ **Ingredient compatibility** — what to avoid mixing\n• 🌅 **Morning & night routines**\n• 😴 **Sleep & stress** effects on skin\n• 🥑 **Diet & nutrition** for skin health\n• 📊 **Reading your skin health score**\n\nTry: *\"What's best for oily skin?\"* or *\"How do I start with retinol?\"*";
}

/* ── Quick suggestion chips ──────────────────────────────────── */
const CHIPS = [
  "Best routine for oily skin?",
  "How to fade dark spots?",
  "Should I start retinol?",
  "Morning skincare steps?",
  "Ingredients to avoid mixing?",
  "How is my skin score calculated?",
];

/* ── Welcome message ─────────────────────────────────────────── */
const WELCOME_MSG = {
  id: "welcome",
  role: "ai",
  text: "👋 Hello! I'm **SkinAI Assistant** — your intelligent skincare companion.\n\nI'm powered by dermatology science and skincare research to help you with:\n\n• 🌿 **Personalized skincare routines**\n• 🔬 **Ingredient analysis & safety**\n• 💧 **Hydration & lifestyle guidance**\n• ✨ **Skin concern treatments**\n• 📊 **Understanding your skin health data**\n\nAsk me anything about your skin — I'm here to help! 💚",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

/* ── Text formatter (minimal markdown) ───────────────────────── */
function Bubble({ text }) {
  const lines = text.split("\n");
  return (
    <div className="chat-bubble-text">
      {lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={i} className="chat-line">
            {parts.map((p, j) =>
              j % 2 === 1 ? <strong key={j}>{p}</strong> : p
            )}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </div>
  );
}

/* ── Main Chat Component ─────────────────────────────────────── */
export default function AISkinChat() {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput]       = useState("");
  const [typing, setTyping]     = useState(false);
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: getAIResponse(msg),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setTyping(false);
    }, delay);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="chat-root">
      {/* ── Header bar ── */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-ai-badge">🌿</div>
          <div>
            <div className="chat-ai-name">SkinAI Assistant</div>
            <div className="chat-ai-status">
              <span className="chat-pulse" />
              AI Online · Dermatology Intelligence
            </div>
          </div>
        </div>
        <span className="chat-powered">✨ AI Powered</span>
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`chat-row chat-row--${msg.role}`}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {msg.role === "ai" && (
                <div className="chat-avatar">🤖</div>
              )}
              <div className="chat-bubble-wrap">
                <div className={`chat-bubble chat-bubble--${msg.role}`}>
                  <Bubble text={msg.text} />
                </div>
                <div className="chat-timestamp">{msg.time}</div>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <motion.div
              key="typing"
              className="chat-row chat-row--ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22 }}
            >
              <div className="chat-avatar">🤖</div>
              <div className="chat-typing">
                <span /><span /><span />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* ── Suggestion chips ── */}
      <div className="chat-chips">
        {CHIPS.map((c) => (
          <button key={c} className="chat-chip" onClick={() => send(c)} disabled={typing}>
            {c}
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <div className="chat-input-bar">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about skincare…"
          rows={1}
        />
        <button
          className={`chat-send${input.trim() && !typing ? " chat-send--active" : ""}`}
          onClick={() => send()}
          disabled={!input.trim() || typing}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            width="17" height="17">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
