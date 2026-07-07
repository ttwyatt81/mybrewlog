import { useState, useEffect, useRef } from "react";
import AIModal from "./components/modals/AIModal";
import BeanCard from "./components/BeanCard";
import { BrewCard, BrewDetail } from "./components/BrewCard";
import {
  defaultRecipe,
  processOptions,
  roastLevels,
  varietalOptions,
  beanTypes,
  altitudeOptions,
  defaultBean,
  brewMethods,
  preHeatOptions,
  pourOverBrewers,
  filterPapers,
  defaultBrew
} from "./lib/constants";
import {
  sbSendOtp,
  sbVerifyOtp,
  sbSignOut,
  sbGet,
  sbInsert,
  sbUpsert,
  sbUpdate,
  sbDelete,
  sbRefreshSession,
  sbGetUser
} from "./lib/supabase";
import { beanPayload } from "./features/beans/model";
import { useBeans } from "./features/beans/hooks";
import {
  brewPayload,
  normalizePourSteps,
  buildPourStructureFromForm,
  parseTimeValue,
  formatSecondsToTime,
  getComputedBrewWater,
  parsePourStepsFromStructure,
  getTechniqueLinesFromBrew
} from "./features/brews/model";
import { useBrews } from "./features/brews/hooks";
import {
  normalizeRecipeRow,
  recipePayload
} from "./features/recipes/model";
import { useRecipes } from "./features/recipes/hooks";
import Tag from "./components/ui/Tag";
import Field from "./components/ui/Field";
import SectionHead from "./components/ui/SectionHead";
import StatBox from "./components/ui/StatBox";
import StarRating from "./components/ui/StarRating";
import { IS, inp, onFoc, onBlr } from "./components/ui/formStyles";
import AuthView from "./components/views/AuthView";
import BeansView from "./components/views/BeansView";
import BeanDetailView from "./components/views/BeanDetailView";
import BrewFormView from "./components/views/BrewFormView";
import TransferImportView from "./components/views/TransferImportView";

// Cache row IDs per table so we always update the same row

