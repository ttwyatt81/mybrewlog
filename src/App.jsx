import { useState, useEffect } from "react";
import AIModal from "./components/AIModal";
import BeanCard from "./components/BeanCard";
import ErrorBoundary from "./components/ErrorBoundary";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cache row IDs per table so we always update the same row
const rowIdCache = {};

function authHeaders(token) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token || SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function sbGetUser(token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
  });
  return res.ok ? res.json() : null;
}

async function sbSendOtp(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, create_user: true })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) console.error("OTP error:", body);
  return { ok: res.ok, error: body.message || body.msg || null };
}

async function sbVerifyOtp(email, token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "email", email, token })
  });
  const data = await res.json().catch(() => ({}));
  return data.access_token ? data : null;
}

async function sbSignOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
  });
}

async function sbGet(table, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=updated_at.desc&limit=1`, {
    headers: authHeaders(token)
  });
  return res.ok ? res.json() : [];
}

async function sbUpsert(table, token, rowId, data) {
  // Use cached row ID if we have one
  if (rowIdCache[table]) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${rowIdCache[table]}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ data: JSON.stringify(data), updated_at: new Date().toISOString() })
    });
    if (res.ok) return;
    // If patch failed, fall through to insert
    delete rowIdCache[table];
  }

  // Check if a row already exists for this user
  const existing = await sbGet(table, token);
  if (existing && existing.length > 0) {
    rowIdCache[table] = existing[0].id;
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${existing[0].id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ data: JSON.stringify(data), updated_at: new Date().toISOString() })
    });
  } else {
    // Get user_id from token for new insert
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
    });
    const user = await userRes.json();
    const userId = user?.id;
    if (!userId) { console.error("No user ID found"); return; }
    const newId = rowId || crypto.randomUUID();
    rowIdCache[table] = newId;
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...authHeaders(token), Prefer: "return=minimal" },
      body: JSON.stringify({ id: newId, user_id: userId, data: JSON.stringify(data) })
    });
  }
}

const defaultRecipe = {
  id: null, name: "", method: "Pour Over", brewer: "", filterPaper: "",
  dose: "", water: "", temperature: "", grindSize: "",
  bloomWater: "", bloomTime: "", numPours: "", totalTime: "",
  pourStructure: "",
};

const processOptions = ["Natural", "Washed", "Honey", "Anaerobic", "Co-fermented", "Wet-hulled", "Other"];
const roastLevels = ["Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"];
const varietalOptions = ["Sidra", "Gesha/Geisha", "Bourbon", "Typica", "Caturra", "SL28", "SL34", "Pacamara", "Catuai", "Heirloom", "Unknown/Blend"];
const beanTypes = ["Filter", "Espresso"];
const altitudeOptions = ["<1200m", "1200–1500m", "1500–1800m", "1800–2100m", ">2100m"];

const defaultBean = {
  id: null, name: "", roaster: "", origin: "", region: "",
  process: "", roastLevel: "", varietal: "", altitude: "", type: "", roastDate: "", notes: "",
  brews: [],
};

const brewMethods = ["Pour Over", "Espresso", "Moka", "French Press"];
const preHeatOptions = ["None", "Low", "Medium", "Hot"];
const pourOverBrewers = ["V60", "Chemex", "Kalita Wave", "Origami", "Aeropress", "Clever Dripper", "Other"];
const filterPapers = ["Hario Tabbed (white)", "Hario Tabbed (natural)", "Hario Untabbed", "Chemex Bonded", "Kalita Wave", "Bleached", "Unbleached", "Metal filter", "Cloth filter", "Other"];

const defaultBrew = {
  id: null, date: new Date().toISOString().split("T")[0],
  method: "Pour Over", brewer: "", filterPaper: "",
  dose: "", water: "", temperature: "", grindSize: "",
  bloomWater: "", bloomTime: "", numPours: "", totalTime: "",
  pourStructure: "", rating: 0, tastingNotes: "",
  recipeSource: "Manual", recipeName: "",
  // Espresso fields
  machine: "", grinder: "", preHeat: "", brewTime: "",
};

function calcRatio(dose, water) {
  if (!dose || !water || isNaN(dose) || isNaN(water)) return null;
  return (parseFloat(water) / parseFloat(dose)).toFixed(1);
}
function bloomRatio(bloomWater, dose) {
  if (!bloomWater || !dose || isNaN(bloomWater) || isNaN(dose)) return null;
  return (parseFloat(bloomWater) / parseFloat(dose)).toFixed(1);
}

function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ fontSize: size, cursor: onChange ? "pointer" : "default", color: s <= (hover || value) ? "#c8893a" : "#2e2318", transition: "color 0.15s", userSelect: "none" }}>★</span>
      ))}
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{ fontSize: "11px", color: "#9a7a5a", background: "rgba(200,137,58,0.08)", padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{ fontSize: "10px", letterSpacing: "0.14em", color: "#c8893a", textTransform: "uppercase", marginBottom: "14px", borderBottom: "1px solid rgba(200,137,58,0.15)", paddingBottom: "6px" }}>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9a7a5a", textTransform: "uppercase" }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: "10px", color: "#4a3a2a" }}>{hint}</span>}
    </div>
  );
}

const IS = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,137,58,0.2)",
  borderRadius: "7px", color: "#f0e6d3", padding: "9px 12px", fontSize: "14px",
  outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s",
};
function inp(extra = {}) { return { ...IS, ...extra }; }
function onFoc(e) { e.target.style.borderColor = "rgba(200,137,58,0.65)"; }
function onBlr(e) { e.target.style.borderColor = "rgba(200,137,58,0.2)"; }

function StatBox({ label, value }) {
  return (
    <div style={{ background: "rgba(200,137,58,0.05)", border: "1px solid rgba(200,137,58,0.12)", borderRadius: "9px", padding: "11px 8px", textAlign: "center" }}>
      <div style={{ fontSize: "15px", color: "#f0e6d3", marginBottom: "3px", fontFamily: "'Playfair Display', serif" }}>{value || "—"}</div>
      <div style={{ fontSize: "9px", color: "#6a5040", letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}


// ── Recipe Generator ─────────────────────────────────────────────────────────
function generateRecipe(bean) {
  const roast = (bean.roastLevel || "").toLowerCase();
  const process = (bean.process || "").toLowerCase();
  const altitude = (bean.altitude || "").toLowerCase();
  const varietal = (bean.varietal || "").toLowerCase();

  // Temperature: lighter roasts need higher temp to extract
  let temp = 93;
  if (roast.includes("light")) temp = 96;
  else if (roast.includes("medium-light")) temp = 94;
  else if (roast.includes("medium-dark") || roast.includes("dark")) temp = 90;

  // Dose & ratio: naturals/anaerobic benefit from slightly higher ratio
  const dose = 15;
  let ratio = 16;
  if (process.includes("natural") || process.includes("anaerobic") || process.includes("co-ferment")) ratio = 15.5;
  if (roast.includes("dark")) ratio = 15;
  const water = Math.round(dose * ratio);

  // Bloom: naturals need longer bloom (more CO2), washed shorter
  const bloomWater = dose * 3;
  let bloomTime = 40;
  if (process.includes("natural") || process.includes("anaerobic") || process.includes("co-ferment")) bloomTime = 50;
  if (process.includes("washed")) bloomTime = 35;

  // Number of pours & structure
  let numPours, pourStructure, totalTime;
  if (roast.includes("light") || roast.includes("medium-light")) {
    // Light roasts: more pours, slower draw-down for fuller extraction
    numPours = 3;
    const p1 = Math.round(water * 0.4);
    const p2 = Math.round(water * 0.75);
    pourStructure = `Bloom ${bloomWater}g (0:00–0:${bloomTime}s) → Pour to ${p1}g at 0:45 → Pour to ${p2}g at 1:15 → Final pour to ${water}g at 1:45`;
    totalTime = "2:45";
  } else if (roast.includes("dark")) {
    // Dark roasts: fewer pours, faster to avoid bitterness
    numPours = 2;
    const p1 = Math.round(water * 0.5);
    pourStructure = `Bloom ${bloomWater}g (0:00–0:${bloomTime}s) → Pour to ${p1}g at 0:40 → Final pour to ${water}g at 1:10`;
    totalTime = "2:00";
  } else {
    // Medium: classic 3-pour
    numPours = 3;
    const p1 = Math.round(water * 0.4);
    const p2 = Math.round(water * 0.7);
    pourStructure = `Bloom ${bloomWater}g (0:00–0:${bloomTime}s) → Pour to ${p1}g at 0:45 → Pour to ${p2}g at 1:20 → Final pour to ${water}g at 1:50`;
    totalTime = "2:30";
  }

  // Grind size
  let grindSize = "Medium (e.g. dial 3.0–3.5 on 1Zpresso K-series)";
  if (roast.includes("light")) grindSize = "Medium-fine (e.g. dial 2.5–3.0 on 1Zpresso K-series)";
  if (roast.includes("dark")) grindSize = "Medium-coarse (e.g. dial 3.5–4.0 on 1Zpresso K-series)";
  if (altitude.includes("2100") || altitude.includes(">2100")) grindSize = "Fine-medium (high-density bean, try finer than usual)";

  // Rationale
  const reasons = [];
  if (roast.includes("light")) reasons.push(`${temp}°C maximises extraction of the delicate aromatics in a light roast.`);
  else if (roast.includes("dark")) reasons.push(`${temp}°C avoids over-extracting the bitter compounds more present in a dark roast.`);
  else reasons.push(`${temp}°C is a balanced temperature for a medium roast.`);

  if (process.includes("natural") || process.includes("anaerobic")) reasons.push(`A longer bloom (${bloomTime}s) degasses the CO2-rich ${process} processing for even extraction.`);
  else if (process.includes("washed")) reasons.push(`Washed coffees are less gassy so a shorter bloom (${bloomTime}s) is sufficient.`);

  if (altitude.includes(">2100") || altitude.includes("2100")) reasons.push("High-altitude beans are dense — a finer grind compensates for their harder cell structure.");

  const rationale = reasons.join(" ") || "This recipe balances extraction time and temperature for a clean, well-rounded V60 cup.";

  return { dose, water, temperature: temp, grindSize, bloomWater, bloomTime, numPours, totalTime, pourStructure, rationale };
}

export default function App() {
  const [beans, setBeans] = useState([]);
  const [session, setSession] = useState(null);
  const [authState, setAuthState] = useState("login"); // login | verify | app
  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("beans");
  const [editBean, setEditBean] = useState(null);
  const [activeBean, setActiveBean] = useState(null);
  const [brewForm, setBrewForm] = useState(defaultBrew);
  const [showAI, setShowAI] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterVarietal, setFilterVarietal] = useState("");
  const [filterType, setFilterType] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [editRecipe, setEditRecipe] = useState(null);
  const [tab, setTab] = useState("beans"); // beans | recipes | brews
  const [selectedBrew, setSelectedBrew] = useState(null); // { brew, bean } for standalone detail
  const [editingBrewId, setEditingBrewId] = useState(null); // id of brew being edited
  const [showTransfer, setShowTransfer] = useState(null); // "export" | "import" | null
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [filterRoaster, setFilterRoaster] = useState("");
  const [brewFilterMethod, setBrewFilterMethod] = useState("");
  const [brewFilterBean, setBrewFilterBean] = useState("");
  const [brewSort, setBrewSort] = useState("date");

  useEffect(() => {
    // Restore saved session — stays logged in permanently
    const stored = localStorage.getItem("sb_session");
    if (stored) {
      try {
        const session = JSON.parse(stored);
        setSession(session);
        setAuthState("app");
        loadData(session.access_token);
      } catch { localStorage.removeItem("sb_session"); }
    }
  }, []);

  async function loadData(token) {
    setLoading(true);
    try {
      const rows = await sbGet("beans", token);
      if (rows && rows.length > 0 && rows[0].data) {
        rowIdCache["beans"] = rows[0].id; // cache row ID for fast saves
        setBeans(JSON.parse(rows[0].data));
      }
    } catch (e) { console.error("Load beans error:", e); }
    try {
      const rows = await sbGet("recipes", token);
      if (rows && rows.length > 0 && rows[0].data) {
        rowIdCache["recipes"] = rows[0].id; // cache row ID for fast saves
        setRecipes(JSON.parse(rows[0].data));
      }
    } catch (e) { console.error("Load recipes error:", e); }
    setLoading(false);
  }

    const persist = async (updated) => {
    setBeans(updated);
    try {
      await sbUpsert("beans", session?.access_token, crypto.randomUUID(), updated);
    } catch (e) { console.error("Failed to save beans:", e); }
  };

  const persistRecipes = async (updated) => {
    setRecipes(updated);
    try {
      await sbUpsert("recipes", session?.access_token, crypto.randomUUID(), updated);
    } catch (e) { console.error("Failed to save recipes:", e); }
  };

  const handleSendOtp = async () => {
    if (!authEmail.trim()) return;
    setAuthLoading(true); setAuthError("");
    const { ok, error } = await sbSendOtp(authEmail.trim());
    if (ok) { setAuthState("verify"); }
    else { setAuthError(error || "Could not send code. Check your email address."); }
    setAuthLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (authCode.length < 6) return; // allow 6-8 digits
    setAuthLoading(true); setAuthError("");
    const data = await sbVerifyOtp(authEmail.trim(), authCode.trim());
    if (data) {
      const sess = { access_token: data.access_token, email: authEmail.trim() };
      setSession(sess);
      localStorage.setItem("sb_session", JSON.stringify(sess));
      setAuthState("app");
      loadData(data.access_token);
    } else {
      setAuthError("Invalid code. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    if (session) await sbSignOut(session.access_token);
    localStorage.removeItem("sb_session");
    setSession(null);
    setBeans([]); setRecipes([]);
    setAuthState("login"); setAuthEmail(""); setAuthCode("");
  };

  const saveRecipe = () => {
    if (!editRecipe.name) return;
    const updated = editRecipe.id
      ? recipes.map(r => r.id === editRecipe.id ? editRecipe : r)
      : [{ ...editRecipe, id: Date.now() }, ...recipes];
    persistRecipes(updated);
    setEditRecipe(null);
  };

  const deleteRecipe = (id) => persistRecipes(recipes.filter(r => r.id !== id));

  const exportData = () => {
    const payload = { beans, recipes, exportedAt: new Date().toISOString() };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  };

  const importData = async () => {
    try {
      const decoded = decodeURIComponent(escape(atob(importText.trim())));
      const payload = JSON.parse(decoded);
      if (!payload.beans || !Array.isArray(payload.beans)) throw new Error("Invalid data");
      await persist(payload.beans);
      if (payload.recipes) await persistRecipes(payload.recipes);
      setImportStatus("success");
      setTimeout(() => { setShowTransfer(null); setImportText(""); setImportStatus(""); }, 1500);
    } catch (e) {
      console.error("Import error:", e);
      setImportStatus("error");
    }
  };

  const saveBean = () => {
    if (!editBean.name) return;
    const updated = editBean.id
      ? beans.map(b => b.id === editBean.id ? editBean : b)
      : [{ ...editBean, id: Date.now(), brews: [] }, ...beans];
    persist(updated);
    setView("beans");
  };

  const deleteBean = (id) => { persist(beans.filter(b => b.id !== id)); setView("beans"); };

  const saveBrew = () => {
    if (!activeBean) return;
    let updated;
    const finalMethod = brewForm.method_confirmed || brewForm.method;
    const brewToSave = { ...brewForm, method: finalMethod, method_confirmed: undefined };
    if (editingBrewId) {
      updated = beans.map(b => b.id === activeBean.id
        ? { ...b, brews: b.brews.map(br => br.id === editingBrewId ? { ...brewToSave, id: editingBrewId } : br) }
        : b
      );
    } else {
      const brew = { ...brewToSave, id: Date.now() };
      updated = beans.map(b => b.id === activeBean.id ? { ...b, brews: [brew, ...b.brews] } : b);
    }
    persist(updated);
    setActiveBean(updated.find(b => b.id === activeBean.id));
    setEditingBrewId(null);
    setView("beanDetail");
  };

  const deleteBrew = (brewId) => {
    const updated = beans.map(b => b.id === activeBean.id ? { ...b, brews: b.brews.filter(br => br.id !== brewId) } : b);
    persist(updated);
    setActiveBean(updated.find(b => b.id === activeBean.id));
  };

  const editBrew = (brew, bean) => {
    setActiveBean(bean);
    setBrewForm({ ...brew });
    setEditingBrewId(brew.id);
    setSelectedBrew(null);
    setView("brewForm");
  };

  const copyBrewToRecipe = (brew) => {
    setEditRecipe({
      ...defaultRecipe,
      method: brew.method || "Pour Over",
      brewer: brew.brewer || "",
      filterPaper: brew.filterPaper || "",
      dose: brew.dose || "",
      water: brew.water || "",
      temperature: brew.temperature || "",
      grindSize: brew.grindSize || "",
      bloomWater: brew.bloomWater || "",
      bloomTime: brew.bloomTime || "",
      numPours: brew.numPours || "",
      totalTime: brew.totalTime || "",
      pourStructure: brew.pourStructure || "",
    });
    setTab("recipes");
    setView("beans");
    setSelectedBrew(null);
  };

  const setB = (k, v) => setEditBean(f => ({ ...f, [k]: v }));
  const setBr = (k, v) => setBrewForm(f => ({ ...f, [k]: v }));

  const allOrigins = [...new Set(beans.map(b => b.origin).filter(Boolean))].sort();
  const allVarietals = [...new Set(beans.map(b => b.varietal).filter(Boolean))].sort();
  const allRoasters = [...new Set(beans.map(b => b.roaster).filter(Boolean))].sort();

  const filtered = beans.filter(b => {
    if (filter && ![b.name, b.roaster, b.origin, b.region, b.process, b.roastLevel].join(" ").toLowerCase().includes(filter.toLowerCase())) return false;
    if (filterOrigin && b.origin !== filterOrigin) return false;
    if (filterVarietal && b.varietal !== filterVarietal) return false;
    if (filterType && b.type !== filterType) return false;
    if (filterRoaster && b.roaster !== filterRoaster) return false;
    return true;
  });

  const activeFilterCount = [filterOrigin, filterVarietal, filterType, filterRoaster].filter(Boolean).length;

  const bestBrew = (bean) => bean.brews.length ? bean.brews.reduce((a, b) => b.rating > a.rating ? b : a, bean.brews[0]) : null;

  const liveBean = activeBean ? beans.find(b => b.id === activeBean.id) || activeBean : null;

  if (authState === "login" || authState === "verify") {
      return (
        <div style={{ minHeight: "100vh", background: "#0c0905", backgroundImage: "radial-gradient(ellipse at 15% 15%, rgba(110,55,8,0.18) 0%, transparent 55%)", fontFamily: "'DM Sans', sans-serif", color: "#f0e6d3", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
          <div style={{ width: "100%", maxWidth: "380px" }}>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "32px", marginBottom: "6px" }}>Bean & Brew</div>
              <div style={{ fontSize: "10px", color: "#5a4030", letterSpacing: "0.2em", textTransform: "uppercase" }}>Coffee Journal</div>
            </div>

            {authState === "login" && (
              <div>
                <div style={{ fontSize: "14px", color: "#7a6050", marginBottom: "20px", textAlign: "center" }}>
                  Enter your email — we'll send you a 6-digit code
                </div>
                <input value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                  placeholder="your@email.com" type="email"
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "9px", color: "#f0e6d3", padding: "13px 16px", fontSize: "15px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "12px" }} />
                {authError && <div style={{ color: "#c87060", fontSize: "13px", marginBottom: "10px" }}>{authError}</div>}
                <button onClick={handleSendOtp} disabled={authLoading || !authEmail.trim()}
                  style={{ width: "100%", background: authEmail.trim() ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.2)", border: "none", borderRadius: "9px", color: authEmail.trim() ? "#fff" : "#5a4030", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: authEmail.trim() ? "pointer" : "not-allowed" }}>
                  {authLoading ? "Sending…" : "Send Code"}
                </button>
              </div>
            )}

            {authState === "verify" && (
              <div>
                <div style={{ fontSize: "14px", color: "#7a6050", marginBottom: "6px", textAlign: "center" }}>
                  We sent a 6-digit code to
                </div>
                <div style={{ fontSize: "14px", color: "#c8a060", marginBottom: "24px", textAlign: "center", fontWeight: "500" }}>{authEmail}</div>
                <input value={authCode} onChange={e => setAuthCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                  placeholder="12345678" type="text" maxLength={8}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "9px", color: "#f0e6d3", padding: "13px 16px", fontSize: "28px", outline: "none", fontFamily: "monospace", boxSizing: "border-box", marginBottom: "12px", letterSpacing: "0.4em", textAlign: "center" }} />
                {authError && <div style={{ color: "#c87060", fontSize: "13px", marginBottom: "10px", textAlign: "center" }}>{authError}</div>}
                <button onClick={handleVerifyOtp} disabled={authLoading || authCode.length < 6}
                  style={{ width: "100%", background: authCode.length >= 6 ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.2)", border: "none", borderRadius: "9px", color: authCode.length >= 6 ? "#fff" : "#5a4030", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: authCode.length >= 6 ? "pointer" : "not-allowed", marginBottom: "12px" }}>
                  {authLoading ? "Verifying…" : "Sign In"}
                </button>
                <button onClick={() => { setAuthState("login"); setAuthCode(""); setAuthError(""); }}
                  style={{ width: "100%", background: "none", border: "none", color: "#5a4030", cursor: "pointer", fontSize: "13px", padding: "8px" }}>
                  ← Use a different email
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div style={{ minHeight: "100vh", background: "#0c0905", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#6a5040" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px", animation: "spin 1.4s linear infinite", display: "inline-block" }}>⟳</div>
            <div style={{ fontSize: "13px" }}>Loading your brews…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      );
    }

    return (
    <div style={{ minHeight: "100vh", background: "#0c0905", backgroundImage: "radial-gradient(ellipse at 15% 15%, rgba(110,55,8,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(50,25,3,0.25) 0%, transparent 55%)", fontFamily: "'DM Sans', sans-serif", color: "#f0e6d3" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />

      {/* Header — tabs only */}
      <div style={{ borderBottom: "1px solid rgba(200,137,58,0.13)", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(12,9,5,0.93)", backdropFilter: "blur(14px)", zIndex: 10 }}>
        <div style={{ display: "flex" }}>
          {view === "beans" && ["Beans", "Recipes", "Brews"].map(t => (
            <button key={t} onClick={() => setTab(t.toLowerCase())}
              style={{ padding: "14px 20px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.toLowerCase() ? "#c8893a" : "transparent"}`, color: tab === t.toLowerCase() ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", marginBottom: "-1px" }}>
              {t}
            </button>
          ))}
          {view !== "beans" && (
            <div style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
              <button onClick={() => setView("beans")} style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", padding: "14px 8px" }}>← Back</button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {view === "beanDetail" && liveBean && (
            <button onClick={() => { setBrewForm({ ...defaultBrew, date: new Date().toISOString().split("T")[0] }); setView("brewForm"); }}
              style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
              + Log Brew
            </button>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px" }}>
            <div style={{ fontSize: "10px", color: "#4a3a2a", letterSpacing: "0.03em", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.email}</div>
            <button onClick={handleSignOut} style={{ background: "none", border: "none", color: "#5a4030", cursor: "pointer", fontSize: "10px", padding: 0, letterSpacing: "0.05em" }}>Sign out</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "22px 16px" }}>

        {/* ── BEANS LIST ── */}
        {view === "beans" && tab === "beans" && (
          <div>
            {/* Title */}
            <div style={{ marginBottom: "22px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", letterSpacing: "0.02em", marginBottom: "4px" }}>Bean & Brew</div>
              <div style={{ fontSize: "10px", color: "#5a4030", letterSpacing: "0.18em", textTransform: "uppercase" }}>Coffee Journal</div>
            </div>

            {/* Action row */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
              <button onClick={() => setShowTransfer("export")}
                style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#6a5040", cursor: "pointer", padding: "7px 12px", fontSize: "12px" }}>
                ↑ Export
              </button>
              <button onClick={() => setShowTransfer("import")}
                style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#6a5040", cursor: "pointer", padding: "7px 12px", fontSize: "12px" }}>
                ↓ Import
              </button>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search beans…"
                style={{ ...inp(), flex: 1, minWidth: "120px", fontSize: "13px", padding: "7px 11px" }} onFocus={onFoc} onBlur={onBlr} />
              <button onClick={() => { setEditBean({ ...defaultBean }); setView("beanForm"); }}
                style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
                + New Bean
              </button>
            </div>

            {beans.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "80px" }}>
                <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.2 }}>☕</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#5a4030", marginBottom: "8px" }}>No beans yet</div>
                <div style={{ fontSize: "13px", color: "#3a2a1a" }}>Add your first bean to start dialling in</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Filter bar */}
              <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {/* Type toggle */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    {["Filter", "Espresso"].map(t => (
                      <button key={t} onClick={() => setFilterType(filterType === t ? "" : t)}
                        style={{ padding: "5px 12px", borderRadius: "20px", border: `1px solid ${filterType === t ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: filterType === t ? "rgba(200,137,58,0.18)" : "transparent", color: filterType === t ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "12px", transition: "all 0.15s" }}>
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Origin dropdown */}
                  {allOrigins.length > 0 && (
                    <select value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)}
                      style={{ ...IS, width: "auto", fontSize: "12px", padding: "5px 10px", cursor: "pointer", borderColor: filterOrigin ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)", color: filterOrigin ? "#c8a060" : "#5a4a3a" }}>
                      <option value="">All Origins</option>
                      {allOrigins.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}

                  {/* Varietal dropdown */}
                  {allVarietals.length > 0 && (
                    <select value={filterVarietal} onChange={e => setFilterVarietal(e.target.value)}
                      style={{ ...IS, width: "auto", fontSize: "12px", padding: "5px 10px", cursor: "pointer", borderColor: filterVarietal ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)", color: filterVarietal ? "#c8a060" : "#5a4a3a" }}>
                      <option value="">All Varietals</option>
                      {allVarietals.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  )}

                  {/* Roaster dropdown */}
                  {allRoasters.length > 1 && (
                    <select value={filterRoaster} onChange={e => setFilterRoaster(e.target.value)}
                      style={{ ...IS, width: "auto", fontSize: "12px", padding: "5px 10px", cursor: "pointer", borderColor: filterRoaster ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)", color: filterRoaster ? "#c8a060" : "#5a4a3a" }}>
                      <option value="">All Roasters</option>
                      {allRoasters.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}

                  {/* Clear filters */}
                  {activeFilterCount > 0 && (
                    <button onClick={() => { setFilterOrigin(""); setFilterVarietal(""); setFilterType(""); setFilterRoaster(""); }}
                      style={{ padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(200,80,80,0.3)", background: "transparent", color: "#8a5050", cursor: "pointer", fontSize: "12px" }}>
                      Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} ✕
                    </button>
                  )}
                </div>
              </div>

              <div style={{ fontSize: "11px", color: "#4a3a2a", marginBottom: "4px", letterSpacing: "0.04em" }}>{filtered.length} bean{filtered.length !== 1 ? "s" : ""}{activeFilterCount > 0 ? " matching filters" : ""}</div>
                {filtered.map(bean => (
  <BeanCard
    key={bean.id}
    bean={bean}
    bestBrew={bestBrew}
    setActiveBean={setActiveBean}
    setView={setView}
    Tag={Tag}
  />
))}})}
              </div>
            )}
          </div>
        )}

        {/* ── RECIPES TAB ── */}
        {view === "beans" && tab === "recipes" && (
          <div>
            {!editRecipe && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", marginBottom: "4px" }}>Recipes</div>
                  <div style={{ fontSize: "10px", color: "#5a4030", letterSpacing: "0.18em", textTransform: "uppercase" }}>Saved brew recipes</div>
                </div>
                <button onClick={() => setEditRecipe({ ...defaultRecipe })}
                  style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
                  + New Recipe
                </button>
              </div>
            )}
            {editRecipe ? (
              // Recipe form
              <div>
                <button onClick={() => setEditRecipe(null)} style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← Recipes</button>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>{editRecipe.id ? "Edit Recipe" : "New Recipe"}</div>
                <div style={{ fontSize: "13px", color: "#6a5040", marginBottom: "24px" }}>Save a reusable brew recipe</div>

                <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
                  <section>
                    <SectionHead>Recipe Name & Method</SectionHead>
                    <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                      <Field label="Recipe Name">
                        <input style={inp()} value={editRecipe.name} onChange={e => setEditRecipe(r => ({ ...r, name: e.target.value }))} placeholder="e.g. My go-to V60" onFocus={onFoc} onBlur={onBlr} />
                      </Field>
                      <Field label="Brew Method">
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {brewMethods.map(m => (
                            <button key={m} onClick={() => setEditRecipe(r => ({ ...r, method: m }))}
                              style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${editRecipe.method === m ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: editRecipe.method === m ? "rgba(200,137,58,0.18)" : "transparent", color: editRecipe.method === m ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "13px", transition: "all 0.15s" }}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </div>
                  </section>

                  {editRecipe.method === "Pour Over" && (<>
                    <section>
                      <SectionHead>Equipment</SectionHead>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                        <Field label="Brewer">
                          <select style={inp({ cursor: "pointer" })} value={editRecipe.brewer} onChange={e => setEditRecipe(r => ({ ...r, brewer: e.target.value }))} onFocus={onFoc} onBlur={onBlr}>
                            <option value="">Select…</option>
                            {pourOverBrewers.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </Field>
                        <Field label="Filter Paper">
                          <select style={inp({ cursor: "pointer" })} value={editRecipe.filterPaper} onChange={e => setEditRecipe(r => ({ ...r, filterPaper: e.target.value }))} onFocus={onFoc} onBlur={onBlr}>
                            <option value="">Select…</option>
                            {filterPapers.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </Field>
                      </div>
                    </section>
                    <section>
                      <SectionHead>Recipe Parameters</SectionHead>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                        <Field label="Dose (g)"><input style={inp()} type="number" value={editRecipe.dose} onChange={e => setEditRecipe(r => ({ ...r, dose: e.target.value }))} placeholder="e.g. 15" onFocus={onFoc} onBlur={onBlr} /></Field>
                        <Field label="Water (g)"><input style={inp()} type="number" value={editRecipe.water} onChange={e => setEditRecipe(r => ({ ...r, water: e.target.value }))} placeholder="e.g. 250" onFocus={onFoc} onBlur={onBlr} /></Field>
                        <Field label="Temperature (°C)"><input style={inp()} type="number" value={editRecipe.temperature} onChange={e => setEditRecipe(r => ({ ...r, temperature: e.target.value }))} placeholder="e.g. 96" onFocus={onFoc} onBlur={onBlr} /></Field>
                        <Field label="Grind Size"><input style={inp()} value={editRecipe.grindSize} onChange={e => setEditRecipe(r => ({ ...r, grindSize: e.target.value }))} placeholder="e.g. 3.2" onFocus={onFoc} onBlur={onBlr} /></Field>
                        <Field label="Bloom Water (g)"><input style={inp()} type="number" value={editRecipe.bloomWater} onChange={e => setEditRecipe(r => ({ ...r, bloomWater: e.target.value }))} placeholder="e.g. 45" onFocus={onFoc} onBlur={onBlr} /></Field>
                        <Field label="Bloom Time (s)"><input style={inp()} type="number" value={editRecipe.bloomTime} onChange={e => setEditRecipe(r => ({ ...r, bloomTime: e.target.value }))} placeholder="e.g. 45" onFocus={onFoc} onBlur={onBlr} /></Field>
                        <Field label="Number of Pours"><input style={inp()} type="number" value={editRecipe.numPours} onChange={e => setEditRecipe(r => ({ ...r, numPours: e.target.value }))} placeholder="e.g. 3" onFocus={onFoc} onBlur={onBlr} /></Field>
                        <Field label="Total Time (mm:ss)"><input style={inp()} value={editRecipe.totalTime} onChange={e => setEditRecipe(r => ({ ...r, totalTime: e.target.value }))} placeholder="e.g. 2:30" onFocus={onFoc} onBlur={onBlr} /></Field>
                      </div>
                      {editRecipe.dose && editRecipe.water && (
                        <div style={{ marginTop: "9px", padding: "9px 13px", background: "rgba(200,137,58,0.07)", borderRadius: "7px", fontSize: "13px", color: "#c8893a" }}>
                          Brew ratio: 1:{calcRatio(editRecipe.dose, editRecipe.water)}
                        </div>
                      )}
                      <div style={{ marginTop: "11px" }}>
                        <Field label="Pour Structure">
                          <textarea style={inp({ resize: "vertical", minHeight: "68px", lineHeight: 1.6 })} value={editRecipe.pourStructure} onChange={e => setEditRecipe(r => ({ ...r, pourStructure: e.target.value }))} placeholder="e.g. Bloom 45g → 150g at 0:45 → 250g at 1:30" onFocus={onFoc} onBlur={onBlr} />
                        </Field>
                      </div>
                    </section>
                  </>)}

                  {editRecipe.method !== "Pour Over" && (
                    <div style={{ textAlign: "center", padding: "32px 0", border: "1px dashed rgba(200,137,58,0.15)", borderRadius: "10px" }}>
                      <div style={{ fontSize: "13px", color: "#4a3a2a" }}>{editRecipe.method} recipe fields coming soon</div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
                    <button onClick={saveRecipe} disabled={!editRecipe.name}
                      style={{ flex: 1, background: editRecipe.name ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.15)", border: "none", borderRadius: "9px", color: editRecipe.name ? "#fff" : "#4a3020", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: editRecipe.name ? "pointer" : "not-allowed" }}>
                      Save Recipe
                    </button>
                    <button onClick={() => setEditRecipe(null)}
                      style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#6a5040", cursor: "pointer", fontSize: "14px" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Recipes list
              <div>
                {recipes.length === 0 ? (
                  <div style={{ textAlign: "center", marginTop: "60px" }}>
                    <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.2 }}>📋</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#5a4030", marginBottom: "8px" }}>No saved recipes yet</div>
                    <div style={{ fontSize: "13px", color: "#3a2a1a" }}>Hit "+ New Recipe" to save a reusable brew recipe</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {recipes.map(recipe => (
                      <div key={recipe.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.18)", borderRadius: "12px", padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", marginBottom: "4px" }}>{recipe.name}</div>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              <Tag>{recipe.method}</Tag>
                              {recipe.brewer && <Tag>{recipe.brewer}</Tag>}
                              {recipe.filterPaper && <Tag>{recipe.filterPaper}</Tag>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => setEditRecipe({ ...recipe })}
                              style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#9a7a5a", cursor: "pointer", padding: "5px 10px", fontSize: "12px" }}>Edit</button>
                            <button onClick={() => deleteRecipe(recipe.id)}
                              style={{ background: "none", border: "1px solid rgba(200,50,50,0.2)", borderRadius: "7px", color: "#8a4a4a", cursor: "pointer", padding: "5px 10px", fontSize: "12px" }}>Delete</button>
                          </div>
                        </div>
                        {recipe.method === "Pour Over" && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                            {[
                              { l: "Dose", v: recipe.dose ? `${recipe.dose}g` : null },
                              { l: "Water", v: recipe.water ? `${recipe.water}g` : null },
                              { l: "Ratio", v: calcRatio(recipe.dose, recipe.water) ? `1:${calcRatio(recipe.dose, recipe.water)}` : null },
                              { l: "Temp", v: recipe.temperature ? `${recipe.temperature}°C` : null },
                              { l: "Grind", v: recipe.grindSize || null },
                              { l: "Bloom", v: recipe.bloomWater ? `${recipe.bloomWater}g` : null },
                              { l: "# Pours", v: recipe.numPours || null },
                              { l: "Time", v: recipe.totalTime || null },
                            ].filter(x => x.v).map(x => (
                              <div key={x.l} style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "7px 6px", textAlign: "center" }}>
                                <div style={{ fontSize: "12px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{x.v}</div>
                                <div style={{ fontSize: "9px", color: "#5a4030", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>{x.l}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {recipe.pourStructure && (
                          <div style={{ marginTop: "10px", fontSize: "12px", color: "#7a6050", lineHeight: 1.6, borderLeft: "2px solid rgba(200,137,58,0.2)", paddingLeft: "10px" }}>
                            {recipe.pourStructure}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── BREWS TAB ── */}
        {view === "beans" && tab === "brews" && !selectedBrew && (() => {
          // Flatten all brews across all beans
          const allBrews = beans.flatMap(bean =>
            bean.brews.map(brew => ({ brew, bean }))
          );

          // Filter
          const filteredBrews = allBrews.filter(({ brew, bean }) => {
            if (brewFilterMethod && brew.method !== brewFilterMethod) return false;
            if (brewFilterBean && bean.id !== parseInt(brewFilterBean)) return false;
            return true;
          });

          // Sort
          const sortedBrews = [...filteredBrews].sort((a, b) => {
            if (brewSort === "date") return new Date(b.brew.date) - new Date(a.brew.date);
            if (brewSort === "rating") return (b.brew.rating || 0) - (a.brew.rating || 0);
            return 0;
          });

          const activeBrewFilters = [brewFilterMethod, brewFilterBean].filter(Boolean).length;

          return (
            <div>
              {/* Title */}
              <div style={{ marginBottom: "22px" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", marginBottom: "4px" }}>Brews</div>
                <div style={{ fontSize: "10px", color: "#5a4030", letterSpacing: "0.18em", textTransform: "uppercase" }}>All brew sessions</div>
              </div>

              {/* Filter bar */}
              {allBrews.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
                  {/* Method filter */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    {brewMethods.map(m => (
                      <button key={m} onClick={() => setBrewFilterMethod(brewFilterMethod === m ? "" : m)}
                        style={{ padding: "5px 11px", borderRadius: "20px", border: `1px solid ${brewFilterMethod === m ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: brewFilterMethod === m ? "rgba(200,137,58,0.18)" : "transparent", color: brewFilterMethod === m ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "12px", transition: "all 0.15s" }}>
                        {m}
                      </button>
                    ))}
                  </div>
                  {/* Bean filter */}
                  {beans.length > 1 && (
                    <select value={brewFilterBean} onChange={e => setBrewFilterBean(e.target.value)}
                      style={{ ...IS, width: "auto", fontSize: "12px", padding: "5px 10px", cursor: "pointer", borderColor: brewFilterBean ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)", color: brewFilterBean ? "#c8a060" : "#5a4a3a" }}>
                      <option value="">All Beans</option>
                      {beans.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  )}
                  {/* Sort */}
                  <select value={brewSort} onChange={e => setBrewSort(e.target.value)}
                    style={{ ...IS, width: "auto", fontSize: "12px", padding: "5px 10px", cursor: "pointer", color: "#9a7a5a" }}>
                    <option value="date">Latest first</option>
                    <option value="rating">Highest rated</option>
                  </select>
                  {/* Clear */}
                  {activeBrewFilters > 0 && (
                    <button onClick={() => { setBrewFilterMethod(""); setBrewFilterBean(""); }}
                      style={{ padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(200,80,80,0.3)", background: "transparent", color: "#8a5050", cursor: "pointer", fontSize: "12px" }}>
                      Clear {activeBrewFilters} ✕
                    </button>
                  )}
                </div>
              )}

              <div style={{ fontSize: "11px", color: "#4a3a2a", marginBottom: "12px", letterSpacing: "0.04em" }}>
                {sortedBrews.length} brew{sortedBrews.length !== 1 ? "s" : ""}
              </div>

              {allBrews.length === 0 ? (
                <div style={{ textAlign: "center", marginTop: "60px" }}>
                  <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.2 }}>☕</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#5a4030", marginBottom: "8px" }}>No brews yet</div>
                  <div style={{ fontSize: "13px", color: "#3a2a1a" }}>Add a bean and log your first brew</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {sortedBrews.map(({ brew, bean }) => (
                    <div key={`${bean.id}-${brew.id}`}
                      onClick={() => setSelectedBrew({ brew, bean })}
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.18)", borderRadius: "12px", padding: "15px 18px", cursor: "pointer", transition: "all 0.18s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,137,58,0.06)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.4)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.18)"; }}>
                      {/* Bean info */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", marginBottom: "2px" }}>{bean.name}</div>
                          <div style={{ fontSize: "11px", color: "#6a5040" }}>{[bean.roaster, bean.origin].filter(Boolean).join(" · ")}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <StarRating value={brew.rating} size={13} />
                          <div style={{ fontSize: "11px", color: "#4a3a2a", marginTop: "3px" }}>{brew.date}</div>
                        </div>
                      </div>
                      {/* Tags */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                        {brew.method && <Tag>{brew.method}</Tag>}
                        {brew.brewer && <Tag>{brew.brewer}</Tag>}
                        {brew.recipeSource && brew.recipeSource !== "Manual" && (
                          <span style={{ fontSize: "11px", color: "#7a9a7a", background: "rgba(100,160,100,0.08)", padding: "3px 9px", borderRadius: "20px" }}>
                            {brew.recipeSource}{brew.recipeName ? `: ${brew.recipeName}` : ""}
                          </span>
                        )}
                      </div>
                      {/* Key params */}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {brew.dose && brew.water && <Tag>1:{calcRatio(brew.dose, brew.water)}</Tag>}
                        {brew.temperature && <Tag>{brew.temperature}°C</Tag>}
                        {brew.totalTime && <Tag>{brew.totalTime}</Tag>}
                      </div>
                      {brew.tastingNotes && (
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "#6a5a40", fontStyle: "italic", lineHeight: 1.5 }}>
                          "{brew.tastingNotes.slice(0, 80)}{brew.tastingNotes.length > 80 ? "…" : ""}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── BREW DETAIL (standalone) ── */}
        {view === "beans" && tab === "brews" && selectedBrew && (() => {
          const { brew, bean } = selectedBrew;
          return (
            <div>
              <button onClick={() => setSelectedBrew(null)}
                style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", marginBottom: "20px", padding: 0 }}>
                ← All Brews
              </button>

              {/* Bean reference */}
              <div style={{ background: "rgba(200,137,58,0.05)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", cursor: "pointer" }}
                onClick={() => { setActiveBean(bean); setSelectedBrew(null); setTab("beans"); setView("beanDetail"); }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#6a5040", textTransform: "uppercase", marginBottom: "4px" }}>Bean</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", marginBottom: "2px" }}>{bean.name}</div>
                <div style={{ fontSize: "12px", color: "#7a6050" }}>{[bean.roaster, bean.origin, bean.roastLevel].filter(Boolean).join(" · ")}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "4px" }}>Brew Session</div>
                  <div style={{ fontSize: "12px", color: "#6a5040" }}>{brew.date}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <StarRating value={brew.rating} size={18} />
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => editBrew(brew, bean)}
                      style={{ background: "none", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "7px", color: "#9a7a5a", cursor: "pointer", fontSize: "12px", padding: "5px 11px" }}>
                      Edit Brew
                    </button>
                    <button onClick={() => copyBrewToRecipe(brew)}
                      style={{ background: "none", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "7px", color: "#9a7a5a", cursor: "pointer", fontSize: "12px", padding: "5px 11px" }}>
                      → Save as Recipe
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
                {brew.method && <Tag>{brew.method}</Tag>}
                {brew.brewer && <Tag>{brew.brewer}</Tag>}
                {brew.filterPaper && <Tag>{brew.filterPaper}</Tag>}
                {brew.recipeSource && (
                  <span style={{ fontSize: "11px", color: brew.recipeSource === "Manual" ? "#9a7a5a" : "#7a9a7a", background: brew.recipeSource === "Manual" ? "rgba(200,137,58,0.08)" : "rgba(100,160,100,0.08)", padding: "3px 9px", borderRadius: "20px" }}>
                    {brew.recipeSource}{brew.recipeName ? `: ${brew.recipeName}` : ""}
                  </span>
                )}
              </div>

              {/* Stats */}
              {brew.method === "Pour Over" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "18px" }}>
                  {[
                    { l: "Dose", v: brew.dose ? `${brew.dose}g` : null },
                    { l: "Water", v: brew.water ? `${brew.water}g` : null },
                    { l: "Ratio", v: calcRatio(brew.dose, brew.water) ? `1:${calcRatio(brew.dose, brew.water)}` : null },
                    { l: "Temp", v: brew.temperature ? `${brew.temperature}°C` : null },
                    { l: "Grind", v: brew.grindSize || null },
                    { l: "Time", v: brew.totalTime || null },
                    { l: "Bloom", v: brew.bloomWater ? `${brew.bloomWater}g` : null },
                    { l: "Bloom ×", v: bloomRatio(brew.bloomWater, brew.dose) ? `×${bloomRatio(brew.bloomWater, brew.dose)}` : null },
                    { l: "# Pours", v: brew.numPours || null },
                  ].filter(x => x.v).map(x => (
                    <div key={x.l} style={{ background: "rgba(200,137,58,0.05)", border: "1px solid rgba(200,137,58,0.1)", borderRadius: "9px", padding: "11px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: "16px", color: "#f0e6d3", fontFamily: "'Playfair Display', serif" }}>{x.v}</div>
                      <div style={{ fontSize: "9px", color: "#6a5040", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: "3px" }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              )}

              {brew.pourStructure && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9a7a5a", textTransform: "uppercase", marginBottom: "8px" }}>Pour Structure</div>
                  <div style={{ fontSize: "13px", color: "#c8a878", lineHeight: 1.7, background: "rgba(200,137,58,0.05)", padding: "12px", borderRadius: "8px", borderLeft: "2px solid rgba(200,137,58,0.35)" }}>
                    {brew.pourStructure}
                  </div>
                </div>
              )}

              {brew.tastingNotes && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9a7a5a", textTransform: "uppercase", marginBottom: "8px" }}>Tasting Notes</div>
                  <div style={{ fontSize: "14px", color: "#c8a878", lineHeight: 1.7, fontStyle: "italic" }}>"{brew.tastingNotes}"</div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── BEAN FORM ── */}
        {view === "beanForm" && editBean && (
          <div>
            <button onClick={() => setView("beans")} style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← Back</button>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>{editBean.id ? "Edit Bean" : "New Bean"}</div>
            <div style={{ fontSize: "13px", color: "#6a5040", marginBottom: "24px" }}>Fill in what you know — more detail gives better AI suggestions</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
              <section>
                <SectionHead>Identity</SectionHead>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                  <Field label="Bean / Lot Name">
                    <input style={inp()} value={editBean.name} onChange={e => setB("name", e.target.value)} placeholder="e.g. Sidra Las Flores" onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                  <Field label="Roaster">
                    <input style={inp()} value={editBean.roaster} onChange={e => setB("roaster", e.target.value)} placeholder="e.g. Nomad" onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                  <Field label="Country / Origin">
                    <input style={inp()} value={editBean.origin} onChange={e => setB("origin", e.target.value)} placeholder="e.g. Colombia" onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                  <Field label="Region">
                    <input style={inp()} value={editBean.region} onChange={e => setB("region", e.target.value)} placeholder="e.g. Huila, Nariño" onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                  <Field label="Roast Date">
                    <input style={inp()} type="date" value={editBean.roastDate} onChange={e => setB("roastDate", e.target.value)} onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                </div>
              </section>

              <section>
                <SectionHead>Profile — used for AI suggestions</SectionHead>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                  <Field label="Roast Level">
                    <select style={inp({ cursor: "pointer" })} value={editBean.roastLevel} onChange={e => setB("roastLevel", e.target.value)} onFocus={onFoc} onBlur={onBlr}>
                      <option value="">Select…</option>
                      {roastLevels.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Process">
                    <select style={inp({ cursor: "pointer" })} value={editBean.process} onChange={e => setB("process", e.target.value)} onFocus={onFoc} onBlur={onBlr}>
                      <option value="">Select…</option>
                      {processOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Varietal">
                    <input style={inp()} value={editBean.varietal} onChange={e => setB("varietal", e.target.value)} placeholder="e.g. Gesha, Bourbon, Sidra" onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                  <Field label="Altitude" hint="e.g. 1800m">
                    <input style={inp()} value={editBean.altitude} onChange={e => setB("altitude", e.target.value)} placeholder="e.g. 1800m" onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                  <Field label="Type">
                    <div style={{ display: "flex", gap: "8px" }}>
                      {beanTypes.map(t => (
                        <button key={t} onClick={() => setB("type", editBean.type === t ? "" : t)}
                          style={{ flex: 1, padding: "9px", borderRadius: "7px", border: `1px solid ${editBean.type === t ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: editBean.type === t ? "rgba(200,137,58,0.18)" : "transparent", color: editBean.type === t ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "13px", transition: "all 0.15s" }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                <div style={{ marginTop: "11px" }}>
                  <Field label="Roaster's Tasting Notes" hint="Helps the AI tailor the recipe">
                    <textarea style={inp({ resize: "vertical", minHeight: "65px", lineHeight: 1.6 })}
                      value={editBean.notes} onChange={e => setB("notes", e.target.value)}
                      placeholder="e.g. Jasmine, tropical fruit, creamy body…" onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                </div>
              </section>

              <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
                <button onClick={saveBean} disabled={!editBean.name}
                  style={{ flex: 1, background: editBean.name ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.15)", border: "none", borderRadius: "9px", color: editBean.name ? "#fff" : "#4a3020", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: editBean.name ? "pointer" : "not-allowed" }}>
                  Save Bean
                </button>
                <button onClick={() => setView("beans")}
                  style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#6a5040", cursor: "pointer", fontSize: "14px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BEAN DETAIL ── */}
        {view === "beanDetail" && liveBean && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <button onClick={() => setView("beans")} style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", padding: 0 }}>← All Beans</button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setEditBean({ ...liveBean }); setView("beanForm"); }}
                  style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#9a7a5a", cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}>Edit</button>
                <button onClick={() => deleteBean(liveBean.id)}
                  style={{ background: "none", border: "1px solid rgba(200,50,50,0.2)", borderRadius: "7px", color: "#8a4a4a", cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}>Delete</button>
              </div>
            </div>

            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", marginBottom: "4px" }}>{liveBean.name}</div>
            <div style={{ fontSize: "13px", color: "#7a6050", marginBottom: "10px" }}>{[liveBean.roaster, liveBean.origin, liveBean.region].filter(Boolean).join(" · ")}</div>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
              {liveBean.type && <Tag>{liveBean.type}</Tag>}
              {liveBean.roastLevel && <Tag>{liveBean.roastLevel}</Tag>}
              {liveBean.process && <Tag>{liveBean.process}</Tag>}
              {liveBean.varietal && <Tag>{liveBean.varietal}</Tag>}
              {liveBean.altitude && <Tag>{liveBean.altitude}</Tag>}
              {liveBean.roastDate && <span style={{ fontSize: "11px", color: "#6a5040" }}>Roasted {new Date(liveBean.roastDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
            </div>

            {liveBean.notes && (
              <div style={{ marginBottom: "20px", fontSize: "13px", color: "#7a6050", fontStyle: "italic", lineHeight: 1.6, borderLeft: "2px solid rgba(200,137,58,0.22)", paddingLeft: "12px" }}>
                {liveBean.notes}
              </div>
            )}



            {/* Brew log */}
            <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#9a7a5a", textTransform: "uppercase", marginBottom: "12px" }}>
              Brew Log · {liveBean.brews.length} session{liveBean.brews.length !== 1 ? "s" : ""}
            </div>

            {liveBean.brews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "36px 0", color: "#3a2a1a", fontSize: "13px" }}>
                No brews yet — hit "+ Log Brew" to start dialling in
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {liveBean.brews.map((brew, i) => (
                  <div key={brew.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "11px", padding: "15px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", color: "#c8893a" }}>#{liveBean.brews.length - i}</span>
                        <StarRating value={brew.rating} size={13} />
                        <span style={{ fontSize: "11px", color: "#4a3a2a" }}>{brew.date}</span>
                      </div>
                      <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                        <button onClick={() => editBrew(brew, liveBean)}
                          style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#9a7a5a", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>
                          Edit
                        </button>
                        <button onClick={() => copyBrewToRecipe(brew)}
                          style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#9a7a5a", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>
                          → Recipe
                        </button>
                        <button onClick={() => deleteBrew(brew.id)}
                          style={{ background: "none", border: "none", color: "#3a2a1a", cursor: "pointer", fontSize: "14px", padding: "0 4px" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#c8893a"}
                          onMouseLeave={e => e.currentTarget.style.color = "#3a2a1a"}>✕</button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {brew.method && <Tag>{brew.method}</Tag>}
                      {brew.brewer && <Tag>{brew.brewer}</Tag>}
                      {brew.filterPaper && <Tag>{brew.filterPaper}</Tag>}
                      {brew.recipeSource && brew.recipeSource !== "Manual" && (
                        <span style={{ fontSize: "11px", color: "#7a9a7a", background: "rgba(100,160,100,0.08)", padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.03em" }}>
                          {brew.recipeSource}{brew.recipeName ? `: ${brew.recipeName}` : ""}
                        </span>
                      )}
                    </div>
                    {(brew.method === "Pour Over" || brew.method === "Espresso") && <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" }}>
                      {(brew.method === "Pour Over" ? [
                        { l: "Dose", v: brew.dose ? `${brew.dose}g` : null },
                        { l: "Water", v: brew.water ? `${brew.water}g` : null },
                        { l: "Ratio", v: calcRatio(brew.dose, brew.water) ? `1:${calcRatio(brew.dose, brew.water)}` : null },
                        { l: "Temp", v: brew.temperature ? `${brew.temperature}°C` : null },
                        { l: "Grind", v: brew.grindSize || null },
                        { l: "Time", v: brew.totalTime || null },
                        { l: "Bloom", v: brew.bloomWater ? `${brew.bloomWater}g` : null },
                        { l: "Bloom ×", v: bloomRatio(brew.bloomWater, brew.dose) ? `×${bloomRatio(brew.bloomWater, brew.dose)}` : null },
                        { l: "# Pours", v: brew.numPours || null },
                      ] : [
                        { l: "Dose", v: brew.dose ? `${brew.dose}g` : null },
                        { l: "Yield", v: brew.water ? `${brew.water}g` : null },
                        { l: "Ratio", v: calcRatio(brew.dose, brew.water) ? `1:${calcRatio(brew.dose, brew.water)}` : null },
                        { l: "Temp", v: brew.temperature ? `${brew.temperature}°C` : null },
                        { l: "Grind", v: brew.grindSize || null },
                        { l: "Time", v: brew.brewTime ? `${brew.brewTime}s` : null },
                        { l: "Machine", v: brew.machine || null },
                        { l: "Grinder", v: brew.grinder || null },
                        { l: "Pre-heat", v: brew.preHeat || null },
                      ]).filter(x => x.v).map(x => (
                        <div key={x.l} style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                          <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{x.v}</div>
                          <div style={{ fontSize: "9px", color: "#5a4030", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>{x.l}</div>
                        </div>
                      ))}
                    </div>}

                    {brew.pourStructure && (
                      <div style={{ fontSize: "12px", color: "#8a7050", lineHeight: 1.6, marginBottom: "7px", borderLeft: "2px solid rgba(200,137,58,0.2)", paddingLeft: "10px" }}>
                        {brew.pourStructure}
                      </div>
                    )}
                    {brew.tastingNotes && (
                      <div style={{ fontSize: "12px", color: "#6a5a40", fontStyle: "italic", lineHeight: 1.6 }}>
                        "{brew.tastingNotes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BREW FORM ── */}
        {view === "brewForm" && liveBean && (
          <div>
            <button onClick={() => { setView("beanDetail"); setEditingBrewId(null); }} style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← {liveBean.name}</button>

            {/* METHOD SELECTION — shown when not editing */}
            {!editingBrewId && !brewForm.method_confirmed && (
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>Log a Brew</div>
                <div style={{ fontSize: "13px", color: "#6a5040", marginBottom: "32px" }}>Select your brewing method</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {[
                    { method: "Pour Over", icon: "☕", sub: "V60, Chemex, Kalita…" },
                    { method: "Espresso", icon: "🫖", sub: "Shot, lungo, ristretto…" },
                  ].map(({ method, icon, sub }) => (
                    <div key={method}
                      onClick={() => setBr("method_confirmed", method)}
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "14px", padding: "28px 16px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,137,58,0.08)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.6)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.25)"; }}>
                      <div style={{ fontSize: "36px", marginBottom: "12px" }}>{icon}</div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", marginBottom: "6px" }}>{method}</div>
                      <div style={{ fontSize: "11px", color: "#6a5040" }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BREW FORMS — shown after method selected or when editing */}
            {(editingBrewId || brewForm.method_confirmed) && (() => {
              const method = editingBrewId ? brewForm.method : brewForm.method_confirmed;
              return (
                <div>
                  {!editingBrewId && (
                    <button onClick={() => setBr("method_confirmed", null)}
                      style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "12px", marginBottom: "14px", padding: 0 }}>
                      ← Change method
                    </button>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px" }}>{editingBrewId ? "Edit Brew" : method}</div>
                    <span style={{ fontSize: "11px", color: "#9a7a5a", background: "rgba(200,137,58,0.08)", padding: "3px 10px", borderRadius: "20px" }}>{method}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#6a5040", marginBottom: "16px" }}>
                    {[liveBean.roastLevel, liveBean.process, liveBean.origin].filter(Boolean).join(" · ")}
                  </div>

                  {/* Quick-fill buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => { setBrewForm(f => ({ ...f, recipeSource: "AI Generated", recipeName: "" })); setShowAI(true); }}
                        style={{ flex: 1, background: "rgba(200,137,58,0.07)", border: "1px solid rgba(200,137,58,0.28)", borderRadius: "9px", color: "#c8a060", cursor: "pointer", padding: "10px 8px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(200,137,58,0.14)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(200,137,58,0.07)"}>
                        ✦ AI Suggestion
                      </button>
                      <button
                        onClick={() => {
                          const last = liveBean.brews.find(b => b.method === method);
                          if (!last) return;
                          setBrewForm(f => ({ ...f, ...last, id: f.id, date: f.date, recipeSource: "Last Brew", recipeName: "" }));
                        }}
                        disabled={!liveBean.brews.some(b => b.method === method)}
                        style={{ flex: 1, background: liveBean.brews.some(b => b.method === method) ? "rgba(200,137,58,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${liveBean.brews.some(b => b.method === method) ? "rgba(200,137,58,0.28)" : "rgba(255,255,255,0.06)"}`, borderRadius: "9px", color: liveBean.brews.some(b => b.method === method) ? "#c8a060" : "#3a2a1a", cursor: liveBean.brews.some(b => b.method === method) ? "pointer" : "not-allowed", padding: "10px 8px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={e => { if (liveBean.brews.some(b => b.method === method)) e.currentTarget.style.background = "rgba(200,137,58,0.14)"; }}
                        onMouseLeave={e => { if (liveBean.brews.some(b => b.method === method)) e.currentTarget.style.background = "rgba(200,137,58,0.07)"; }}>
                        ↑ Last Brew
                      </button>
                    </div>
                    {recipes.filter(r => r.method === method).length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: "10px", color: "#5a4a3a", letterSpacing: "0.08em", textTransform: "uppercase" }}>Recipes:</span>
                        {recipes.filter(r => r.method === method).map(recipe => (
                          <button key={recipe.id}
                            onClick={() => setBrewForm(f => ({ ...f, ...recipe, id: f.id, date: f.date, recipeSource: "Saved Recipe", recipeName: recipe.name }))}
                            style={{ padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(200,137,58,0.28)", background: "rgba(200,137,58,0.07)", color: "#c8a060", cursor: "pointer", fontSize: "12px" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(200,137,58,0.16)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(200,137,58,0.07)"}>
                            {recipe.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>

              {/* POUR OVER FORM */}
              {method === "Pour Over" && (<>
                <section>
                  <SectionHead>Equipment</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Brewer">
                      <select style={inp({ cursor: "pointer" })} value={brewForm.brewer} onChange={e => setBr("brewer", e.target.value)} onFocus={onFoc} onBlur={onBlr}>
                        <option value="">Select…</option>
                        {pourOverBrewers.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </Field>
                    <Field label="Filter Paper">
                      <select style={inp({ cursor: "pointer" })} value={brewForm.filterPaper} onChange={e => setBr("filterPaper", e.target.value)} onFocus={onFoc} onBlur={onBlr}>
                        <option value="">Select…</option>
                        {filterPapers.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </Field>
                  </div>
                </section>
                <section>
                  <SectionHead>Recipe</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Dose (g)">
                      <input style={inp()} type="number" value={brewForm.dose} onChange={e => setBr("dose", e.target.value)} placeholder="e.g. 15" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Water (g)">
                      <input style={inp()} type="number" value={brewForm.water} onChange={e => setBr("water", e.target.value)} placeholder="e.g. 250" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Temperature (°C)">
                      <input style={inp()} type="number" value={brewForm.temperature} onChange={e => setBr("temperature", e.target.value)} placeholder="e.g. 96" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Grind Size">
                      <input style={inp()} value={brewForm.grindSize} onChange={e => setBr("grindSize", e.target.value)} placeholder="e.g. 3.2 / medium-fine" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                  {brewForm.dose && brewForm.water && (
                    <div style={{ marginTop: "9px", padding: "9px 13px", background: "rgba(200,137,58,0.07)", borderRadius: "7px", fontSize: "13px", color: "#c8893a" }}>
                      Brew ratio: 1:{calcRatio(brewForm.dose, brewForm.water)}
                    </div>
                  )}
                </section>
                <section>
                  <SectionHead>Technique</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Bloom Water (g)">
                      <input style={inp()} type="number" value={brewForm.bloomWater} onChange={e => setBr("bloomWater", e.target.value)} placeholder="e.g. 45" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Bloom Time (s)">
                      <input style={inp()} type="number" value={brewForm.bloomTime} onChange={e => setBr("bloomTime", e.target.value)} placeholder="e.g. 45" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Number of Pours">
                      <input style={inp()} type="number" value={brewForm.numPours} onChange={e => setBr("numPours", e.target.value)} placeholder="e.g. 3" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Total Time (mm:ss)">
                      <input style={inp()} value={brewForm.totalTime} onChange={e => setBr("totalTime", e.target.value)} placeholder="e.g. 2:30" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Date">
                      <input style={inp()} type="date" value={brewForm.date} onChange={e => setBr("date", e.target.value)} onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                  {brewForm.bloomWater && brewForm.dose && (
                    <div style={{ marginTop: "9px", padding: "9px 13px", background: "rgba(200,137,58,0.07)", borderRadius: "7px", fontSize: "13px", color: "#c8893a" }}>
                      Bloom ratio: ×{bloomRatio(brewForm.bloomWater, brewForm.dose)} dose
                    </div>
                  )}
                  <div style={{ marginTop: "11px" }}>
                    <Field label="Pour Structure">
                      <textarea style={inp({ resize: "vertical", minHeight: "68px", lineHeight: 1.6 })}
                        value={brewForm.pourStructure} onChange={e => setBr("pourStructure", e.target.value)}
                        placeholder="e.g. Bloom 45g → 150g at 0:45 → 250g at 1:30" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                </section>
              </>)}

              {/* ESPRESSO FORM */}
              {method === "Espresso" && (<>
                <section>
                  <SectionHead>Equipment</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Espresso Machine">
                      <input style={inp()} value={brewForm.machine} onChange={e => setBr("machine", e.target.value)} placeholder="e.g. Gaggia Classic" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Grinder">
                      <input style={inp()} value={brewForm.grinder} onChange={e => setBr("grinder", e.target.value)} placeholder="e.g. Niche Zero" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                  <div style={{ marginTop: "11px" }}>
                    <Field label="Pre-heat Setting" hint="Group head / machine temperature">
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {preHeatOptions.map(opt => (
                          <button key={opt} onClick={() => setBr("preHeat", brewForm.preHeat === opt ? "" : opt)}
                            style={{ padding: "7px 16px", borderRadius: "20px", border: `1px solid ${brewForm.preHeat === opt ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: brewForm.preHeat === opt ? "rgba(200,137,58,0.18)" : "transparent", color: brewForm.preHeat === opt ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "13px", transition: "all 0.15s" }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                </section>
                <section>
                  <SectionHead>Recipe</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Dose (g)">
                      <input style={inp()} type="number" value={brewForm.dose} onChange={e => setBr("dose", e.target.value)} placeholder="e.g. 18" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Yield / Water (g)">
                      <input style={inp()} type="number" value={brewForm.water} onChange={e => setBr("water", e.target.value)} placeholder="e.g. 36" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Grind Setting">
                      <input style={inp()} value={brewForm.grindSize} onChange={e => setBr("grindSize", e.target.value)} placeholder="e.g. 20 clicks" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Temperature (°C)">
                      <input style={inp()} type="number" value={brewForm.temperature} onChange={e => setBr("temperature", e.target.value)} placeholder="e.g. 93" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                  {brewForm.dose && brewForm.water && (
                    <div style={{ marginTop: "9px", padding: "9px 13px", background: "rgba(200,137,58,0.07)", borderRadius: "7px", fontSize: "13px", color: "#c8893a" }}>
                      Brew ratio: 1:{calcRatio(brewForm.dose, brewForm.water)}
                    </div>
                  )}
                </section>
                <section>
                  <SectionHead>Technique</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Brew Time (seconds)">
                      <input style={inp()} type="number" value={brewForm.brewTime} onChange={e => setBr("brewTime", e.target.value)} placeholder="e.g. 28" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Date">
                      <input style={inp()} type="date" value={brewForm.date} onChange={e => setBr("date", e.target.value)} onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                </section>
              </>)}

              {/* Tasting — always shown */}
              <section>
                <SectionHead>Tasting</SectionHead>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Field label="Rating">
                    <StarRating value={brewForm.rating} onChange={v => setBr("rating", v)} />
                  </Field>
                  <Field label="Tasting Notes">
                    <textarea style={inp({ resize: "vertical", minHeight: "80px", lineHeight: 1.6 })}
                      value={brewForm.tastingNotes} onChange={e => setBr("tastingNotes", e.target.value)}
                      placeholder="Flavours, body, finish…" onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                </div>
              </section>

              <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
                <button onClick={saveBrew}
                  style={{ flex: 1, background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "9px", color: "#fff", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: "pointer" }}>
                  {editingBrewId ? "Update Brew" : "Save Brew"}
                </button>
                <button onClick={() => { setView("beanDetail"); setEditingBrewId(null); }}
                  style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#6a5040", cursor: "pointer", fontSize: "14px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
          );
        })()}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransfer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#141008", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "16px", width: "100%", maxWidth: "480px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px" }}>
                {showTransfer === "export" ? "Export Data" : "Import Data"}
              </div>
              <button onClick={() => { setShowTransfer(null); setImportText(""); setImportStatus(""); }}
                style={{ background: "none", border: "none", color: "#6a5040", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>

            {showTransfer === "export" && (() => {
              const code = exportData();
              return (
                <div>
                  <p style={{ fontSize: "13px", color: "#7a6050", lineHeight: 1.6, marginBottom: "16px" }}>
                    Copy this code and paste it into the Import screen on your other device. It contains all your beans, brews and recipes.
                  </p>
                  <textarea readOnly value={code}
                    style={{ ...IS, resize: "none", height: "140px", fontSize: "11px", fontFamily: "monospace", lineHeight: 1.5, color: "#c8a878" }}
                    onFocus={e => e.target.select()} />
                  <button
                    onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); }}
                    style={{ width: "100%", marginTop: "12px", background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "9px", color: "#fff", padding: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
                    Copy to Clipboard
                  </button>
                  <div style={{ marginTop: "10px", fontSize: "11px", color: "#4a3a2a", textAlign: "center" }}>
                    {beans.length} bean{beans.length !== 1 ? "s" : ""} · {beans.reduce((a, b) => a + b.brews.length, 0)} brew{beans.reduce((a, b) => a + b.brews.length, 0) !== 1 ? "s" : ""} · {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} included
                  </div>
                </div>
              );
            })()}

            {showTransfer === "import" && (
              <div>
                <p style={{ fontSize: "13px", color: "#7a6050", lineHeight: 1.6, marginBottom: "16px" }}>
                  Paste the export code from your other device below. This will replace all current data on this device.
                </p>
                <textarea
                  value={importText}
                  onChange={e => { setImportText(e.target.value); setImportStatus(""); }}
                  placeholder="Paste your export code here…"
                  style={{ ...IS, resize: "none", height: "140px", fontSize: "11px", fontFamily: "monospace", lineHeight: 1.5 }} />
                {importStatus === "error" && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#c87060" }}>Invalid code — make sure you copied the full export text.</div>
                )}
                {importStatus === "success" && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#60c880" }}>✓ Data imported successfully!</div>
                )}
                <button onClick={importData} disabled={!importText.trim()}
                  style={{ width: "100%", marginTop: "12px", background: importText.trim() ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.15)", border: "none", borderRadius: "9px", color: importText.trim() ? "#fff" : "#4a3020", padding: "12px", fontSize: "14px", fontWeight: "500", cursor: importText.trim() ? "pointer" : "not-allowed" }}>
                  Import Data
                </button>
                <div style={{ marginTop: "10px", fontSize: "11px", color: "#4a3a2a", textAlign: "center" }}>
                  ⚠ This will overwrite existing data on this device
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAI && liveBean && (
        <AIModal
          bean={liveBean}
          onClose={() => setShowAI(false)}
          onApply={(recipe) => {
            setBrewForm({
              ...defaultBrew,
              date: new Date().toISOString().split("T")[0],
              dose: String(recipe.dose || ""),
              water: String(recipe.water || ""),
              temperature: String(recipe.temperature || ""),
              grindSize: recipe.grindSize || "",
              bloomWater: String(recipe.bloomWater || ""),
              bloomTime: String(recipe.bloomTime || ""),
              numPours: String(recipe.numPours || ""),
              totalTime: recipe.totalTime || "",
              pourStructure: recipe.pourStructure || "",
            });
            setShowAI(false);
            setView("brewForm");
          }}
        />
      )}
    </div>
  );
}
