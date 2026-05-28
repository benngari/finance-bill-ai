import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI CLIENT
// Reads the API key from your .env file: VITE_GEMINI_API_KEY=your_key_here
// ─────────────────────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED DATA
// ─────────────────────────────────────────────────────────────────────────────

const CLAUSES = [
  { id: "Clause 14", title: "Digital Services Tax", summary: "Imposes a 1.5% levy on revenue from digital marketplaces and platforms operating in Kenya.", impact: "High", sector: "Tech & Commerce" },
  { id: "Clause 27", title: "PAYE Bracket Changes", summary: "Restructures personal income tax bands, raising the top marginal rate from 30% to 35%.", impact: "Critical", sector: "Employment" },
  { id: "Clause 41", title: "Excise on Cooking Oil", summary: "Introduces a KSh 25 per litre excise duty on imported edible oils, affecting food costs.", impact: "High", sector: "Food Security" },
  { id: "Clause 52", title: "Mobile Money Levy", summary: "Increases the excise duty on mobile money transactions from 15% to 20% of the fee charged.", impact: "Critical", sector: "Finance & Fintech" },
  { id: "Clause 63", title: "SME Tax Relief", summary: "Provides a 30% tax credit for small businesses with annual turnover below KSh 5 million.", impact: "Positive", sector: "Small Business" },
  { id: "Clause 78", title: "Housing Levy Revision", summary: "Revises the affordable housing levy to 1.5% of gross salary, shared 50/50 with employer.", impact: "Medium", sector: "Housing" },
];

const TRENDING_CLAUSES = [
  { id: 1, tag: "§ 12(b)", title: "Digital Services Tax", preview: "2.5% levy on gross transaction value for digital marketplaces…", heat: 98 },
  { id: 2, tag: "§ 34", title: "Motor Vehicle Circulation Tax", preview: "Annual levy based on engine capacity replacing import duty…", heat: 91 },
  { id: 3, tag: "§ 56", title: "Housing Levy Amendment", preview: "Employer contribution rate increased from 1.5% to 3%…", heat: 85 },
  { id: 4, tag: "§ 78", title: "Bread & Cooking Oil VAT", preview: "Re-introduction of 16% VAT on basic foodstuffs…", heat: 80 },
  { id: 5, tag: "§ 91", title: "Eco-levy on Electronics", preview: "Surcharge on imported phones, laptops and solar panels…", heat: 72 },
  { id: 6, tag: "§ 103", title: "Excise Duty – Betting", preview: "Winnings tax raised from 7.5% to 20% of gross winnings…", heat: 67 },
];

const QUICK_PROMPTS = [
  "How does the digital tax affect M-Pesa?",
  "Explain the housing levy hike",
  "What changed from Finance Bill 2023?",
  "Which clauses were withdrawn?",
];

const SUGGESTED = [
  "How does the housing levy affect my monthly salary?",
  "Will VAT on cooking oil increase food prices?",
  "What relief exists for small business owners?",
  "How does the digital services tax affect freelancers?",
  "Explain PAYE changes in plain language",
  "What happens to my mobile money charges?",
];

const SEED_MESSAGES = [
  {
    id: 1,
    role: "ai",
    text: "Habari! I'm **Sheria AI** — your guide through Kenya's Finance Bill 2025.\n\nI can explain any clause in plain Swahili or English, show how a tax change affects your take-home pay, compare this bill to previous years, or flag controversial sections that sparked public debate.\n\nWhat would you like to explore today?",
    time: "09:00",
  },
];

const IMPACT_STYLE = {
  Critical: { bg: "#3d1414", text: "#f87171", border: "#7f1d1d" },
  High:     { bg: "#3d2a0a", text: "#fbbf24", border: "#78350f" },
  Medium:   { bg: "#2a2a0a", text: "#fde047", border: "#713f12" },
  Positive: { bg: "#0a2e1a", text: "#34d399", border: "#065f46" },
};

