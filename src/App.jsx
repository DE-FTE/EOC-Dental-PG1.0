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
      out.push("<h4 style='font-size:.85em;font-weight:700;margin:10px 0 3px;color:#0F766E'>" + inl(l.slice(4)) + "</h4>");
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
const STATES = [
  "All States", "California", "Florida", "Texas", "New York", "Georgia",
  "Ohio", "Pennsylvania", "Michigan", "North Carolina", "Illinois",
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

const PAYORS = [
  "All Payors","Humana","UnitedHealthcare","Aetna / CVS Health",
  "Elevance Health","Centene","Kaiser Permanente","Devoted Health",
  "Molina Healthcare","Cigna","SCAN Group",
];

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
        background: "#F0FDFA", border: "1px solid #99F6E4",
        borderRadius: 7, padding: "5px 9px", cursor: "pointer",
        marginBottom: 4, fontSize: 11,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0F766E", fontWeight: 600 }}>
        <span style={{ fontSize: 12 }}>{src.doc_type === "dental" ? "🦷" : "📋"}</span>
        <span style={{ flex: 1 }}>{src.doc_name}</span>
        <span style={{ color: "#5EEAD4", fontSize: 10 }}>p.{src.page} · {src.section}</span>
        <span style={{ fontSize: 9, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          marginTop: 6, padding: "7px 8px", background: "#ECFDF5",
          borderRadius: 5, fontSize: 11, color: "#134E4A", lineHeight: 1.65,
          borderLeft: "2px solid #0D9488", paddingLeft: 10,
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
      background: "#0F766E", color: "#fff",
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

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle }) {
  return collapsed ? (
    <aside style={{
      width: 38, background: "#0D1929", display: "flex",
      flexDirection: "column", alignItems: "center",
      flexShrink: 0, borderRight: "1px solid #1E3350",
    }}>
      <button
        onClick={onToggle}
        title="Expand"
        style={{
          width: "100%", padding: "11px 0", background: "transparent",
          border: "none", borderBottom: "1px solid #1E3350",
          cursor: "pointer", color: "#94A3B8", fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        &#9776;
      </button>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", gap: 3, paddingTop: 10,
      }}>
        <button
          title="EOC & Dental Playground"
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: "#0F766E", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}
        >
          📚
        </button>
      </div>
    </aside>
  ) : (
    <aside style={{
      width: 210, background: "#0D1929", display: "flex",
      flexDirection: "column", flexShrink: 0, overflowY: "auto",
    }}>
      {/* Logo & name */}
      <div style={{
        padding: "13px 12px 9px", borderBottom: "1px solid #1E3350",
        flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      }}>
        <div>
          <img
            src="https://drlobbystorer1.blob.core.windows.net/images/HWAI_Logo_Full.svg?v=1"
            alt="HealthWorksAI"
            style={{ height: 28, width: "auto", display: "block", marginBottom: 5, filter: "brightness(0) invert(1)" }}
          />
          <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
            {C.app}
          </div>
          <div style={{ color: "#94A3B8", fontSize: 9, marginTop: 2 }}>
            EOC & Dental Document Intelligence
          </div>
        </div>
        <button
          onClick={onToggle}
          title="Collapse"
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "#7C8FA6", fontSize: 13, padding: 2, marginTop: 1, lineHeight: 1,
          }}
        >
          &#8249;&#8249;
        </button>
      </div>

      {/* Nav item — always active */}
      <div style={{ flex: 1, overflowY: "auto", padding: "9px 12px" }}>
        <div style={{
          color: "#0F766E", fontSize: 8.5, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: ".1em",
          marginBottom: 6, padding: "0 5px",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ fontSize: 9 }}>✦</span>
          Document Intelligence
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          width: "100%", padding: "7px 8px", marginBottom: 1,
          borderRadius: 7, border: "none", cursor: "default",
          background: "#0F766E28",
          borderLeft: "2px solid #0F766E",
          textAlign: "left",
        }}>
          <span style={{ fontSize: 13 }}>📚</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0F766E" }}>
            EOC & Dental Playground
          </span>
          <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#0F766E", flexShrink: 0 }}/>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "7px 12px", borderTop: "1px solid #1E3350", color: "#6B8FAD", fontSize: 9, flexShrink: 0 }}>
        <div>Medicare Advantage · EOC Intelligence</div>
        <div style={{ marginTop: 1 }}>v{C.ver} · {C.co}</div>
      </div>
    </aside>
  );
}

