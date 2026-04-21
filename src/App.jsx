import { useState, useRef, useEffect } from "react";

// ─── SCROLL STYLE ──────────────────────────────────────────────────────────────
const SCROLL_CSS = [
  "*::-webkit-scrollbar{width:6px;height:6px}",
  "*::-webkit-scrollbar-track{background:transparent}",
  "*::-webkit-scrollbar-thumb{background:#334155;border-radius:6px}",
  "*::-webkit-scrollbar-thumb:hover{background:#475569}",
  "*{scrollbar-width:thin;scrollbar-color:#334155 transparent}",
].join(" ");
function GStyle() { return <style>{SCROLL_CSS}</style>; }

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const C = {
  co: "HealthWorksAI",
  app: "EOC Playground",
  ver: "1.0.0",
};

// ─── UTILS ─────────────────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2, 9);
const tstr = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function mdHtml(md) {
  if (!md) return "";
  const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const inl = (s) =>
    esc(s)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code style='background:#F1F5F9;padding:1px 5px;border-radius:4px;font-size:.9em'>$1</code>");
  const out = []; let iL = false;
  const cL = () => { if (iL) { out.push("</ul>"); iL = false; } };
  md.split("\n").forEach((raw) => {
    const l = raw.trimEnd();
    if (l.startsWith("### ")) {
      cL();
      out.push("<h4 style='font-size:.85em;font-weight:700;margin:10px 0 3px;color:#7C3AED'>" + inl(l.slice(4)) + "</h4>");
    } else if (l.startsWith("## ")) {
      cL();
      out.push("<h3 style='font-size:.92em;font-weight:700;margin:12px 0 4px;color:#0F172A'>" + inl(l.slice(3)) + "</h3>");
    } else if (/^[-*] .+/.test(l)) {
      if (!iL) { out.push("<ul style='padding-left:14px;margin:4px 0'>"); iL = true; }
      out.push("<li style='margin:3px 0;font-size:.9em'>" + inl(l.replace(/^[-*] /, "")) + "</li>");
    } else if (/^\d+\. .+/.test(l)) {
      cL();
      out.push("<p style='margin:2px 0;font-size:.9em'>" + inl(l) + "</p>");
    } else if (l.trim() === "") {
      cL(); out.push("<br/>");
    } else {
      cL();
      out.push("<p style='margin:3px 0;font-size:.9em'>" + inl(l) + "</p>");
    }
  });
  cL();
  return out.join("");
}