const SECTOR_COLOR = {
  "Tech & Commerce":  "#38bdf8",
  "Employment":       "#a78bfa",
  "Food Security":    "#fb923c",
  "Finance & Fintech":"#f472b6",
  "Small Business":   "#34d399",
  "Housing":          "#2dd4bf",
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --obsidian:   #0a160f;
        --surface:    #0d1a12;
        --surface2:   #111f16;
        --surface3:   #162a1b;
        --border:     rgba(16,185,129,0.2);
        --gold:       #f59e0b;
        --gold-light: #fbbf24;
        --ember:      #ef4444;
        --sage:       #10b981;
        --text:       #e2e8f0;
        --muted:      #64748b;
        --muted2:     #94a3b8;
        --user-bg:    rgba(245,158,11,0.12);
        --user-border:rgba(245,158,11,0.3);
      }

      html, body { background: var(--obsidian); font-family: 'DM Sans', sans-serif; color: var(--text); }

      .syne { font-family: 'Syne', sans-serif; }
      .dm   { font-family: 'DM Sans', sans-serif; }

      /* Geometric African-pattern background */
      .geo-bg {
        background-color: var(--obsidian);
        background-image:
          radial-gradient(circle at 15% 85%, rgba(16,185,129,0.10) 0%, transparent 50%),
          radial-gradient(circle at 85% 15%, rgba(245,158,11,0.07) 0%, transparent 50%),
          repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.012) 30px, rgba(255,255,255,0.012) 31px);
      }

      /* Scrollbar */
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 2px; }

      /* Page transition */
      @keyframes page-in {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .page-in { animation: page-in 0.4s cubic-bezier(.22,.68,0,1.1) forwards; }

      /* Chat message enter */
      @keyframes msg-in {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .msg-in { animation: msg-in 0.32s cubic-bezier(.22,.68,0,1.2) forwards; }

      /* Typing dots */
      @keyframes dot-bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: .35; }
        40%            { transform: translateY(-5px); opacity: 1; }
      }
      .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sage); display: inline-block; }
      .dot:nth-child(1) { animation: dot-bounce 1.2s ease-in-out infinite 0s; }
      .dot:nth-child(2) { animation: dot-bounce 1.2s ease-in-out infinite .2s; }
      .dot:nth-child(3) { animation: dot-bounce 1.2s ease-in-out infinite .4s; }

      /* Heat bar */
      @keyframes heat-fill { from { width: 0%; } }
      .heat-bar { animation: heat-fill .8s ease forwards; }

      /* Sidebar slide */
      @keyframes slide-right {
        from { opacity: 0; transform: translateX(-16px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .slide-right { animation: slide-right .35s ease forwards; }

      /* Sidebar mobile */
      @keyframes sidebar-slide {
        from { transform: translateX(-100%); }
        to   { transform: translateX(0); }
      }
      .sidebar-mobile { animation: sidebar-slide .28s cubic-bezier(.4,0,.2,1) forwards; }

      /* Pulse / blink for hero */
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

      /* Glow on send button */
      @keyframes glow-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,.4); }
        50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
      }
      .glow-pulse:not(:disabled) { animation: glow-pulse 2.5s ease-in-out infinite; }

      /* Sidebar overlay */
      .sidebar-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,.65);
        z-index: 40; backdrop-filter: blur(3px);
      }

      textarea:focus, input:focus { outline: none; }
      button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

      .chip {
        cursor: pointer;
        transition: background .15s, color .15s, transform .1s;
        white-space: nowrap;
      }
      .chip:hover { background: rgba(245,158,11,.18) !important; color: var(--gold-light) !important; transform: translateY(-1px); }
      .chip:active { transform: translateY(0); }

      .clause-card-chat {
        transition: background .15s, border-color .15s, transform .15s;
        cursor: pointer;
      }
      .clause-card-chat:hover {
        background: var(--surface3) !important;
        border-color: var(--gold) !important;
        transform: translateX(3px);
      }

      .send-btn { transition: background .15s, transform .1s; }
      .send-btn:not(:disabled):hover { filter: brightness(1.15); transform: scale(1.05); }
      .send-btn:not(:disabled):active { transform: scale(.97); }

      .nav-link {
        color: var(--muted2); font-size: 13px; font-weight: 500;
        text-decoration: none; transition: color 0.2s;
      }
      .nav-link:hover { color: var(--gold-light); }

      .trending-card {
        transition: all 0.25s;
        cursor: pointer;
      }
      .trending-card:hover {
        border-color: rgba(16,185,129,0.45) !important;
        background: var(--surface2) !important;
        transform: translateY(-2px);
      }
    `}</style>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatTime() {
  return new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

function parseMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 600, color: var_gold_light }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// small helper so we can use CSS var string in JSX
const var_gold_light = "#fbbf24";

function renderText(text) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    const numbered = line.match(/^(\d+)\.\s+(.*)/);
    if (numbered)
      return (
        <p key={i} style={{ display: "flex", gap: 8, marginBottom: 2 }}>
          <span style={{ color: "#fbbf24", fontWeight: 700, minWidth: "1.2rem" }}>{numbered[1]}.</span>
          <span>{parseMarkdown(numbered[2])}</span>
        </p>
      );
    return <p key={i} style={{ marginBottom: 2, lineHeight: 1.65 }}>{parseMarkdown(line)}</p>;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED LOGO
// ─────────────────────────────────────────────────────────────────────────────

function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <rect x="4"  y="4"  width="14" height="14" rx="2" fill="#f59e0b" />
      <rect x="18" y="4"  width="14" height="14" rx="2" fill="#059669" />
      <rect x="4"  y="18" width="14" height="14" rx="2" fill="#059669" />
      <rect x="18" y="18" width="14" height="14" rx="2" fill="#f59e0b" />
      <rect x="10" y="10" width="16" height="16" rx="2" fill="#0a160f" />
      <rect x="14" y="14" width="8"  height="8"  rx="1" fill="#fbbf24" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── HOMEPAGE COMPONENTS ──────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// Navbar
function Navbar({ onOpenChat }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(10,22,15,0.96)" : "transparent",
      borderBottom: scrolled ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      transition: "all 0.3s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <div>
            <div className="syne" style={{ fontWeight: 900, color: "#fff", fontSize: 18, lineHeight: 1 }}>BillScope</div>
            <div style={{ fontSize: 9, color: "#10b981", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}>Kenya Finance Bill</div>
          </div>
        </div>

        {/* Desktop nav */}
        <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="desktop-nav">
          {["Overview", "Clauses", "Impact", "Resources"].map(l => (
            <a key={l} href="#" className="nav-link">{l}</a>
          ))}
          {/* ── THE KEY BUTTON: opens AI chat ── */}
          <button
            onClick={onOpenChat}
            style={{ padding: "8px 20px", background: "#f59e0b", color: "#000", fontWeight: 800, fontSize: 13, border: "none", borderRadius: 20, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fbbf24"}
            onMouseLeave={e => e.currentTarget.style.background = "#f59e0b"}
          >
            Analyze a Clause →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 4 }}
          className="mobile-menu-btn"
          aria-label="Menu"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 22 22">
            <rect y="3"  width="22" height="2" rx="1" fill="currentColor"/>
            <rect y="10" width="16" height="2" rx="1" fill="currentColor"/>
            <rect y="17" width="11" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{ background: "rgba(10,22,15,0.98)", borderTop: "1px solid rgba(16,185,129,0.2)", padding: "16px 24px 20px" }}>
          {["Overview", "Clauses", "Impact", "Resources"].map(l => (
            <a key={l} href="#" className="nav-link" style={{ display: "block", padding: "10px 0", borderBottom: "1px solid rgba(16,185,129,0.1)" }}>{l}</a>
          ))}
          <button
            onClick={() => { setMobileOpen(false); onOpenChat(); }}
            style={{ marginTop: 14, width: "100%", padding: "12px", background: "#f59e0b", color: "#000", fontWeight: 800, fontSize: 14, border: "none", borderRadius: 12, cursor: "pointer" }}
          >
            Analyze a Clause →
          </button>
        </div>
      )}

      {/* Responsive styles for navbar */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

// Hero section
function Hero({ onOpenChat }) {
  const [typed, setTyped] = useState("");
  const full = "Demystifying Kenya's Finance Bill — one clause at a time.";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { setTyped(full.slice(0, ++i)); if (i >= full.length) clearInterval(t); }, 40);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a160f", position: "relative", overflow: "hidden", paddingTop: 80 }}>
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", right: "20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        {/* Live badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.08)", marginBottom: 32 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.15em", textTransform: "uppercase" }}>Finance Bill 2025 — Live Analysis</span>
        </div>

        {/* Headline */}
        <h1 className="syne" style={{ fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 24px" }}>
          Understand the{" "}
          <span style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Finance Bill</span>
          <br />before it shapes your life.
        </h1>

        {/* Typewriter */}
        <p style={{ fontSize: 18, color: "#94a3b8", maxWidth: 640, margin: "0 auto 12px", lineHeight: 1.7, fontWeight: 300 }}>
          {typed}<span style={{ animation: "blink 1s infinite" }}>|</span>
        </p>
        <p style={{ fontSize: 14, color: "#64748b", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.6 }}>
          AI-powered plain-language analysis of every clause — its impact on your income, business, and daily costs.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {/* ── PRIMARY CTA ── opens AI chat */}
          <button
            onClick={onOpenChat}
            style={{ padding: "14px 32px", background: "#f59e0b", color: "#000", fontWeight: 800, fontSize: 15, border: "none", borderRadius: 32, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fbbf24"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Analyze a Clause →
          </button>
          <button style={{ padding: "14px 32px", border: "1px solid rgba(16,185,129,0.5)", color: "#10b981", fontWeight: 700, fontSize: 15, borderRadius: 32, cursor: "pointer", background: "transparent", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            Read Full Bill
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 400, margin: "64px auto 0" }}>
          {[["98", "Clauses Indexed"], ["24/7", "Live Updates"], ["Plain", "Language AI"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div className="syne" style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{v}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, letterSpacing: "0.05em" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Chatbot Preview (homepage teaser section)
function ChatbotPreview({ onOpenChat }) {
  const [messages, setMessages] = useState([
    { role: "user", text: "How does Clause 14 affect small e-commerce sellers on Jumia?" },
    { role: "ai",   text: "Clause 14 introduces a 1.5% Digital Services Tax on gross transaction value. For small Jumia sellers, the platform as marketplace operator is liable — but this cost is likely passed down through increased commission rates. Sellers earning under KSh 5M annually may qualify for the SME relief under Clause 63, which could offset some impact." },
    { role: "user", text: "What about the mobile money levy increase?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Uses the Gemini API via @google/generative-ai
  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    const newMsgs = [...messages, { role: "user", text: q }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      // Start a Gemini chat with a system instruction and the prior conversation
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction:
          "You are BillScope AI, an expert on Kenya's Finance Bill 2025. Answer questions in plain, accessible language. Be concise (2-4 sentences). Reference specific clauses when relevant. You understand English, Swahili, and Sheng.",
      });

      // Build history from all messages except the last user message (that's the new prompt)
      const history = newMsgs.slice(0, -1).map((m) => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(q);
      const text = result.response.text();
      setMessages([...newMsgs, { role: "ai", text }]);
    } catch (err) {
      console.error("Gemini error:", err);
      setMessages([...newMsgs, { role: "ai", text: "Something went wrong. Please check your API key and try again." }]);
    }
    setLoading(false);
  };

  return (
    <section style={{ padding: "96px 0", background: "#0a160f" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="preview-grid">
        {/* Left: pitch text */}
        <div>
          <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.15em", textTransform: "uppercase" }}>AI Chatbot — Live</span>
          </div>
          <h2 className="syne" style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, margin: "0 0 20px" }}>
            Ask anything.<br />
            <span style={{ background: "linear-gradient(90deg, #34d399, #2dd4bf)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Get clarity instantly.</span>
          </h2>
          <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.7, marginBottom: 28, fontWeight: 300 }}>
            Our AI has read every page of the Finance Bill 2025. Ask in English, Swahili, or Sheng — it understands the bill better than most lawyers.
          </p>
          {["Clause-by-clause plain-language breakdowns", "Personalized impact by income bracket", "Cross-referenced with previous Finance Acts", "Cites exact bill sections in every response"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <span style={{ color: "#10b981", fontSize: 10, fontWeight: 900 }}>✓</span>
              </div>
              <span style={{ fontSize: 14, color: "#cbd5e1" }}>{f}</span>
            </div>
          ))}
          {/* Open full chat CTA */}
          <button
            onClick={onOpenChat}
            style={{ marginTop: 24, padding: "12px 28px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", fontWeight: 700, fontSize: 14, borderRadius: 24, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; }}
          >
            Open Full AI Chat →
          </button>
        </div>

        {/* Right: mini chat window */}
        <div style={{ position: "relative" }}>
          <div style={{ background: "#111f16", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, overflow: "hidden", boxShadow: "0 0 60px rgba(16,185,129,0.08)" }}>
            {/* Chat header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid rgba(16,185,129,0.15)", background: "#0d1a12" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #0d9488)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontSize: 14 }}>🤖</span>
                <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "#10b981", border: "2px solid #0d1a12" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>BillScope AI</div>
                <div style={{ fontSize: 11, color: "#10b981" }}>Analyzing Finance Bill 2025</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {["#ef4444","#f59e0b","#10b981"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
              </div>
            </div>

            {/* Messages */}
            <div style={{ padding: 16, height: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
                  {m.role === "ai" && <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#134e2a", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>🤖</div>}
                  <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: 13, lineHeight: 1.6, background: m.role === "user" ? "rgba(245,158,11,0.15)" : "#0d1a12", border: m.role === "user" ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(16,185,129,0.2)", color: m.role === "user" ? "#fde68a" : "#cbd5e1" }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#134e2a", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>🤖</div>
                  <div style={{ padding: "10px 14px", borderRadius: "18px 18px 18px 4px", background: "#0d1a12", border: "1px solid rgba(16,185,129,0.2)", display: "flex", gap: 5, alignItems: "center" }}>
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "0 14px 14px" }}>
              <div style={{ display: "flex", gap: 8, background: "#0d1a12", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: "8px 12px" }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Ask about any clause..."
                  style={{ flex: 1, background: "transparent", border: "none", fontSize: 13, color: "#fff" }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  style={{ width: 32, height: 32, borderRadius: 8, background: input.trim() && !loading ? "#f59e0b" : "rgba(245,158,11,0.3)", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", color: "#000", fontWeight: 900, fontSize: 14 }}
                >→</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .preview-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}

// Trending Clauses grid
function TrendingClauses({ onOpenChat }) {
  return (
    <section style={{ padding: "96px 0", background: "#080f0a" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: "0.15em", textTransform: "uppercase" }}>Most Discussed</span>
            </div>
            <h2 className="syne" style={{ fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 900, color: "#fff", margin: 0 }}>
              Trending{" "}
              <span style={{ background: "linear-gradient(90deg, #fbbf24, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Clauses</span>
            </h2>
          </div>
          <a href="#" style={{ fontSize: 14, color: "#10b981", fontWeight: 600, textDecoration: "none" }}>View all 98 clauses →</a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {CLAUSES.map((c) => {
            const imp = IMPACT_STYLE[c.impact] || IMPACT_STYLE.Medium;
            const sec = SECTOR_COLOR[c.sector] || "#94a3b8";
            return (
              <div
                key={c.id}
                className="trending-card"
                style={{ background: "#0d1a12", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: 20, position: "relative", overflow: "hidden" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#10b981", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>{c.id}</div>
                    <div className="syne" style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{c.title}</div>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", background: imp.bg, color: imp.text, border: `1px solid ${imp.border}`, flexShrink: 0 }}>{c.impact}</span>
                </div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: "0 0 14px", fontWeight: 300 }}>{c.summary}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: sec }}>{c.sector}</span>
                  <button
                    onClick={onOpenChat}
                    style={{ fontSize: 12, color: "#64748b", fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#fbbf24"}
                    onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
                  >
                    Analyze →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Ask section (homepage inline Q&A)
function AskSection({ onOpenChat }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    setAnswer("");
    setLoading(true);
    try {
      // Single-turn query — no prior conversation history needed here
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction:
          "You are BillScope AI, an expert on Kenya's Finance Bill 2025. Give a clear, plain-language answer in 3-5 sentences. Reference specific clauses. Be helpful to ordinary Kenyans.",
      });
      const result = await model.generateContent(question);
      setAnswer(result.response.text());
    } catch (err) {
      console.error("Gemini error:", err);
      setAnswer("Something went wrong. Please check your API key and try again.");
    }
    setLoading(false);
  };

  return (
    <section id="ask-section" style={{ padding: "96px 0", background: "#0a160f", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)", transform: "translate(50%,50%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.08)", marginBottom: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#10b981", letterSpacing: "0.15em", textTransform: "uppercase" }}>Free to Use</span>
        </div>
        <h2 className="syne" style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, margin: "0 0 16px" }}>
          Ask About the<br />
          <span style={{ background: "linear-gradient(90deg, #fbbf24, #fde047, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Finance Bill</span>
        </h2>
        <p style={{ fontSize: 17, color: "#94a3b8", marginBottom: 36, fontWeight: 300, lineHeight: 1.6 }}>No legal jargon. No paywalls. Just clear answers about what the bill means for you.</p>

        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto 16px" }}>
          <div style={{ background: "#111f16", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 16, padding: 10, display: "flex", gap: 10 }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && ask(q)}
              placeholder="e.g. How does Clause 27 affect someone earning KSh 80,000/month?"
              style={{ flex: 1, background: "transparent", border: "none", fontSize: 14, color: "#fff", padding: "6px 8px" }}
            />
            <button
              onClick={() => ask(q)}
              disabled={!q.trim() || loading}
              style={{ padding: "10px 20px", background: !q.trim() || loading ? "rgba(245,158,11,0.35)" : "#f59e0b", color: "#000", fontWeight: 800, fontSize: 13, border: "none", borderRadius: 10, cursor: !q.trim() || loading ? "default" : "pointer" }}
            >
              {loading ? "…" : "Ask AI"}
            </button>
          </div>
        </div>

        {answer && (
          <div style={{ maxWidth: 640, margin: "0 auto 24px", background: "#111f16", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14, padding: 20, textAlign: "left" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #0d9488)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12 }}>🤖</div>
              <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, paddingTop: 6 }}>BillScope AI</div>
            </div>
            <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>{answer}</p>
            <button
              onClick={onOpenChat}
              style={{ marginTop: 14, padding: "8px 18px", background: "transparent", border: "1px solid rgba(16,185,129,0.35)", color: "#10b981", fontSize: 12, fontWeight: 700, borderRadius: 20, cursor: "pointer" }}
            >
              Continue in full chat →
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
          {SUGGESTED.map(s => (
            <button
              key={s}
              onClick={() => { setQ(s); ask(s); }}
              style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)", fontSize: 12, color: "#94a3b8", cursor: "pointer", transition: "all 0.2s", fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fbbf24"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)"; }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer style={{ background: "#080f0a", borderTop: "1px solid rgba(16,185,129,0.15)", padding: "64px 0 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 48, marginBottom: 40 }} className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Logo size={32} />
              <span className="syne" style={{ fontWeight: 900, color: "#fff", fontSize: 18 }}>BillScope</span>
            </div>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 280, fontWeight: 300 }}>An independent civic-tech platform providing AI-powered analysis of Kenya's Finance Bill for every citizen.</p>
          </div>
          {[
            { title: "Platform", links: ["About", "How it Works", "Privacy Policy", "Terms of Use"] },
            { title: "Resources", links: ["Full Bill PDF", "Past Finance Acts", "Impact Calculator", "FAQ"] }
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 style={{ fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>{title}</h4>
              {links.map(l => (
                <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "#64748b", textDecoration: "none", marginBottom: 10, fontWeight: 500, transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "#fbbf24"}
                  onMouseLeave={e => e.target.style.color = "#64748b"}
                >{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(16,185,129,0.1)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#475569" }}>© 2025 BillScope. Not affiliated with the Government of Kenya. For informational purposes only.</span>
          <span style={{ fontSize: 12, color: "#475569" }}>Built with ❤️ for Kenyan citizens.</span>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── AI CHAT VIEW (full Sheria AI interface) ──────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// Heat bar for sidebar
function HeatBar({ value }) {
  const color = value > 85 ? "#ef4444" : value > 70 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ width: "100%", borderRadius: 999, overflow: "hidden", height: 3, background: "rgba(255,255,255,0.08)" }}>
      <div className="heat-bar" style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 999 }} />
    </div>
  );
}

// Sidebar clause card
function ClauseCard({ clause, onAsk }) {
  return (
    <div
      className="clause-card-chat"
      style={{ background: "var(--surface2)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: 12 }}
      onClick={() => onAsk(`Explain ${clause.tag} – ${clause.title}`)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#f59e0b", letterSpacing: "0.05em" }}>
          {clause.tag}
        </span>
        <span style={{ fontSize: 10, color: "#64748b" }}>🔥 {clause.heat}</span>
      </div>
      <p className="syne" style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{clause.title}</p>
      <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, marginBottom: 8 }}>{clause.preview}</p>
      <HeatBar value={clause.heat} />
    </div>
  );
}

// Chat sidebar
function ChatSidebar({ onAsk, mobile, onClose }) {
  const inner = (
    <aside
      className={mobile ? "sidebar-mobile" : "slide-right"}
      style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0d1a12", borderRight: "1px solid rgba(16,185,129,0.15)", width: mobile ? 280 : "100%" }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: "1px solid rgba(16,185,129,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={28} />
          <div>
            <div className="syne" style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1 }}>Sheria<span style={{ color: "#ef4444" }}>AI</span></div>
            <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>Finance Bill Analyzer</div>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 18, lineHeight: 1 }}>✕</button>
        )}
      </div>

      {/* Bill badge */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ borderRadius: 12, padding: 12, background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.07))", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="syne" style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 2 }}>📜 Finance Bill 2025</p>
          <p style={{ fontSize: 10, color: "#64748b" }}>National Assembly, Kenya · 127 clauses analysed</p>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(16,185,129,0.2)", color: "#10b981" }}>✓ In committee</span>
          </div>
        </div>
      </div>

      {/* Trending */}
      <div style={{ padding: "4px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="syne" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>Trending Clauses</p>
        <span style={{ fontSize: 10, color: "#ef4444" }}>Live</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {TRENDING_CLAUSES.map((c, i) => (
          <div key={c.id} className="slide-right" style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}>
            <ClauseCard clause={c} onAsk={onAsk} />
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(16,185,129,0.1)", fontSize: 10, color: "#475569", textAlign: "center" }}>
        Built for civic transparency · Kenya 🇰🇪
      </div>
    </aside>
  );

  if (mobile) {
    return (
      <>
        <div className="sidebar-overlay" onClick={onClose} />
        <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50, width: 280 }}>{inner}</div>
      </>
    );
  }
  return inner;
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="msg-in" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "6px 20px" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>⚖</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: "18px 18px 18px 4px", background: "var(--surface2)", border: "1px solid rgba(16,185,129,0.15)" }}>
        <span className="dot" /><span className="dot" /><span className="dot" />
      </div>
    </div>
  );
}

// Chat message bubble
function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className="msg-in" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "6px 20px", flexDirection: isUser ? "row-reverse" : "row" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: isUser ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.15)", color: isUser ? "#10b981" : "#f59e0b" }}>
        {isUser ? "U" : "⚖"}
      </div>
      <div style={{ maxWidth: "75%" }}>
        <div className="dm" style={{ fontSize: 14, lineHeight: 1.65, borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", background: isUser ? "rgba(245,158,11,0.12)" : "var(--surface2)", border: `1px solid ${isUser ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.15)"}`, color: isUser ? "#fde68a" : "#e2e8f0" }}>
          {renderText(msg.text)}
        </div>
        <p style={{ fontSize: 10, color: "#475569", marginTop: 4, textAlign: isUser ? "right" : "left" }}>{msg.time}</p>
      </div>
    </div>
  );
}