// ─── DOC STATS SUMMARY BAR ───────────────────────────────────────────────────
function DocStatsBanner({ state, county, payor, stats }) {
  const label = [
    state !== "All States" ? state : null,
    county !== "All Counties" ? county : null,
    payor !== "All Payors" ? payor : null,
  ].filter(Boolean).join(" · ") || "All Markets";

  const eocCount   = stats ? stats.eoc   : 1000;
  const totalCount = stats ? stats.total : 1000;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 20px", background: "#F0FDFA",
      borderBottom: "1px solid #99F6E4", flexShrink: 0, gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0D9488" }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0F766E" }}>
            {totalCount.toLocaleString()} documents available
          </span>
        </div>
        <div style={{ width: 1, height: 13, background: "#99F6E4" }}/>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#0F766E" }}>
          {eocCount.toLocaleString()} EOCs available
        </span>
        <div style={{ width: 1, height: 13, background: "#99F6E4" }}/>
        <span style={{ fontSize: 11, color: "#5EEAD4" }}>
          Filtered by: <strong style={{ color: "#0F766E" }}>{label}</strong>
        </span>
      </div>
      <span style={{
        fontSize: 10, color: "#0D9488", background: "#CCFBF1",
        padding: "2px 9px", borderRadius: 20, fontWeight: 600,
      }}>
        RAG-powered · citations grounded in source docs
      </span>
    </div>
  );
}

// ─── DOC PLAYGROUND ──────────────────────────────────────────────────────────
function DocPlayground() {
  const [state,  setState]  = useState("All States");
  const [county, setCounty] = useState("All Counties");
  const [payor,  setPayor]  = useState("All Payors");
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
    const filters = { state, county, payor };
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

      {/* ── Playground header ── */}
      <div style={{
        padding: "10px 20px", background: "#fff",
        borderBottom: "1px solid #E2E8F0", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 12, minHeight: 54,
      }}>
        {/* Filters — always visible, left-aligned */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <div style={{ width: 118 }}>
            <span style={labelStyle}>State</span>
            <select value={state} onChange={(e) => handleStateChange(e.target.value)} style={selStyle}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ width: 140 }}>
            <span style={labelStyle}>County</span>
            <select value={county} onChange={(e) => setCounty(e.target.value)} style={selStyle}>
              {counties.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ width: 152 }}>
            <span style={labelStyle}>Payor</span>
            <select value={payor} onChange={(e) => setPayor(e.target.value)} style={selStyle}>
              {PAYORS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Stats Banner ── */}
      <DocStatsBanner state={state} county={county} payor={payor} stats={stats}/>

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
                  background: "#F0FDFA", border: "1px solid #99F6E4",
                  borderRadius: 20, padding: "5px 13px",
                  fontSize: 11.5, color: "#0F766E",
                  cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#CCFBF1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#F0FDFA"; }}
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
          border: "1.5px solid " + (busy ? "#0F766E88" : "#E2E8F0"),
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
              background: busy || !query.trim() ? "#E2E8F0" : "#0F766E",
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
  const [collapsed,    setCollapsed]    = useState(false);
  const [integratePC,  setIntegratePC]  = useState(false);

  return (
    <div style={{
      display: "flex", height: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 14, overflow: "hidden", background: "#F8FAFC",
    }}>
      <GStyle/>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)}/>
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
              background: "#F0FDFA", color: "#0F766E",
              fontSize: 10, padding: "2px 8px",
              borderRadius: 20, fontWeight: 600,
              border: "1px solid #99F6E4",
            }}>
              RAG-powered
            </span>
          </div>

          {/* Right side: status + toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }}/>
              <span style={{ color: "#64748B", fontSize: 11 }}>
                {C.co} · {C.app}
              </span>
            </div>

            {/* Integrate PC toggle */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "4px 10px", borderRadius: 20,
              background: integratePC ? "#F0FDFA" : "#F8FAFC",
              border: "1px solid " + (integratePC ? "#99F6E4" : "#E2E8F0"),
              cursor: "pointer", transition: "all .18s",
            }}
              onClick={() => setIntegratePC((v) => !v)}
            >
              <span style={{ fontSize: 10 }}>🔗</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: integratePC ? "#0F766E" : "#64748B",
              }}>
                Integrate PC
              </span>
              {/* pill toggle */}
              <span style={{
                width: 28, height: 15, borderRadius: 8,
                display: "inline-flex", alignItems: "center", padding: "0 2px",
                background: integratePC ? "#0D9488" : "#CBD5E1",
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