function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: "50%", background: "#94A3B8",
          display: "inline-block",
          animation: `dt 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}/>
      ))}
      <style>{"@keyframes dt{0%,60%,100%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}"}</style>
    </span>
  );
}

// ─── FILTER OPTIONS ───────────────────────────────────────────────────────────
const SALES_REGIONS = ["ALL"];

const STATES = [
  "All States", "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii",
  "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

const COUNTIES_BY_STATE = {
  "All States":    ["All Counties"],
  "California":    ["All Counties","Los Angeles","San Diego","Orange","Riverside","San Bernardino","Santa Clara","Alameda","Sacramento"],
  "Florida":       ["All Counties","Miami-Dade","Broward","Palm Beach","Hillsborough","Orange","Pinellas","Duval","Lee"],
  "Texas":         ["All Counties","Harris","Dallas","Tarrant","Bexar","Travis","Collin","Denton","El Paso"],
  "New York":      ["All Counties","New York","Kings","Queens","Bronx","Richmond","Nassau","Suffolk"],
  "Georgia":       ["All Counties","Fulton","Gwinnett","Cobb","DeKalb","Cherokee","Forsyth"],
  "Ohio":          ["All Counties","Cuyahoga","Franklin","Hamilton","Summit","Montgomery"],
  "Pennsylvania":  ["All Counties","Philadelphia","Allegheny","Montgomery","Bucks","Delaware"],
  "Michigan":      ["All Counties","Wayne","Oakland","Macomb","Kent","Genesee"],
  "North Carolina":["All Counties","Mecklenburg","Wake","Guilford","Forsyth","Durham"],
  "Illinois":      ["All Counties","Cook","DuPage","Lake","Will","Kane"],
};

// Medicare Advantage plan types (CMS-sourced)
const PLAN_TYPES = [
  "All Plan Types",
  "HMO",
  "HMO-POS",
  "Local HMO",
  "Local HMO-POS",
  "PPO",
  "Regional PPO",
  "PFFS",
  "MSA",
  "Cost",
  "PACE",
];

const SNP_TYPES = [
  "All SNP Types",
  "D-SNP",
  "I-SNP",
  "C-SNP",
  "Non-SNP",
];

const PAYORS = [
  "All Payors","Humana","UnitedHealthcare","Aetna / CVS Health",
  "Elevance Health","Centene","Kaiser Permanente","Devoted Health",
  "Molina Healthcare","Cigna","SCAN Group",
];

// Plan Name — no values yet, populated dynamically
const PLAN_NAMES = ["All Plan Names"];

// ─── STARTER PILLS ────────────────────────────────────────────────────────────
const DOC_PILLS = [
  "What is the out-of-pocket maximum for in-network services?",
  "Does this plan cover dental implants?",
  "What are the exclusions for orthodontic services?",
  "What prior authorization is required for specialist visits?",
  "How is emergency care covered outside the service area?",
  "What are the annual dental maximum benefit limits?",
  "Are there any waiting periods for major dental services?",
  "What cost-sharing applies to oral surgery?",
];

// ─── BACKEND API CALLS ────────────────────────────────────────────────────────
// TODO: BACKEND — Replace the stub responses below once your RAG backend is ready.
// The frontend calls POST /api/docs with:
//   { action: "query", question: string, doc_type: "all"|"eoc"|"dental" }  → returns { answer, sources }
//   { action: "stats" }                                                     → returns { eoc, dental, total, ready }
// See api/docs.js for the stub + integration notes.

async function queryDocuments(question, filters = {}) {
  try {
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "query", question, filters }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || "Docs API " + res.status);
    }
    return res.json();
  } catch (e) {
    throw new Error("Document search failed: " + e.message);
  }
}

async function fetchDocStats() {
  try {
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stats" }),
    });
    return res.ok ? res.json() : { eoc: 0, dental: 0, total: 0, ready: false };
  } catch (_) {
    return { eoc: 0, dental: 0, total: 0, ready: false };
  }
}

// ─── SOURCE CHIP ─────────────────────────────────────────────────────────────
function SourceChip({ src }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen((o) => !o)}
      style={{
        background: "#F5F3FF", border: "1px solid #DDD6FE",
        borderRadius: 7, padding: "5px 9px", cursor: "pointer",
        marginBottom: 4, fontSize: 11,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7C3AED", fontWeight: 600 }}>
        <span style={{ fontSize: 12 }}>{src.doc_type === "dental" ? "🦷" : "📋"}</span>
        <span style={{ flex: 1 }}>{src.doc_name}</span>
        <span style={{ color: "#A78BFA", fontSize: 10 }}>p.{src.page} · {src.section}</span>
        <span style={{ fontSize: 9, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          marginTop: 6, padding: "7px 8px", background: "#EDE9FE",
          borderRadius: 5, fontSize: 11, color: "#4C1D95", lineHeight: 1.65,
          borderLeft: "2px solid #7C3AED", paddingLeft: 10,
        }}>
          {src.chunk_text}
        </div>
      )}
    </div>
  );
}

// ─── CHAT MESSAGE ─────────────────────────────────────────────────────────────
function DocMsg({ msg }) {
  const isU = msg.role === "user";
  if (isU) return (
    <div style={{
      alignSelf: "flex-end", maxWidth: "80%",
      background: "#7C3AED", color: "#fff",
      padding: "9px 14px", borderRadius: "12px 3px 12px 12px",
      fontSize: 13, lineHeight: 1.55,
    }}>
      {msg.content}
      <div style={{ fontSize: 9.5, opacity: 0.6, marginTop: 3, textAlign: "right" }}>
        {tstr(msg.ts)}
      </div>
    </div>
  );
  return (
    <div style={{ alignSelf: "flex-start", maxWidth: "88%" }}>
      <div style={{
        background: "#fff", border: "1px solid #E2E8F0",
        padding: "10px 14px", borderRadius: "3px 12px 12px 12px",
        fontSize: 13, lineHeight: 1.6, marginBottom: 6,
      }}>
        {msg.loading
          ? <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#94A3B8", fontSize: 12 }}>
              <Dots/>Searching documents...
            </span>
          : <div dangerouslySetInnerHTML={{ __html: mdHtml(msg.content) }}/>
        }
      </div>
      {!msg.loading && msg.sources && msg.sources.length > 0 && (
        <div>
          <div style={{
            fontSize: 9.5, fontWeight: 600, color: "#94A3B8",
            textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5,
          }}>
            {msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""} retrieved
          </div>
          {msg.sources.map((s, i) => <SourceChip key={i} src={s}/>)}
        </div>
      )}
      {!msg.loading && (
        <div style={{ fontSize: 9.5, color: "#CBD5E1", marginTop: 3 }}>
          {tstr(msg.ts)}
          {msg.mock && (
            <span style={{ marginLeft: 7, color: "#F59E0B", fontWeight: 600 }}>
              · Demo mode
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR — ChatGPT-style history ─────────────────────────────────────────
const MOCK_HISTORY = [
  { id: "h1", label: "OOP max for in-network?",        time: "2h ago" },
  { id: "h2", label: "Dental implant coverage",        time: "Yesterday" },
  { id: "h3", label: "Prior auth for specialist",      time: "Yesterday" },
  { id: "h4", label: "Emergency care outside area",    time: "Mon" },
  { id: "h5", label: "Ortho exclusions explained",     time: "Mon" },
  { id: "h6", label: "Annual dental max limits",       time: "Sun" },
  { id: "h7", label: "Waiting periods major dental",   time: "Sun" },
  { id: "h8", label: "Oral surgery cost-sharing",      time: "Last week" },
];

function Sidebar({ collapsed, onToggle, activeHistory, onSelectHistory, onNewChat }) {
  return collapsed ? (
    <aside style={{
      width: 44, background: "#fff", display: "flex",
      flexDirection: "column", alignItems: "center",
      flexShrink: 0, borderRight: "1px solid #E5E7EB",
    }}>
      {/* Logo icon + expand */}
      <div style={{
        padding: "12px 0", borderBottom: "1px solid #E5E7EB",
        width: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 8,
      }}>
        <img
          src="https://drlobbystorer1.blob.core.windows.net/images/HWAI_Logo_Full.svg?v=1"
          alt="HWAI"
          style={{ height: 20, width: 20, objectFit: "contain", filter: "hue-rotate(200deg)" }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <button onClick={onToggle} title="Expand sidebar"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: 0,
          }}>
          ›
        </button>
      </div>
      <div style={{ paddingTop: 10 }}>
        <button onClick={onNewChat} title="New chat"
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: "#F5F3FF", border: "1px solid #DDD6FE",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, color: "#7C3AED",
          }}>
          +
        </button>
      </div>
    </aside>
  ) : (
    <aside style={{
      width: 220, background: "#fff", display: "flex",
      flexDirection: "column", flexShrink: 0,
      borderRight: "1px solid #E5E7EB",
    }}>
      {/* Top: Logo + branding */}
      <div style={{
        padding: "14px 14px 10px", borderBottom: "1px solid #F3F4F6",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src="https://drlobbystorer1.blob.core.windows.net/images/HWAI_Logo_Full.svg?v=1"
            alt="HealthWorksAI"
            style={{ height: 22, width: "auto", display: "block" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
          <span style={{ display: "none", fontWeight: 800, fontSize: 11, color: "#1F2937" }}>
            HealthWorksAI
          </span>
        </div>
        <button onClick={onToggle} title="Collapse"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: 2,
          }}>
          ‹
        </button>
      </div>

      {/* New chat button */}
      <div style={{ padding: "10px 12px 6px", flexShrink: 0 }}>
        <button onClick={onNewChat} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 7,
          padding: "7px 10px", borderRadius: 8, cursor: "pointer",
          fontFamily: "inherit", fontSize: 12, fontWeight: 600,
          background: "#F5F3FF", color: "#7C3AED",
          border: "1px solid #DDD6FE", transition: "all .15s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#EDE9FE"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#F5F3FF"; }}
        >
          <span style={{ fontSize: 16, fontWeight: 300, lineHeight: 1 }}>+</span>
          New conversation
        </button>
      </div>

      {/* History label */}
      <div style={{
        padding: "6px 14px 4px", fontSize: 10, fontWeight: 700,
        color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".08em",
        flexShrink: 0,
      }}>
        Recent
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2px 8px 8px" }}>
        {MOCK_HISTORY.map((h) => {
          const isActive = activeHistory === h.id;
          return (
            <div key={h.id} onClick={() => onSelectHistory(h.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 8px", borderRadius: 7, marginBottom: 1,
                cursor: "pointer", transition: "background .12s",
                background: isActive ? "#F5F3FF" : "transparent",
                borderLeft: isActive ? "2px solid #7C3AED" : "2px solid transparent",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 12, color: isActive ? "#7C3AED" : "#374151",
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  maxWidth: 148,
                }}>
                  {h.label}
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{h.time}</div>
              </div>
              {isActive && (
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#7C3AED", flexShrink: 0 }}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 14px", borderTop: "1px solid #F3F4F6",
        fontSize: 9, color: "#9CA3AF", flexShrink: 0,
      }}>
        <div>v{C.ver} · {C.co}</div>
      </div>
    </aside>
  );
}

// ─── DOC STATS SUMMARY BAR ───────────────────────────────────────────────────
function DocStatsBanner({ salesRegion, state, county, planType, snpType, payor, planName, stats }) {
  const label = [
    salesRegion && salesRegion !== "ALL" ? salesRegion : null,
    state !== "All States" ? state : null,
    county !== "All Counties" ? county : null,
    planType !== "All Plan Types" ? planType : null,
    snpType !== "All SNP Types" ? snpType : null,
    payor !== "All Payors" ? payor : null,
    planName && planName !== "All Plan Names" ? planName : null,
  ].filter(Boolean).join(" · ") || "All Markets";

  const eocCount   = stats ? stats.eoc   : 1000;
  const totalCount = stats ? stats.total : 1000;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 20px", background: "#F5F3FF",
      borderBottom: "1px solid #DDD6FE", flexShrink: 0, gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#7C3AED" }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>
            {totalCount.toLocaleString()} documents available
          </span>
        </div>
        <div style={{ width: 1, height: 13, background: "#DDD6FE" }}/>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>
          {eocCount.toLocaleString()} EOCs available
        </span>
        <div style={{ width: 1, height: 13, background: "#DDD6FE" }}/>
        <span style={{ fontSize: 11, color: "#A78BFA" }}>
          Filtered by: <strong style={{ color: "#7C3AED" }}>{label}</strong>
        </span>
      </div>
      <span style={{
        fontSize: 10, color: "#7C3AED", background: "#EDE9FE",
        padding: "2px 9px", borderRadius: 20, fontWeight: 600,
      }}>
        RAG-powered · citations grounded in source docs
      </span>
    </div>
  );
}


// ─── DOC PLAYGROUND ──────────────────────────────────────────────────────────
function DocPlayground() {
  const [salesRegion, setSalesRegion] = useState("ALL");
  const [state,       setState]       = useState("All States");
  const [county,      setCounty]      = useState("All Counties");
  const [planType,    setPlanType]    = useState("All Plan Types");
  const [snpType,     setSnpType]     = useState("All SNP Types");
  const [payor,       setPayor]       = useState("All Payors");
  const [planName,    setPlanName]    = useState("All Plan Names");
  const [query,  setQuery]  = useState("");
  const [msgs,   setMsgs]   = useState([]);
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState(null);
  const [stats,  setStats]  = useState(null);
  const endRef = useRef(null);

  useEffect(() => { fetchDocStats().then(setStats); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const handleStateChange = (s) => { setState(s); setCounty("All Counties"); };
  const counties = COUNTIES_BY_STATE[state] || ["All Counties"];

  async function ask(text) {
    if (!text.trim() || busy) return;
    setErr(null);
    const filters = { salesRegion, state, county, planType, snpType, payor, planName };
    const um  = { id: uid(), role: "user",      content: text, ts: new Date() };
    const lid = uid();
    const lm  = { id: lid, role: "assistant", content: "", sources: [], loading: true, ts: new Date() };
    setMsgs((p) => [...p, um, lm]);
    setBusy(true);
    try {
      const res = await queryDocuments(text, filters);
      setMsgs((p) =>
        p.map((m) =>
          m.id === lid
            ? { ...m, content: res.answer, sources: res.sources || [], mock: res.mock || false, loading: false }
            : m
        )
      );
    } catch (e) {
      setErr(e.message);
      setMsgs((p) => p.filter((m) => m.id !== lid));
    } finally { setBusy(false); }
  }

  // Clean Image-2-style filter selects
  const labelStyle = {
    display: "block", fontSize: 10, fontWeight: 700,
    color: "#9CA3AF", textTransform: "uppercase",
    letterSpacing: ".07em", marginBottom: 4,
  };
  const selStyle = {
    display: "block", width: "100%",
    padding: "5px 26px 5px 9px",
    border: "1px solid #D1D5DB", borderRadius: 6,
    background: "#fff", fontSize: 12, color: "#111827",
    fontFamily: "inherit", cursor: "pointer", outline: "none",
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236B7280'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
    transition: "border-color .15s",
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Playground header — filter bar ── */}
      <div style={{
        padding: "10px 20px", background: "#fff",
        borderBottom: "1px solid #E2E8F0", flexShrink: 0,
        display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap",
        minHeight: 58,
      }}>
        {/* Sales Region */}
        <div style={{ width: 108 }}>
          <span style={labelStyle}>Sales Region</span>
          <select value={salesRegion} onChange={(e) => setSalesRegion(e.target.value)} style={selStyle}>
            {SALES_REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        {/* State */}
        <div style={{ width: 130 }}>
          <span style={labelStyle}>State</span>
          <select value={state} onChange={(e) => handleStateChange(e.target.value)} style={selStyle}>
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {/* County */}
        <div style={{ width: 138 }}>
          <span style={labelStyle}>County</span>
          <select value={county} onChange={(e) => setCounty(e.target.value)} style={selStyle}>
            {counties.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {/* Plan Type */}
        <div style={{ width: 140 }}>
          <span style={labelStyle}>Plan Type</span>
          <select value={planType} onChange={(e) => setPlanType(e.target.value)} style={selStyle}>
            {PLAN_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        {/* SNP Type */}
        <div style={{ width: 118 }}>
          <span style={labelStyle}>SNP Type</span>
          <select value={snpType} onChange={(e) => setSnpType(e.target.value)} style={selStyle}>
            {SNP_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        {/* Payor */}
        <div style={{ width: 148 }}>
          <span style={labelStyle}>Payor</span>
          <select value={payor} onChange={(e) => setPayor(e.target.value)} style={selStyle}>
            {PAYORS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        {/* Plan Name */}
        <div style={{ width: 148 }}>
          <span style={labelStyle}>Plan Name</span>
          <select value={planName} onChange={(e) => setPlanName(e.target.value)} style={selStyle}>
            {PLAN_NAMES.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* ── Stats Banner ── */}
      <DocStatsBanner
        salesRegion={salesRegion} state={state} county={county}
        planType={planType} snpType={snpType} payor={payor}
        planName={planName} stats={stats}
      />

      {/* ── Messages / Empty state ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 10,
        background: "#F8FAFC",
      }}>
        {msgs.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: "#94A3B8",
              textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 9,
            }}>
              Try asking
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DOC_PILLS.map((p, i) => (
                <button key={i} onClick={() => ask(p)} style={{
                  background: "#F5F3FF", border: "1px solid #DDD6FE",
                  borderRadius: 20, padding: "5px 13px",
                  fontSize: 11.5, color: "#7C3AED",
                  cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#EDE9FE"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#F5F3FF"; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m) => <DocMsg key={m.id} msg={m}/>)}

        {err && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: 8, padding: "9px 13px", color: "#B91C1C",
            fontSize: 12, display: "flex", gap: 8, alignItems: "center",
          }}>
            <span style={{ fontSize: 13 }}>⚠️</span>
            {err}
            <button onClick={() => setErr(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#B91C1C", fontSize: 13 }}>
              ✕
            </button>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* ── Input bar ── */}
      <div style={{
        padding: "10px 20px", background: "#fff",
        borderTop: "1px solid #E2E8F0", flexShrink: 0,
      }}>
        <div style={{
          display: "flex", gap: 8, alignItems: "flex-end",
          background: "#F8FAFC", borderRadius: 12,
          border: "1.5px solid " + (busy ? "#7C3AED88" : "#E2E8F0"),
          padding: "8px 14px", transition: "border-color .2s",
        }}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={busy}
            rows={1}
            placeholder="Ask about EOC & Dental documents — exclusions, limits, coverage terms..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); ask(query); setQuery("");
              }
            }}
            style={{
              flex: 1, background: "transparent", border: "none",
              outline: "none", resize: "none", fontSize: 13.5,
              color: "#1E293B", fontFamily: "inherit",
              lineHeight: 1.5, maxHeight: 100, overflowY: "auto",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
          />
          <button
            onClick={() => { ask(query); setQuery(""); }}
            disabled={busy || !query.trim()}
            style={{
              background: busy || !query.trim() ? "#E2E8F0" : "#7C3AED",
              color: busy || !query.trim() ? "#94A3B8" : "#fff",
              border: "none", borderRadius: 8, padding: "7px 18px",
              cursor: busy || !query.trim() ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: 12.5,
              flexShrink: 0, fontFamily: "inherit", transition: "all .15s",
            }}
          >
            {busy ? "..." : "Ask →"}
          </button>
        </div>
        <p style={{ color: "#CBD5E1", fontSize: 9.5, marginTop: 5, textAlign: "center" }}>
          Answers grounded in your plan documents · Enter to send
        </p>
      </div>
    </div>
  );
}


// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [collapsed,     setCollapsed]     = useState(false);
  const [integratePC,   setIntegratePC]   = useState(false);
  const [activeHistory, setActiveHistory] = useState(null);

  function handleNewChat() { setActiveHistory(null); }
  function handleSelectHistory(id) { setActiveHistory(id); }

  return (
    <div style={{
      display: "flex", height: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 14, overflow: "hidden", background: "#F8FAFC",
    }}>
      <GStyle/>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        activeHistory={activeHistory}
        onSelectHistory={handleSelectHistory}
        onNewChat={handleNewChat}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          padding: "8px 16px", background: "#fff",
          borderBottom: "1px solid #E2E8F0",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>📚</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>
              EOC & Dental Playground
            </span>
            <span style={{
              background: "#F5F3FF", color: "#7C3AED",
              fontSize: 10, padding: "2px 8px",
              borderRadius: 20, fontWeight: 600,
              border: "1px solid #DDD6FE",
            }}>
              RAG-powered
            </span>
          </div>

          {/* Right side: status + Integrate PC toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8B5CF6" }}/>
              <span style={{ color: "#64748B", fontSize: 11 }}>
                {C.co} · {C.app}
              </span>
            </div>

            {/* Integrate PC toggle — purple */}
            <div
              onClick={() => setIntegratePC((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                transition: "all .18s", userSelect: "none",
                background: integratePC ? "#7C3AED" : "#F5F3FF",
                border: "1px solid " + (integratePC ? "#7C3AED" : "#DDD6FE"),
              }}
            >
              <span style={{ fontSize: 10 }}>🔗</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: integratePC ? "#fff" : "#7C3AED",
              }}>
                Integrate PC
              </span>
              <span style={{
                width: 28, height: 15, borderRadius: 8,
                display: "inline-flex", alignItems: "center", padding: "0 2px",
                background: integratePC ? "rgba(255,255,255,0.35)" : "#DDD6FE",
                transition: "background .2s", flexShrink: 0,
              }}>
                <span style={{
                  width: 11, height: 11, borderRadius: "50%", background: "#fff",
                  display: "block", transition: "transform .2s",
                  transform: integratePC ? "translateX(13px)" : "translateX(0)",
                }}/>
              </span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <DocPlayground/>
        </div>
      </div>
    </div>
  );
}