// Quick prompt chips
function QuickChips({ onSend }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
      {QUICK_PROMPTS.map(q => (
        <button
          key={q}
          onClick={() => onSend(q)}
          className="chip dm"
          style={{ fontSize: 11, padding: "6px 12px", borderRadius: 999, flexShrink: 0, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(16,185,129,0.2)", color: "#64748b" }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}

// Full chat view
function ChatView({ onBack }) {
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Uses the Gemini API via @google/generative-ai
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;

    const userMsg = { id: Date.now(), role: "user", text: trimmed, time: formatTime() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsTyping(true);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction:
          "You are Sheria AI — an expert on Kenya's Finance Bill 2025 and previous Finance Acts. Explain clauses in plain language (English or Swahili). Use **bold** for key terms. Be thorough but accessible. Reference section numbers where relevant. You care deeply about civic education and ordinary Kenyans.",
      });

      // Convert all prior messages (excluding the new user message) to Gemini history format.
      // Gemini requires the history to start with a "user" turn, so we skip the
      // opening AI greeting (SEED_MESSAGES[0]) if it's the very first message.
      const historyMsgs = updatedMsgs.slice(0, -1); // everything before the current user msg
      const history = historyMsgs
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "ai" ? "model" : "user",
          parts: [{ text: m.text }],
        }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(trimmed);
      const aiText = result.response.text();
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: aiText, time: formatTime() }]);
    } catch (err) {
      console.error("Gemini error:", err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "ai", text: "Something went wrong. Please check your API key and try again.", time: formatTime() },
      ]);
    }
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px"; }
  };

  return (
    <div className="page-in geo-bg" style={{ height: "100dvh", display: "flex", overflow: "hidden", color: "var(--text)" }}>

      {/* Desktop sidebar */}
      <div style={{ width: 260, flexShrink: 0, display: "none" }} className="chat-sidebar-desktop">
        <ChatSidebar onAsk={sendMessage} mobile={false} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <ChatSidebar onAsk={(t) => { sendMessage(t); setSidebarOpen(false); }} mobile onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main chat panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#0a160f" }}>

        {/* Top bar */}
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(16,185,129,0.15)", background: "#0d1a12", flexShrink: 0 }}>
          {/* Mobile menu */}
          <button
            className="mobile-sidebar-btn"
            onClick={() => setSidebarOpen(true)}
            style={{ display: "none", padding: 6, borderRadius: 8, background: "var(--surface2)", border: "1px solid rgba(16,185,129,0.2)", color: "#f59e0b", cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect y="2" width="16" height="1.5" rx=".75" fill="currentColor"/>
              <rect y="7.25" width="12" height="1.5" rx=".75" fill="currentColor"/>
              <rect y="12.5" width="9" height="1.5" rx=".75" fill="currentColor"/>
            </svg>
          </button>

          {/* Back to homepage */}
          <button
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.1)"}
          >
            ← Home
          </button>

          <div style={{ flex: 1 }}>
            <p className="syne" style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1 }}>Sheria AI — Finance Bill Analysis</p>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>AI-powered clause interpretation</p>
          </div>

          <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 999, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", flexShrink: 0 }}>● Online</span>
        </header>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 0", overscrollBehavior: "contain" }}>
          {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ flexShrink: 0, padding: "12px 16px 16px", borderTop: "1px solid rgba(16,185,129,0.15)", background: "#0d1a12" }}>
          <div style={{ marginBottom: 12 }}>
            <QuickChips onSend={sendMessage} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "10px 14px", borderRadius: 16, background: "var(--surface2)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any clause, tax change, or impact…"
              rows={1}
              className="dm"
              style={{ flex: 1, resize: "none", background: "transparent", border: "none", fontSize: 14, lineHeight: 1.6, color: "#e2e8f0", minHeight: 24, maxHeight: 120, overflowY: "auto" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="send-btn glow-pulse"
              style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: input.trim() && !isTyping ? "pointer" : "not-allowed", background: input.trim() && !isTyping ? "#f59e0b" : "rgba(255,255,255,0.08)", color: input.trim() && !isTyping ? "#000" : "#475569" }}
            >
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                <path d="M13.5 7.5L1.5 1.5L4.5 7.5L1.5 13.5L13.5 7.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p style={{ fontSize: 10, color: "#475569", textAlign: "center", marginTop: 8 }}>Sheria AI may be inaccurate. Verify with official gazette notices.</p>
        </div>
      </div>

      {/* Responsive: show sidebar on desktop, hide on mobile */}
      <style>{`
        @media (min-width: 769px) {
          .chat-sidebar-desktop { display: block !important; }
          .mobile-sidebar-btn   { display: none !important; }
        }
        @media (max-width: 768px) {
          .chat-sidebar-desktop { display: none !important; }
          .mobile-sidebar-btn   { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── HOMEPAGE VIEW ────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function HomepageView({ onOpenChat }) {
  return (
    <div className="page-in" style={{ fontFamily: "'DM Sans', sans-serif", background: "#0a160f", minHeight: "100vh" }}>
      <Navbar onOpenChat={onOpenChat} />
      <Hero onOpenChat={onOpenChat} />
      <ChatbotPreview onOpenChat={onOpenChat} />
      <TrendingClauses onOpenChat={onOpenChat} />
      <AskSection onOpenChat={onOpenChat} />
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ROOT APP — controls which view is shown ──────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // "home" | "chat"  ← the only state that drives navigation
  const [view, setView] = useState("home");

  const openChat = () => {
    setView("chat");
    // Scroll to top in case user was mid-page
    window.scrollTo({ top: 0 });
  };

  const goHome = () => {
    setView("home");
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <GlobalStyles />
      {view === "home" ? (
        <HomepageView onOpenChat={openChat} />
      ) : (
        <ChatView onBack={goHome} />
      )}
    </>
  );
}