function calcRatio(dose, water) {
  if (!dose || !water || isNaN(dose) || isNaN(water)) return null;
  return (parseFloat(water) / parseFloat(dose)).toFixed(1);
}
function bloomRatio(bloomWater, dose) {
  if (!bloomWater || !dose || isNaN(bloomWater) || isNaN(dose)) return null;
  return (parseFloat(bloomWater) / parseFloat(dose)).toFixed(1);
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
  const { beans, setBeans, load: loadBeansData, save: saveBeanData, remove: deleteBeanData } = useBeans();
  const { load: loadBrewsData, save: saveBrewData, remove: deleteBrewData } = useBrews();
  const { recipes, setRecipes, load: loadRecipesData, save: saveRecipeData, remove: deleteRecipeData } = useRecipes();
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
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
  const [editRecipe, setEditRecipe] = useState(null);
  const [tab, setTab] = useState("beans"); // beans | recipes | brews
  const [selectedBrew, setSelectedBrew] = useState(null); // { brew, bean } for standalone detail
  const [editingBrewId, setEditingBrewId] = useState(null); // id of brew being edited
  const [showTransfer, setShowTransfer] = useState(null); // "export" | "import" | null
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [filterRoaster, setFilterRoaster] = useState("");
  const [saveError, setSaveError] = useState("");
  const [brewFilterMethod, setBrewFilterMethod] = useState("");
  const [brewFilterBean, setBrewFilterBean] = useState("");
  const [brewSort, setBrewSort] = useState("date");

  const SESSION_KEY = "sb_session";
  const LAST_EMAIL_KEY = "last_auth_email";
  const userLoadInFlightRef = useRef({ token: null, promise: null });
  const activeSessionTokenRef = useRef(null);

  const loadCurrentUser = async (token) => {
    if (!token) {
      setCurrentUser(null);
      userLoadInFlightRef.current = { token: null, promise: null };
      return null;
    }

    const inflight = userLoadInFlightRef.current;
    if (inflight.promise && inflight.token === token) {
      return inflight.promise;
    }

    const promise = (async () => {
      try {
        const user = await sbGetUser(token);
        if (activeSessionTokenRef.current === token) {
          setCurrentUser(user || null);
        }
        return user || null;
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
        if (activeSessionTokenRef.current === token) {
          setCurrentUser(null);
        }
        return null;
      } finally {
        if (userLoadInFlightRef.current.token === token) {
          userLoadInFlightRef.current = { token: null, promise: null };
        }
      }
    })();

    userLoadInFlightRef.current = { token, promise };
    return promise;
  };

  const saveSession = (sessionData) => {
    setSession(sessionData);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setCurrentUser(null);
    setAuthState("login");
    setAuthCode("");
  };

  const refreshSession = async (currentSession) => {
    if (!currentSession?.refresh_token) return null;
    const { session: refreshed, errorType } = await sbRefreshSession(currentSession.refresh_token);
    if (!refreshed) return { session: null, errorType: errorType || "refresh_failed" };

    const nextSession = {
      ...currentSession,
      ...refreshed,
      expires_at: Date.now() + (refreshed.expires_in || 0) * 1000
    };

    saveSession(nextSession);
    return { session: nextSession, errorType: null };
  };

  const getValidAccessToken = async () => {
    if (session?.access_token && session?.expires_at && Date.now() < session.expires_at - 60000) {
      return { token: session.access_token, errorType: null };
    }
    const refreshed = await refreshSession(session);
    return { token: refreshed?.session?.access_token || null, errorType: refreshed?.errorType || null };
  };

  useEffect(() => {
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY);
    if (lastEmail) setAuthEmail(lastEmail);
  }, []);

  useEffect(() => {
    const token = session?.access_token || null;
    activeSessionTokenRef.current = token;
    if (!token) {
      setCurrentUser(null);
      return;
    }
    loadCurrentUser(token);
  }, [session?.access_token]);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;

    try {
      const session = JSON.parse(stored);
      const validAccess = session?.access_token && session?.expires_at && Date.now() < session.expires_at - 60000;

      if (validAccess) {
        setSession(session);
        setAuthState("app");
        loadData(session.access_token);
        return;
      }

      if (session?.refresh_token) {
        (async () => {
          const refreshed = await refreshSession(session);
          if (refreshed?.session) {
            setAuthState("app");
            loadData(refreshed.session.access_token);
          } else if (refreshed?.errorType === "invalid_refresh_token") {
            clearSession();
          } else {
            // Keep remembered email and allow retry later instead of forcing full logout.
            setAuthState("login");
            setAuthCode("");
          }
        })();
        return;
      }

      clearSession();
    } catch {
      clearSession();
    }
  }, []);

  // Sync when app regains focus (multi-device sync)
  useEffect(() => {
    if (!session) return;
    const handleFocus = async () => {
      const { token, errorType } = await getValidAccessToken();
      if (token) {
        loadData(token);
      } else if (errorType === "invalid_refresh_token") {
        clearSession();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [session]);

  async function loadData(token) {
    setLoading(true);
    try {
      const brewRows = await loadBrewsData(token);
      await loadBeansData(token, brewRows);
      await loadRecipesData(token);
    } catch (e) {
      console.error("Load data error:", e);
    }
    setLoading(false);
  }

  const handleSendOtp = async () => {
    if (!authEmail.trim()) return;
    setAuthLoading(true); setAuthError("");
    const cleanEmail = authEmail.trim();
    const { ok, error } = await sbSendOtp(cleanEmail);
    if (ok) { setAuthState("verify"); }
    else { setAuthError(error || "Could not send code. Check your email address."); }
    localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
    setAuthLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (authCode.length < 6) return; // allow 6-8 digits
    setAuthLoading(true); setAuthError("");
    const data = await sbVerifyOtp(authEmail.trim(), authCode.trim());
    if (data) {
      const cleanEmail = authEmail.trim();
      const sess = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in || 0) * 1000,
        email: cleanEmail
      };
      localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
      saveSession(sess);
      setAuthState("app");
      loadData(data.access_token);
    } else {
      setAuthError("Invalid code. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    if (session) await sbSignOut(session.access_token);
    clearSession();
    setBeans([]); setRecipes([]);
  };

  const saveRecipe = async () => {
    if (!editRecipe?.name) return;
    setSaveError("");
    const saved = await saveRecipeData(session?.access_token, editRecipe);
    if (!saved) {
      setSaveError("Failed to save recipe. Check your connection and try again.");
      return;
    }
    setEditRecipe(null);
  };

  const deleteRecipe = async (id) => {
    const deleted = await deleteRecipeData(session?.access_token, id);
    if (deleted) {
      setEditRecipe(null);
    }
  };

  const exportData = () => {
    // Export beans with their brews nested for clarity (even though import flattens them)
    const exportedBeans = beans.map(bean => ({
      id: bean.id,
      name: bean.name,
      roaster: bean.roaster,
      origin: bean.origin,
      region: bean.region,
      roastLevel: bean.roastLevel,
      process: bean.process,
      varietal: bean.varietal,
      altitude: bean.altitude,
      type: bean.type,
      roastDate: bean.roastDate,
      notes: bean.notes,
      brews: (bean.brews || []).map(brew => ({ ...brew, pours: brew.pours || [] }))
    }));
    
    // Flatten brews for easier importing
    const allBrews = beans.flatMap(bean =>
      (bean.brews || []).map(brew => ({ ...brew, bean_id: bean.id, pours: brew.pours || [] }))
    );
    
    const payload = {
      beans: exportedBeans,
      brews: allBrews,
      recipes: recipes.map(r => ({ ...r })),
      exportedAt: new Date().toISOString()
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  };

  const importData = async () => {
    if (!session) return;
    try {
      setLoading(true);
      setSaveError("");
      const decoded = decodeURIComponent(escape(atob(importText.trim())));
      const payload = JSON.parse(decoded);
      
      // Validate required structure
      if (!payload.beans || !Array.isArray(payload.beans)) {
        throw new Error("Invalid export file: missing beans array");
      }
      if (!Array.isArray(payload.brews) && !payload.beans.some(b => Array.isArray(b.brews))) {
        throw new Error("Invalid export file: missing brews data");
      }
      if (!Array.isArray(payload.recipes)) {
        throw new Error("Invalid export file: missing recipes array");
      }

      // Track mapping of old IDs to new IDs for brews (since they reference bean_id)
      const beanIdMap = {};
      const brewPoursMap = {};

      // Import beans: omit ID to create new records (merge, don't overwrite)
      for (const rawBean of payload.beans) {
        const beanPayloadToInsert = beanPayload(rawBean);
        // Don't include the exported ID; let Supabase generate a new one
        const record = await sbInsert("beans", session.access_token, beanPayloadToInsert);
        if (record) {
          // Map old ID to new ID for brew imports
          beanIdMap[rawBean.id] = record.id;
        }
      }

      // Import brews: use flattened brews array if available, else extract from beans.brews
      const brewsToImport = Array.isArray(payload.brews)
        ? payload.brews
        : payload.beans.flatMap(bean => (bean.brews || []).map(brew => ({ ...brew, bean_id: bean.id })));

      for (const rawBrew of brewsToImport) {
        if (rawBrew.bean_id && beanIdMap[rawBrew.bean_id]) {
          // Use new bean ID from the map
          const brewPayloadToInsert = brewPayload(rawBrew);
          brewPayloadToInsert.bean_id = beanIdMap[rawBrew.bean_id];
          // Don't include the exported brew ID; let Supabase generate a new one
          const insertedBrew = await sbInsert("brews", session.access_token, brewPayloadToInsert);
          if (insertedBrew && rawBrew.pours) {
            brewPoursMap[insertedBrew.id] = rawBrew.pours;
          }
        }
      }

      // Import recipes: omit ID to create new records
      for (const rawRecipe of payload.recipes) {
        const recipePayloadToInsert = recipePayload(rawRecipe);
        // Don't include the exported ID; let Supabase generate a new one
        await sbInsert("recipes", session.access_token, recipePayloadToInsert);
      }

      // Reload all data from Supabase to ensure consistency
      await loadData(session.access_token);
      if (Object.keys(brewPoursMap).length > 0) {
        setBeans(currentBeans => currentBeans.map(bean => ({
          ...bean,
          brews: (bean.brews || []).map(brew => brewPoursMap[brew.id] ? { ...brew, pours: brewPoursMap[brew.id] } : brew)
        })));
      }
      setImportStatus("success");
      setTimeout(() => { setShowTransfer(null); setImportText(""); setImportStatus(""); }, 1500);
    } catch (e) {
      console.error("Import error:", e);
      setSaveError(`Import failed: ${e.message}`);
      setImportStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const saveBean = async () => {
    if (!editBean?.name) return;
    setSaveError("");
    const saved = await saveBeanData(session?.access_token, editBean);
    if (!saved) {
      setSaveError("Failed to save bean. Check your connection and try again.");
      return;
    }
    setEditBean(null);
    setView("beans");
  };

  const deleteBean = async (id) => {
    const deleted = await deleteBeanData(session?.access_token, id);
    if (deleted) {
      setView("beans");
    }
  };

  const saveBrew = async () => {
    if (!activeBean) return;
    setSaveError("");
    const finalMethod = brewForm.method_confirmed || brewForm.method;
    const brewToSave = {
      ...brewForm,
      method: finalMethod,
      method_confirmed: undefined,
      bean_id: activeBean.id,
      water: getComputedBrewWater(brewForm),
      totalTime: brewForm.totalTime || "",
      pours: Array.isArray(brewForm.pours) ? brewForm.pours : []
    };
    const saved = await saveBrewData(session?.access_token, brewToSave);
    if (!saved) {
      setSaveError("Failed to save brew. Check your connection and try again.");
      return;
    }

    const savedWithPours = saved ? { ...saved, pours: brewForm.pours || [] } : saved;
    const updated = beans.map(b => {
      if (b.id !== activeBean.id) return b;
      const brews = editingBrewId
        ? b.brews.map(br => br.id === editingBrewId ? savedWithPours : br)
        : [savedWithPours, ...b.brews];
      return { ...b, brews };
    });

    setBeans(updated);
    setActiveBean(updated.find(b => b.id === activeBean.id));
    setEditingBrewId(null);
    setView("beanDetail");
  };

  const deleteBrew = async (brewId) => {
    const deleted = await deleteBrewData(session?.access_token, brewId);
    if (!deleted) return;
    if (!activeBean) return;
    const updated = beans.map(b => b.id === activeBean.id ? { ...b, brews: b.brews.filter(br => br.id !== brewId) } : b);
    setBeans(updated);
    setActiveBean(updated.find(b => b.id === activeBean.id));
  };

  const editBrew = (brew, bean) => {
    setActiveBean(bean);
    setBrewForm({
      ...brew,
      pours: brew.pours && brew.pours.length ? brew.pours : parsePourStepsFromStructure(brew.pourStructure, brew.numPours),
    });
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
  const setPourStep = (index, key, value) => setBrewForm((f) => {
    const pours = normalizePourSteps(f.pours, f.numPours);
    pours[index] = { ...pours[index], [key]: value };
    return { ...f, pours };
  });

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
      <AuthView
        authState={authState}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authCode={authCode}
        setAuthCode={setAuthCode}
        authError={authError}
        authLoading={authLoading}
        handleSendOtp={handleSendOtp}
        handleVerifyOtp={handleVerifyOtp}
        setAuthState={setAuthState}
        setAuthError={setAuthError}
      />
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
            <div style={{ fontSize: "10px", color: "#4a3a2a", letterSpacing: "0.03em", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser?.email || session?.email}</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => loadData(session?.access_token)} disabled={loading} style={{ background: "none", border: "none", color: loading ? "#bbb" : "#5a4030", cursor: loading ? "not-allowed" : "pointer", fontSize: "10px", padding: 0, letterSpacing: "0.05em", textDecoration: "underline" }}>Sync</button>
              <button onClick={handleSignOut} style={{ background: "none", border: "none", color: "#5a4030", cursor: "pointer", fontSize: "10px", padding: 0, letterSpacing: "0.05em" }}>Sign out</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "22px 16px" }}>

        {/* ── BEANS LIST ── */}
        {view === "beans" && tab === "beans" && (
          <BeansView
            beans={beans}
            saveError={saveError}
            setSaveError={setSaveError}
            setShowTransfer={setShowTransfer}
            filter={filter}
            setFilter={setFilter}
            filterOrigin={filterOrigin}
            setFilterOrigin={setFilterOrigin}
            filterVarietal={filterVarietal}
            setFilterVarietal={setFilterVarietal}
            filterType={filterType}
            setFilterType={setFilterType}
            filterRoaster={filterRoaster}
            setFilterRoaster={setFilterRoaster}
            allOrigins={allOrigins}
            allVarietals={allVarietals}
            allRoasters={allRoasters}
            activeFilterCount={activeFilterCount}
            setEditBean={setEditBean}
            setView={setView}
            bestBrew={bestBrew}
            setActiveBean={setActiveBean}
            Tag={Tag}
            defaultBean={defaultBean}
            filtered={filtered}
          />
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
            if (brewFilterBean && bean.id !== brewFilterBean) return false;
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
                    <BrewCard
                      key={`${bean.id}-${brew.id}`}
                      brew={brew}
                      bean={bean}
                      onClick={() => setSelectedBrew({ brew, bean })}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── BREW DETAIL (standalone) ── */}
        {view === "beans" && tab === "brews" && selectedBrew && (
          <BrewDetail
            brew={selectedBrew.brew}
            bean={selectedBrew.bean}
            onBack={() => setSelectedBrew(null)}
            onEdit={() => editBrew(selectedBrew.brew, selectedBrew.bean)}
            onCopyToRecipe={() => copyBrewToRecipe(selectedBrew.brew)}
            onGoToBean={() => {
              setActiveBean(selectedBrew.bean);
              setSelectedBrew(null);
              setTab("beans");
              setView("beanDetail");
            }}
          />
        )}

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
          <BeanDetailView
            liveBean={liveBean}
            setEditBean={setEditBean}
            setView={setView}
            deleteBean={deleteBean}
            editBrew={editBrew}
            copyBrewToRecipe={copyBrewToRecipe}
            deleteBrew={deleteBrew}
            calcRatio={calcRatio}
            bloomRatio={bloomRatio}
            getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
            StarRating={StarRating}
          />
        )}

        {/* ── BREW FORM ── */}
        {view === "brewForm" && liveBean && (
          <div>
            <button onClick={() => { setView("beanDetail"); setEditingBrewId(null); }} style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← {liveBean.name}</button>
            <BrewFormView
              liveBean={liveBean}
              brewForm={brewForm}
              setBrewForm={setBrewForm}
              setBr={setBr}
              setPourStep={setPourStep}
              editingBrewId={editingBrewId}
              recipes={recipes}
              setShowAI={setShowAI}
              saveBrew={saveBrew}
              setView={setView}
              setEditingBrewId={setEditingBrewId}
              getComputedBrewWater={getComputedBrewWater}
              normalizePourSteps={normalizePourSteps}
              buildPourStructureFromForm={buildPourStructureFromForm}
              parseTimeValue={parseTimeValue}
              formatSecondsToTime={formatSecondsToTime}
              getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
              brewMethods={brewMethods}
              pourOverBrewers={pourOverBrewers}
              filterPapers={filterPapers}
              preHeatOptions={preHeatOptions}
              calcRatio={calcRatio}
              bloomRatio={bloomRatio}
              Field={Field}
              SectionHead={SectionHead}
              inp={inp}
              onFoc={onFoc}
              onBlr={onBlr}
            />
          </div>
        )}

      </div>

      {/* Transfer Modal */}
      <TransferImportView
        showTransfer={showTransfer}
        setShowTransfer={setShowTransfer}
        importText={importText}
        setImportText={setImportText}
        importStatus={importStatus}
        setImportStatus={setImportStatus}
        exportData={exportData}
        importData={importData}
        beans={beans}
        recipes={recipes}
      />

      {/* AI Modal */}
      {showAI && liveBean && (
        <AIModal
          bean={liveBean}
          onClose={() => setShowAI(false)}
          onApply={(recipe) => {
            setBrewForm(f => ({
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
              method_confirmed: f.method_confirmed,
              recipeSource: "AI Generated",
              recipeName: "",
            }));
            setShowAI(false);
            setView("brewForm");
          }}
        />
      )}
    </div>
  );
}
