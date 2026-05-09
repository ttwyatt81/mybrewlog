import { useState, useEffect } from "react";

const SUPABASE_URL = "https://jgmvlrxeglotnpdenuvn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnbXZscnhlZ2xvdG5wZGVudXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjE3MDYsImV4cCI6MjA5Mzg5NzcwNn0.YBc_DI-yfa1_488YxD-AM70B1QvLcaHznlmdFR2Gulg";

async function sbGet(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  return res.ok ? res.json() : [];
}

async function sbUpsert(table, id, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({ id, data: JSON.stringify(data) })
  });
}

async function sbDelete(table, id) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
}

// Unique device/user row IDs
const BEANS_ROW_ID = 1;
const RECIPES_ROW_ID = 1;

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
const pourOverBrewers = ["V60", "Chemex", "Kalita Wave", "Origami", "Aeropress", "Clever Dripper", "Other"];
const filterPapers = ["Hario Tabbed (white)", "Hario Tabbed (natural)", "Hario Untabbed", "Chemex Bonded", "Kalita Wave", "Bleached", "Unbleached", "Metal filter", "Cloth filter", "Other"];

const defaultBrew = {
  id: null, date: new Date().toISOString().split("T")[0],
  method: "Pour Over", brewer: "", filterPaper: "",
  dose: "", water: "", temperature: "", grindSize: "",
  bloomWater: "", bloomTime: "", numPours: "", totalTime: "",
  pourStructure: "", rating: 0, tastingNotes: "",
  recipeSource: "Manual", recipeName: "",
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

function AIModal({ bean, onClose, onApply }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { fetchSuggestion(); }, []);

  function fetchSuggestion() {
    setLoading(true); setError(null); setResult(null);
    const prompt = `You are an expert specialty coffee consultant specialising in V60 pour over brewing.

Given this coffee:
- Bean/Lot: ${bean.name || "Unknown"}
- Roaster: ${bean.roaster || "Unknown"}
- Origin: ${bean.origin || "Unknown"}
- Region: ${bean.region || "Unknown"}
- Process: ${bean.process || "Unknown"}
- Roast Level: ${bean.roastLevel || "Unknown"}
- Varietal: ${bean.varietal || "Unknown"}
- Altitude: ${bean.altitude || "Unknown"}
- Roaster's tasting notes: ${bean.notes || "None provided"}

Suggest an optimised V60 pour over recipe. Respond ONLY with a valid JSON object — no preamble, no markdown, no explanation outside the JSON. Use this exact schema:
{
  "dose": number,
  "water": number,
  "temperature": number,
  "grindSize": string,
  "bloomWater": number,
  "bloomTime": number,
  "numPours": number,
  "totalTime": string,
  "pourStructure": string,
  "rationale": string
}`;

    setTimeout(() => {
      try {
        const recipe = generateRecipe(bean);
        setResult(recipe);
      } catch (err) {
        setError("Error: " + (err?.message || "Could not generate recipe."));
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#141008", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "16px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", marginBottom: "3px" }}>AI Recipe Suggestion</div>
            <div style={{ fontSize: "12px", color: "#6a5040" }}>{bean.name}{bean.roastLevel ? ` · ${bean.roastLevel} Roast` : ""}{bean.origin ? ` · ${bean.origin}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6a5040", cursor: "pointer", fontSize: "20px", padding: "0 4px" }}>✕</button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: "36px", marginBottom: "14px", animation: "spin 1.4s linear infinite", display: "inline-block" }}>⟳</div>
            <div style={{ fontSize: "13px", color: "#6a5040" }}>Analysing bean profile…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && !loading && (
          <div style={{ color: "#c87060", fontSize: "14px", padding: "20px 0", textAlign: "center" }}>
            {error}
            <br />
            <button onClick={fetchSuggestion} style={{ marginTop: "14px", background: "none", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "7px", color: "#c8893a", cursor: "pointer", padding: "7px 14px", fontSize: "13px" }}>Retry</button>
          </div>
        )}

        {result && !loading && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "18px" }}>
              <StatBox label="Dose" value={result.dose ? `${result.dose}g` : null} />
              <StatBox label="Water" value={result.water ? `${result.water}g` : null} />
              <StatBox label="Ratio" value={result.dose && result.water ? `1:${calcRatio(result.dose, result.water)}` : null} />
              <StatBox label="Temp" value={result.temperature ? `${result.temperature}°C` : null} />
              <StatBox label="Grind" value={result.grindSize} />
              <StatBox label="Time" value={result.totalTime} />
              <StatBox label="Bloom" value={result.bloomWater ? `${result.bloomWater}g` : null} />
              <StatBox label="Bloom ×" value={result.bloomWater && result.dose ? `×${bloomRatio(result.bloomWater, result.dose)}` : null} />
              <StatBox label="# Pours" value={result.numPours} />
            </div>

            {result.pourStructure && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9a7a5a", textTransform: "uppercase", marginBottom: "8px" }}>Pour Structure</div>
                <div style={{ fontSize: "13px", color: "#c8a878", lineHeight: 1.7, background: "rgba(200,137,58,0.05)", padding: "12px", borderRadius: "8px", borderLeft: "2px solid rgba(200,137,58,0.35)" }}>
                  {result.pourStructure}
                </div>
              </div>
            )}

            {result.rationale && (
              <div style={{ marginBottom: "22px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9a7a5a", textTransform: "uppercase", marginBottom: "8px" }}>Why this recipe</div>
                <div style={{ fontSize: "13px", color: "#8a7060", lineHeight: 1.7, fontStyle: "italic" }}>{result.rationale}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => onApply(result)} style={{ flex: 1, background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "9px", color: "#fff", padding: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
                Use this Recipe →
              </button>
              <button onClick={fetchSuggestion} style={{ padding: "12px 16px", background: "none", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "9px", color: "#9a7a5a", cursor: "pointer", fontSize: "13px" }}>
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [beans, setBeans] = useState([]);
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
    async function load() {
      try {
        const rows = await sbGet("beans");
        if (rows && rows.length > 0 && rows[0].data) {
          setBeans(JSON.parse(rows[0].data));
        } else {
          // Seed with existing data on first load
          const seed = [{"id":1777975585677,"name":"Eli Espinoza Geisha","roaster":"Kaffeelix","origin":"Peru","region":"Las Pirias, Chirinos","process":"Washed","roastLevel":"","varietal":"Geisha","altitude":"","type":"Filter","roastDate":"2026-04-08","notes":"candied orange, floral, bergamot, chocolate, spicy notes, silky","brews":[]},{"id":1777975356960,"name":"Peru Aurora Huaman","roaster":"Unity Coffee","origin":"Peru","region":"Cajamarca","process":"Washed","roastLevel":"","varietal":"Bourbon and Caturra","altitude":"1889m","type":"Filter","roastDate":"2026-04-01","notes":"Raspberry, hibiscus, and lime","brews":[]},{"id":1777974648055,"name":"Competition Finca Sidra Las Flores","roaster":"Nomad","origin":"Colombia","region":"Acevedo, Huila","process":"Natural","roastLevel":"","varietal":"Sidra Bourbon","altitude":"1750","type":"Filter","notes":"Cocoa nibs, Lychee, Pineapple","brews":[{"id":1777974821637,"date":"2026-05-05","method":"Pour Over","brewer":"V60","filterPaper":"Unbleached","dose":"15","water":"255","temperature":"96","grindSize":"Mediu","bloomWater":"45","bloomTime":"40","numPours":"2","totalTime":"1:50","pourStructure":"Bloom 45g → Pour to 255g at 0:40","rating":5,"tastingNotes":"Lychee and pineapple","recipeSource":"Manual","recipeName":""}],"roastDate":"2026-03-03"},{"id":1777972918886,"name":"Filter Etiopia Hambela","roaster":"Nomad","origin":"Etiopia","region":"Haro Sorsa, Guji zone","process":"Natural","roastLevel":"Light","varietal":"Heirloom","altitude":"2200-2400m","type":"Filter","notes":"Cocoa nibs, cherry, blueberries","brews":[{"id":1777973176701,"date":"2026-05-05","method":"Pour Over","brewer":"V60","filterPaper":"Unbleached","dose":"16","water":"240","temperature":"93","grindSize":"95 clicks","bloomWater":"60","bloomTime":"30","numPours":"3","totalTime":"2:25","pourStructure":"Bloom 60gr -> pour until 180gr at 30s -> pour until 240gr at 1:15s ","rating":4,"tastingNotes":"nothing special to mention"}],"roastDate":"2026-03-11"},{"id":1777972626145,"name":"Filter Burundi Gahahe","roaster":"Nomad","origin":"Burundi","region":"Kayanza, Ga,ahe","process":"Washed","roastLevel":"Light","varietal":"Red Bourbon","altitude":"1800m","type":"Filter","notes":"Floral, Tangerine, Grilled pineapple","brews":[],"roastDate":"2026-03-11"}];
          setBeans(seed);
          await sbUpsert("beans", BEANS_ROW_ID, seed);
        }
      } catch (e) {
        console.log("Error loading beans:", e);
      }
      try {
        const rows = await sbGet("recipes");
        if (rows && rows.length > 0 && rows[0].data) {
          setRecipes(JSON.parse(rows[0].data));
        }
      } catch (e) {
        console.log("Error loading recipes:", e);
      }
    }
    load();
  }, []);

  const persist = async (updated) => {
    setBeans(updated);
    try {
      await sbUpsert("beans", BEANS_ROW_ID, updated);
    } catch (e) {
      console.error("Failed to save beans:", e);
    }
  };

  const persistRecipes = async (updated) => {
    setRecipes(updated);
    try {
      await sbUpsert("recipes", RECIPES_ROW_ID, updated);
    } catch (e) {
      console.error("Failed to save recipes:", e);
    }
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
    if (editingBrewId) {
      // Update existing brew
      updated = beans.map(b => b.id === activeBean.id
        ? { ...b, brews: b.brews.map(br => br.id === editingBrewId ? { ...brewForm, id: editingBrewId } : br) }
        : b
      );
    } else {
      // New brew
      const brew = { ...brewForm, id: Date.now() };
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

  return (
    <div style={{ minHeight: "100vh", background: "#0c0905", backgroundImage: "radial-gradient(ellipse at 15% 15%, rgba(110,55,8,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(50,25,3,0.25) 0%, transparent 55%)", fontFamily: "'DM Sans', sans-serif", color: "#f0e6d3" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(200,137,58,0.13)", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(12,9,5,0.93)", backdropFilter: "blur(14px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div onClick={() => { setView("beans"); setTab("beans"); }} style={{ cursor: "pointer" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "21px", letterSpacing: "0.02em" }}>Bean & Brew</div>
            <div style={{ fontSize: "9px", color: "#5a4030", letterSpacing: "0.18em", textTransform: "uppercase" }}>Coffee Journal</div>
          </div>
          <div style={{ display: "flex", gap: "5px" }}>
            <button onClick={() => setShowTransfer("export")}
              style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#6a5040", cursor: "pointer", padding: "4px 9px", fontSize: "11px", letterSpacing: "0.04em" }}
              title="Export data">↑ Export</button>
            <button onClick={() => setShowTransfer("import")}
              style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#6a5040", cursor: "pointer", padding: "4px 9px", fontSize: "11px", letterSpacing: "0.04em" }}
              title="Import data">↓ Import</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {view === "beans" && tab === "beans" && (
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search beans…"
              style={inp({ width: "130px", fontSize: "13px", padding: "7px 11px" })} onFocus={onFoc} onBlur={onBlr} />
          )}
          {view === "beans" && tab === "beans" && (
            <button onClick={() => { setEditBean({ ...defaultBean }); setView("beanForm"); }}
              style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
              + New Bean
            </button>
          )}
          {view === "beans" && tab === "recipes" && (
            <button onClick={() => setEditRecipe({ ...defaultRecipe })}
              style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
              + New Recipe
            </button>
          )}
          {view === "beanDetail" && liveBean && (
            <button onClick={() => { setBrewForm({ ...defaultBrew, date: new Date().toISOString().split("T")[0] }); setView("brewForm"); }}
              style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
              + Log Brew
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "22px 16px" }}>

        {/* ── TAB BAR ── */}
        {view === "beans" && (
          <div style={{ display: "flex", gap: "0", marginBottom: "24px", borderBottom: "1px solid rgba(200,137,58,0.15)" }}>
            {[{ id: "beans", label: "Beans" }, { id: "recipes", label: "Recipes" }, { id: "brews", label: "Brews" }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#c8893a" : "transparent"}`, color: tab === t.id ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", marginBottom: "-1px" }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── BEANS LIST ── */}
        {view === "beans" && tab === "beans" && (
          <div>
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
                {filtered.map(bean => {
                  const best = bestBrew(bean);
                  return (
                    <div key={bean.id}
                      onClick={() => { setActiveBean(bean); setView("beanDetail"); }}
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.18)", borderRadius: "12px", padding: "16px 18px", cursor: "pointer", transition: "all 0.18s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,137,58,0.06)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.4)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.18)"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", marginBottom: "3px" }}>{bean.name}</div>
                          <div style={{ fontSize: "12px", color: "#7a6050" }}>{[bean.roaster, bean.origin, bean.region].filter(Boolean).join(" · ")}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                          {best?.rating > 0 && <div style={{ fontSize: "12px", color: "#c8893a" }}>{"★".repeat(best.rating)}</div>}
                          <div style={{ fontSize: "11px", color: "#4a3a2a", marginTop: "3px" }}>{bean.brews.length} brew{bean.brews.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: "10px", display: "flex", gap: "7px", flexWrap: "wrap" }}>
                        {bean.type && <Tag>{bean.type}</Tag>}
                        {bean.roastLevel && <Tag>{bean.roastLevel}</Tag>}
                        {bean.process && <Tag>{bean.process}</Tag>}
                        {bean.varietal && <Tag>{bean.varietal}</Tag>}
                        {bean.altitude && <Tag>{bean.altitude}</Tag>}
                        {bean.roastDate && <span style={{ fontSize: "11px", color: "#6a5040", marginLeft: "2px" }}>Roasted {new Date(bean.roastDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── RECIPES TAB ── */}
        {view === "beans" && tab === "recipes" && (
          <div>
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
                    {brew.method === "Pour Over" && <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" }}>
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
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "3px" }}>{editingBrewId ? "Edit Brew" : "Log a Brew"}</div>
            <div style={{ fontSize: "13px", color: "#6a5040", marginBottom: "16px" }}>
              {[liveBean.roastLevel, liveBean.process, liveBean.origin].filter(Boolean).join(" · ")}
            </div>
            {/* Quick-fill buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setBrewForm(f => ({ ...f, recipeSource: "AI Generated", recipeName: "" })); setShowAI(true); }}
                  style={{ flex: 1, background: "rgba(200,137,58,0.07)", border: "1px solid rgba(200,137,58,0.28)", borderRadius: "9px", color: "#c8a060", cursor: "pointer", padding: "10px 8px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(200,137,58,0.14)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(200,137,58,0.07)"}>
                  ✦ AI Suggestion
                </button>
                <button
                  onClick={() => {
                    const last = liveBean.brews[0];
                    if (!last) return;
                    setBrewForm(f => ({ ...f, dose: last.dose, water: last.water, temperature: last.temperature, grindSize: last.grindSize, bloomWater: last.bloomWater, bloomTime: last.bloomTime, numPours: last.numPours, totalTime: last.totalTime, pourStructure: last.pourStructure, recipeSource: "Last Brew", recipeName: "" }));
                  }}
                  disabled={!liveBean.brews.length}
                  style={{ flex: 1, background: liveBean.brews.length ? "rgba(200,137,58,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${liveBean.brews.length ? "rgba(200,137,58,0.28)" : "rgba(255,255,255,0.06)"}`, borderRadius: "9px", color: liveBean.brews.length ? "#c8a060" : "#3a2a1a", cursor: liveBean.brews.length ? "pointer" : "not-allowed", padding: "10px 8px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "all 0.2s" }}
                  onMouseEnter={e => { if (liveBean.brews.length) e.currentTarget.style.background = "rgba(200,137,58,0.14)"; }}
                  onMouseLeave={e => { if (liveBean.brews.length) e.currentTarget.style.background = "rgba(200,137,58,0.07)"; }}>
                  ↑ Last Brew
                </button>
              </div>
              {/* Saved recipes for this method */}
              {recipes.filter(r => r.method === brewForm.method).length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: "#5a4a3a", letterSpacing: "0.08em", textTransform: "uppercase" }}>Recipes:</span>
                  {recipes.filter(r => r.method === brewForm.method).map(recipe => (
                    <button key={recipe.id}
                      onClick={() => setBrewForm(f => ({ ...f,
                        brewer: recipe.brewer || f.brewer,
                        filterPaper: recipe.filterPaper || f.filterPaper,
                        dose: recipe.dose, water: recipe.water, temperature: recipe.temperature,
                        grindSize: recipe.grindSize, bloomWater: recipe.bloomWater, bloomTime: recipe.bloomTime,
                        numPours: recipe.numPours, totalTime: recipe.totalTime, pourStructure: recipe.pourStructure,
                        recipeSource: "Saved Recipe", recipeName: recipe.name,
                      }))}
                      style={{ padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(200,137,58,0.28)", background: "rgba(200,137,58,0.07)", color: "#c8a060", cursor: "pointer", fontSize: "12px", transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(200,137,58,0.16)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(200,137,58,0.07)"}>
                      {recipe.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>

              {/* Method selector */}
              <section>
                <SectionHead>Brew Method</SectionHead>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {brewMethods.map(m => (
                    <button key={m} onClick={() => setBr("method", m)}
                      style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${brewForm.method === m ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: brewForm.method === m ? "rgba(200,137,58,0.18)" : "transparent", color: brewForm.method === m ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "13px", transition: "all 0.15s" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </section>

              {/* Pour Over form */}
              {brewForm.method === "Pour Over" && (<>
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

              {/* Placeholder for other methods */}
              {brewForm.method !== "Pour Over" && (
                <section>
                  <div style={{ textAlign: "center", padding: "32px 0", border: "1px dashed rgba(200,137,58,0.15)", borderRadius: "10px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.3 }}>
                      {brewForm.method === "Espresso" ? "☕" : brewForm.method === "Moka" ? "🫖" : "🍵"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#4a3a2a" }}>{brewForm.method} recipe fields coming soon</div>
                    <div style={{ fontSize: "12px", color: "#3a2a1a", marginTop: "6px" }}>You can still log tasting notes below</div>
                  </div>
                  <div style={{ marginTop: "14px" }}>
                    <Field label="Date">
                      <input style={inp()} type="date" value={brewForm.date} onChange={e => setBr("date", e.target.value)} onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                </section>
              )}

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
                      placeholder="Flavours, acidity, body, finish…" onFocus={onFoc} onBlur={onBlr} />
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
