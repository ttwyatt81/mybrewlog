import { useEffect, useState } from "react";
import AIModal from "./components/modals/AIModal";
import BeanCard from "./components/BeanCard";
import { BrewCard, BrewDetail } from "./components/BrewCard";
import {
  defaultRecipe,
  processOptions,
  roastLevels,
  beanTypes,
  defaultBean,
  defaultGreenBeanRoast,
  brewMethods,
  preHeatOptions,
  pourOverBrewers,
  filterPapers,
  defaultBrew
} from "./lib/constants";
import {
  sbInsert,
} from "./lib/supabase";
import { useBeans } from "./features/beans/hooks";
import {
  normalizePourSteps,
  buildPourStructureFromForm,
  parseTimeValue,
  formatSecondsToTime,
  getComputedBrewWater,
  parsePourStepsFromStructure,
  getTechniqueLinesFromBrew,
  sortBrewsNewestFirst
} from "./features/brews/model";
import { useBrews } from "./features/brews/hooks";
import {
  normalizeRecipeRow,
} from "./features/recipes/model";
import { useRecipes } from "./features/recipes/hooks";
import Tag from "./components/ui/Tag";
import Field from "./components/ui/Field";
import SectionHead from "./components/ui/SectionHead";
import StatBox from "./components/ui/StatBox";
import StarRating from "./components/ui/StarRating";
import { IS, inp, onFoc, onBlr } from "./components/ui/formStyles";
import BeanForm from "./components/forms/BeanForm";
import AppShell from "./components/layout/AppShell";
import AuthView from "./components/views/AuthView";
import BeansView from "./components/views/BeansView";
import BrewsView from "./components/views/BrewsView";
import RecipesView from "./components/views/RecipesView";
import BeanDetailView from "./components/views/BeanDetailView";
import BrewFormView from "./components/views/BrewFormView";
import TransferImportView from "./components/views/TransferImportView";
import { useAuthSession } from "./features/auth/useAuthSession";
import { useImportExport } from "./features/transfer/useImportExport";
import { beanPayload, getVisibleBeans, sortBeansByRecentActivity } from "./features/beans/model";
import { brewPayload } from "./features/brews/model";
import { recipePayload } from "./features/recipes/model";
import { useGreenBeans } from "./features/greenBeans/hooks";

// Cache row IDs per table so we always update the same row

function calcRatio(dose, water) {
  if (!dose || !water || isNaN(dose) || isNaN(water)) return null;
  return (parseFloat(water) / parseFloat(dose)).toFixed(1);
}
function bloomRatio(bloomWater, dose) {
  if (!bloomWater || !dose || isNaN(bloomWater) || isNaN(dose)) return null;
  return (parseFloat(bloomWater) / parseFloat(dose)).toFixed(1);
}

export default function App() {
  const { beans, setBeans, load: loadBeansData, save: saveBeanData, remove: deleteBeanData } = useBeans();
  const { beans: greenBeans, setBeans: setGreenBeans, load: loadGreenBeansData, save: saveGreenBeanData, remove: deleteGreenBeanData } = useGreenBeans();
  const { load: loadBrewsData, save: saveBrewData, remove: deleteBrewData } = useBrews();
  const { recipes, setRecipes, load: loadRecipesData, save: saveRecipeData, remove: deleteRecipeData } = useRecipes();
  const {
    session,
    currentUser,
    authState,
    authEmail,
    setAuthEmail,
    authCode,
    setAuthCode,
    authError,
    setAuthError,
    authLoading,
    loading,
    setLoading,
    loadData,
    ensureValidAccessToken,
    handleSendOtp,
    handleVerifyOtp,
    setAuthState,
    handleSignOut,
  } = useAuthSession({
    loadBrewsData,
    loadBeansData,
    loadGreenBeansData,
    loadRecipesData,
    setBeans,
    setGreenBeans,
    setRecipes,
  });
  const [view, setView] = useState("beans");
  const [editBean, setEditBean] = useState(null);
  const [activeBean, setActiveBean] = useState(null);
  const [brewForm, setBrewForm] = useState(defaultBrew);
  const [greenBeanRoastForm, setGreenBeanRoastForm] = useState(defaultGreenBeanRoast);
  const [editingGreenBeanRoastId, setEditingGreenBeanRoastId] = useState(null);
  const [roastProfiles, setRoastProfiles] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("mybrewlog-roast-profiles");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [roastProfileForm, setRoastProfileForm] = useState({
    id: null,
    name: "",
  });
  const [showAI, setShowAI] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterType, setFilterType] = useState("");
  const [editRecipe, setEditRecipe] = useState(null);
  const [tab, setTab] = useState("beans"); // beans | greenBeans | recipes | brews
  const [beanTab, setBeanTab] = useState("beans");
  const [beanListMode, setBeanListMode] = useState("active"); // active | archived
  const [greenBeanListMode, setGreenBeanListMode] = useState("active"); // active | archived
  const [recipeListMode, setRecipeListMode] = useState("active"); // active | archived
  const [selectedBrew, setSelectedBrew] = useState(null); // { brew, bean } for standalone detail
  const [editingBrewId, setEditingBrewId] = useState(null); // id of brew being edited
  const [showTransfer, setShowTransfer] = useState(null); // "export" | "import" | null
  const [importText, setImportText] = useState("");
  const [filterRoaster, setFilterRoaster] = useState("");
  const [saveError, setSaveError] = useState("");
  const [brewFilterMethod, setBrewFilterMethod] = useState("");
  const [brewFilterBean, setBrewFilterBean] = useState("");
  const [brewSort, setBrewSort] = useState("date");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mybrewlog-roast-profiles", JSON.stringify(roastProfiles));
    }
  }, [roastProfiles]);

  useEffect(() => {
    if (tab === "beans" || tab === "greenBeans") {
      setBeanTab(tab);
    }
  }, [tab]);

  const {
    exportData,
    importData,
    importing,
    exporting,
    error: transferError,
    importSuccess,
    clearFeedback,
  } = useImportExport({
    sessionToken: session?.access_token,
    getAccessToken: ensureValidAccessToken,
    beans,
    recipes,
    setBeans,
    loadData,
    setGlobalLoading: setLoading,
    setSaveError,
    insertRow: sbInsert,
    buildBeanPayload: beanPayload,
    buildBrewPayload: brewPayload,
    buildRecipePayload: recipePayload,
  });

  const getAccessTokenOrFail = async () => {
    const { token, errorType } = await ensureValidAccessToken();
    if (token) return token;
    if (errorType && errorType !== "invalid_refresh_token") {
      setSaveError("Session temporarily unavailable. Please try again.");
    }
    return null;
  };

  const saveRecipe = async () => {
    if (!editRecipe?.name) return;
    setSaveError("");
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const recipeToSave = {
      ...editRecipe,
      water: editRecipe.method === "Pour Over"
        ? (getComputedBrewWater(editRecipe) || "")
        : (editRecipe.shotYield || editRecipe.water || ""),
    };
    const saved = await saveRecipeData(token, recipeToSave);
    if (!saved) {
      setSaveError("Failed to save recipe. Check your connection and try again.");
      return;
    }
    setEditRecipe(null);
  };

  const deleteRecipe = async (id) => {
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const deleted = await deleteRecipeData(token, id);
    if (deleted) {
      setEditRecipe(null);
    }
  };

  const toggleArchiveRecipe = async (recipe) => {
    if (!recipe?.id) return;
    setSaveError("");
    const token = await getAccessTokenOrFail();
    if (!token) return;

    const nextValue = !Boolean(recipe.archived);
    const saved = await saveRecipeData(token, { ...recipe, archived: nextValue });
    if (!saved) {
      setSaveError("Failed to update recipe status. Check your connection and try again.");
      return;
    }

    if (recipeListMode === "active" && nextValue) {
      setView("beans");
    }
    if (recipeListMode === "archived" && !nextValue) {
      setView("beans");
    }
  };

  const handleImportData = async () => {
    const imported = await importData(importText);
    if (!imported) return;
    setTimeout(() => {
      setShowTransfer(null);
      setImportText("");
      clearFeedback();
    }, 1500);
  };

  const saveBean = async () => {
    if (!editBean?.name) return;
    setSaveError("");
    if (tab === "greenBeans") {
      const token = await getAccessTokenOrFail();
      if (!token) return;
      const saved = await saveGreenBeanData(token, editBean);
      if (!saved) {
        setSaveError("Failed to save green bean. Check your connection and try again.");
        return;
      }
      setEditBean(null);
      setView("beans");
      return;
    }
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const saved = await saveBeanData(token, editBean);
    if (!saved) {
      setSaveError("Failed to save bean. Check your connection and try again.");
      return;
    }
    setEditBean(null);
    setView("beans");
  };

  const deleteBean = async (id) => {
    if (tab === "greenBeans") {
      const token = await getAccessTokenOrFail();
      if (!token) return;
      const deleted = await deleteGreenBeanData(token, id);
      if (!deleted) {
        setSaveError("Failed to delete green bean. Check your connection and try again.");
        return;
      }
      if (activeBean?.id === id) {
        setActiveBean(null);
      }
      setView("beans");
      return;
    }
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const deleted = await deleteBeanData(token, id);
    if (deleted) {
      setView("beans");
    }
  };

  const toggleArchiveBean = async (bean) => {
    if (!bean?.id) return;
    if (tab === "greenBeans") {
      const token = await getAccessTokenOrFail();
      if (!token) return;
      const nextValue = !Boolean(bean.archived);
      const saved = await saveGreenBeanData(token, { ...bean, archived: nextValue });
      if (!saved) {
        setSaveError("Failed to update green bean status. Check your connection and try again.");
        return;
      }
      if (activeBean?.id === bean.id) {
        setActiveBean((current) => current ? { ...current, archived: nextValue } : current);
      }

      if (greenBeanListMode === "active" && nextValue) {
        setView("beans");
      }
      if (greenBeanListMode === "archived" && !nextValue) {
        setView("beans");
      }
      return;
    }
    const token = await getAccessTokenOrFail();
    if (!token) return;

    const nextValue = !Boolean(bean.archived);
    const updatedBean = { ...bean, archived: nextValue };
    const saved = await saveBeanData(token, updatedBean);
    if (!saved) {
      setSaveError("Failed to update bean status. Check your connection and try again.");
      return;
    }

    setBeans((current) => sortBeansByRecentActivity(
      current.map((item) => item.id === bean.id ? { ...item, archived: nextValue } : item)
    ));

    if (beanListMode === "active" && nextValue) {
      setView("beans");
    }
    if (beanListMode === "archived" && !nextValue) {
      setView("beans");
    }
  };

  const saveBrew = async () => {
    if (!activeBean) return;
    setSaveError("");
    const token = await getAccessTokenOrFail();
    if (!token) return;
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
    const saved = await saveBrewData(token, brewToSave);
    if (!saved) {
      setSaveError("Failed to save brew. Check your connection and try again.");
      return;
    }

    const savedWithPours = saved ? { ...saved, pours: brewForm.pours || [] } : saved;
    const updated = sortBeansByRecentActivity(beans.map(b => {
      if (b.id !== activeBean.id) return b;
      const nextBrews = editingBrewId
        ? b.brews.map(br => br.id === editingBrewId ? savedWithPours : br)
        : [savedWithPours, ...b.brews];
      return { ...b, brews: sortBrewsNewestFirst(nextBrews) };
    }));

    setBeans(updated);
    setActiveBean(updated.find(b => b.id === activeBean.id));
    setEditingBrewId(null);
    setView("beanDetail");
  };

  const deleteBrew = async (brewId) => {
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const deleted = await deleteBrewData(token, brewId);
    if (!deleted) return;
    if (!activeBean) return;
    const updated = sortBeansByRecentActivity(
      beans.map(b => b.id === activeBean.id ? { ...b, brews: b.brews.filter(br => br.id !== brewId) } : b)
    );
    setBeans(updated);
    setActiveBean(updated.find(b => b.id === activeBean.id));
  };

  const saveGreenBeanRoast = async () => {
    if (!activeBean || tab !== "greenBeans") return;
    if (!greenBeanRoastForm.date || !greenBeanRoastForm.roastLevel) return;
    setSaveError("");
    const token = await getAccessTokenOrFail();
    if (!token) return;

    const startWeight = greenBeanRoastForm.startWeight !== "" && greenBeanRoastForm.startWeight !== undefined && greenBeanRoastForm.startWeight !== null ? Number(greenBeanRoastForm.startWeight) : null;
    const endWeight = greenBeanRoastForm.endWeight !== "" && greenBeanRoastForm.endWeight !== undefined && greenBeanRoastForm.endWeight !== null ? Number(greenBeanRoastForm.endWeight) : null;
    const reductionPercent = startWeight && endWeight && startWeight > 0
      ? (((startWeight - endWeight) / startWeight) * 100).toFixed(1)
      : "";

    const nextRoasts = [...(activeBean.roasts || [])];
    const roastPayload = {
      id: editingGreenBeanRoastId || null,
      date: greenBeanRoastForm.date,
      profile: greenBeanRoastForm.profile || "",
      roastLevel: greenBeanRoastForm.roastLevel,
      startWeight: greenBeanRoastForm.startWeight,
      endWeight: greenBeanRoastForm.endWeight,
      reductionPercent,
      notes: greenBeanRoastForm.notes || "",
    };

    const existingIndex = nextRoasts.findIndex((item) => item.id === editingGreenBeanRoastId);
    if (existingIndex >= 0) {
      nextRoasts[existingIndex] = roastPayload;
    } else {
      nextRoasts.unshift(roastPayload);
    }

    const saved = await saveGreenBeanData(token, { ...activeBean, roasts: nextRoasts });
    if (!saved) {
      setSaveError("Failed to save green bean roast. Check your connection and try again.");
      return;
    }

    const updatedList = greenBeans.map((bean) => bean.id === activeBean.id ? { ...bean, roasts: saved.roasts || nextRoasts } : bean);
    setGreenBeans(updatedList);
    setActiveBean({ ...activeBean, roasts: saved.roasts || nextRoasts });
    setEditingGreenBeanRoastId(null);
    setGreenBeanRoastForm(defaultGreenBeanRoast);
    setView("beanDetail");
  };

  const deleteGreenBeanRoast = async (roastId) => {
    if (!activeBean || tab !== "greenBeans") return;
    const token = await getAccessTokenOrFail();
    if (!token) return;

    const nextRoasts = (activeBean.roasts || []).filter((roast) => roast.id !== roastId);
    const saved = await saveGreenBeanData(token, { ...activeBean, roasts: nextRoasts });
    if (!saved) {
      setSaveError("Failed to delete green bean roast. Check your connection and try again.");
      return;
    }

    const updatedList = greenBeans.map((bean) => bean.id === activeBean.id ? { ...bean, roasts: saved.roasts || nextRoasts } : bean);
    setGreenBeans(updatedList);
    setActiveBean({ ...activeBean, roasts: saved.roasts || nextRoasts });
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
      method_confirmed: brew.method || "Pour Over",
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
      pours: Array.isArray(brew.pours) ? brew.pours : [],
      machine: brew.machine || "",
      grinder: brew.grinder || "",
      preHeat: brew.preHeat || "",
      preInfusionTime: brew.preInfusionTime || "",
      preInfusionBar: brew.preInfusionBar || "",
      maxPressureBar: brew.maxPressureBar || "",
      maxPressureUntilG: brew.maxPressureUntilG || "",
      finishPressureBar: brew.finishPressureBar || "",
      shotYield: brew.shotYield || brew.water || "",
      brewTime: brew.brewTime || "",
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

  const sheetBeans = tab === "greenBeans" ? greenBeans : beans;
  const sheetListMode = tab === "greenBeans" ? greenBeanListMode : beanListMode;
  const sheetSetListMode = tab === "greenBeans" ? setGreenBeanListMode : setBeanListMode;

  const visibleBeans = getVisibleBeans(sheetBeans, sheetListMode);
  const allOrigins = [...new Set(visibleBeans.map(b => b.origin).filter(Boolean))].sort();
  const allRoasters = [...new Set(visibleBeans.map(b => b.roaster).filter(Boolean))].sort();

  const filtered = visibleBeans.filter(b => {
    if (filter && ![b.name, b.roaster, b.origin, b.region, b.process, b.roastLevel].join(" ").toLowerCase().includes(filter.toLowerCase())) return false;
    if (filterOrigin && b.origin !== filterOrigin) return false;
    if (filterType && b.type !== filterType) return false;
    if (filterRoaster && b.roaster !== filterRoaster) return false;
    return true;
  });

  const activeFilterCount = [filterOrigin, filterType, filterRoaster].filter(Boolean).length;
  const visibleRecipes = [...recipes].filter((recipe) => recipeListMode === "archived"
    ? Boolean(recipe.archived)
    : !Boolean(recipe.archived));

  const bestBrew = (bean) => bean.brews.length ? bean.brews.reduce((a, b) => b.rating > a.rating ? b : a, bean.brews[0]) : null;

  const liveBean = activeBean ? sheetBeans.find(b => b.id === activeBean.id) || activeBean : null;

  const onLogRoast = () => {
    setGreenBeanRoastForm({ ...defaultGreenBeanRoast, date: new Date().toISOString().split("T")[0] });
    setEditingGreenBeanRoastId(null);
    setView("greenBeanRoastForm");
  };

  const saveRoastProfile = () => {
    const cleanName = roastProfileForm.name.trim();
    if (!cleanName) return;

    const nextPreset = {
      id: roastProfileForm.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
      name: cleanName,
      profile: cleanName,
    };

    setRoastProfiles((current) => {
      const existingIndex = current.findIndex((profile) => profile.id === nextPreset.id);
      if (existingIndex >= 0) {
        return current.map((profile) => profile.id === nextPreset.id ? nextPreset : profile);
      }
      return [nextPreset, ...current];
    });

    setRoastProfileForm({ id: null, name: "" });
  };

  const deleteRoastProfile = (id) => {
    setRoastProfiles((current) => current.filter((profile) => profile.id !== id));
    if (roastProfileForm.id === id) {
      setRoastProfileForm({ id: null, name: "" });
    }
  };

  const applyRoastPreset = (preset) => {
    if (!preset) return;

    setGreenBeanRoastForm((current) => ({
      ...defaultGreenBeanRoast,
      ...current,
      profile: preset.profile || preset.name || current.profile,
      roastLevel: preset.roastLevel || current.roastLevel || "Medium",
      startWeight: preset.startWeight ?? current.startWeight,
      endWeight: preset.endWeight ?? current.endWeight,
      notes: preset.notes ?? current.notes,
    }));
    setView("greenBeanRoastForm");
  };

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
        <div style={{ minHeight: "100vh", background: "#0c0905", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#c9b094" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px", animation: "spin 1.4s linear infinite", display: "inline-block" }}>⟳</div>
            <div style={{ fontSize: "13px" }}>Loading your brews…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      );
    }

    return (
    <AppShell
      view={view}
      tab={tab}
      setTab={setTab}
      setView={setView}
      canLogBrew={view === "beanDetail" && !!liveBean && tab !== "greenBeans"}
      canLogRoast={view === "beanDetail" && !!liveBean && tab === "greenBeans"}
      onLogBrew={() => { setBrewForm({ ...defaultBrew, date: new Date().toISOString().split("T")[0] }); setView("brewForm"); }}
      onLogRoast={onLogRoast}
      userEmail={currentUser?.email || session?.email}
      onSync={async () => {
        const token = await getAccessTokenOrFail();
        if (token) loadData(token);
      }}
      onSignOut={handleSignOut}
      loading={loading}
    >

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "22px 16px" }}>

        {/* ── BEANS LIST ── */}
        {view === "beans" && (tab === "beans" || tab === "greenBeans") && (
          <BeansView
            title={tab === "greenBeans" ? "Green Beans" : "Roasted Beans"}
            isGreenBeanSheet={tab === "greenBeans"}
            beans={sheetBeans}
            saveError={saveError}
            setSaveError={setSaveError}
            setShowTransfer={setShowTransfer}
            showTransferActions={tab !== "greenBeans"}
            filter={filter}
            setFilter={setFilter}
            filterOrigin={filterOrigin}
            setFilterOrigin={setFilterOrigin}
            filterType={filterType}
            setFilterType={setFilterType}
            filterRoaster={filterRoaster}
            setFilterRoaster={setFilterRoaster}
            allOrigins={allOrigins}
            allRoasters={allRoasters}
            activeFilterCount={activeFilterCount}
            setEditBean={setEditBean}
            setView={setView}
            bestBrew={bestBrew}
            setActiveBean={setActiveBean}
            Tag={Tag}
            defaultBean={defaultBean}
            filtered={filtered}
            beanListMode={sheetListMode}
            setBeanListMode={sheetSetListMode}
            beansCount={visibleBeans.length}
            onToggleArchive={toggleArchiveBean}
          />
        )}

        {/* ── RECIPES TAB ── */}
        {view === "beans" && tab === "recipes" && (
          <RecipesView
            recipes={visibleRecipes}
            editRecipe={editRecipe}
            setEditRecipe={setEditRecipe}
            defaultRecipe={defaultRecipe}
            deleteRecipe={deleteRecipe}
            saveRecipe={saveRecipe}
            recipeListMode={recipeListMode}
            setRecipeListMode={setRecipeListMode}
            onToggleArchive={toggleArchiveRecipe}
            brewMethods={brewMethods}
            pourOverBrewers={pourOverBrewers}
            filterPapers={filterPapers}
            preHeatOptions={preHeatOptions}
            calcRatio={calcRatio}
            bloomRatio={bloomRatio}
            getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
            Tag={Tag}
            Field={Field}
            SectionHead={SectionHead}
            inp={inp}
            onFoc={onFoc}
            onBlr={onBlr}
          />
        )}

        {/* ── BREWS TAB ── */}
        {view === "beans" && tab === "brews" && !selectedBrew && (
          <BrewsView
            beans={beans}
            brewMethods={brewMethods}
            brewFilterMethod={brewFilterMethod}
            setBrewFilterMethod={setBrewFilterMethod}
            brewFilterBean={brewFilterBean}
            setBrewFilterBean={setBrewFilterBean}
            brewSort={brewSort}
            setBrewSort={setBrewSort}
            setSelectedBrew={setSelectedBrew}
            BrewCard={BrewCard}
            IS={IS}
          />
        )}

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
              setTab(beanTab);
              setView("beanDetail");
            }}
          />
        )}

        {/* ── BEAN FORM ── */}
        {view === "beanForm" && editBean && (
          <BeanForm
            editBean={editBean}
            setB={setB}
            saveBean={saveBean}
            setView={setView}
            isGreenBeanSheet={tab === "greenBeans"}
            SectionHead={SectionHead}
            Field={Field}
            inp={inp}
            onFoc={onFoc}
            onBlr={onBlr}
            roastLevels={roastLevels}
            processOptions={processOptions}
            beanTypes={beanTypes}
          />
        )}

        {/* ── BEAN DETAIL ── */}
        {view === "beans" && tab === "roastProfiles" && (
          <div>
            <div style={{ marginBottom: "22px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", letterSpacing: "0.02em", marginBottom: "4px" }}>Roast Profiles</div>
              <div style={{ fontSize: "10px", color: "#c3aa90", letterSpacing: "0.18em", textTransform: "uppercase" }}>Saved roast name presets</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {roastProfiles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#3a2a1a", fontSize: "13px" }}>No roast presets yet.</div>
              ) : (
                roastProfiles.map((profile) => (
                  <div key={profile.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "10px", padding: "12px 14px" }}>
                    <span style={{ color: "#d4bca0", fontSize: "13px" }}>{profile.name}</span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button onClick={() => applyRoastPreset(profile)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#d4bca0", cursor: "pointer", padding: "5px 9px", fontSize: "11px" }}>Use</button>
                      <button onClick={() => setRoastProfileForm(profile)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#d4bca0", cursor: "pointer", padding: "5px 9px", fontSize: "11px" }}>Edit</button>
                      <button onClick={() => deleteRoastProfile(profile.id)} style={{ background: "none", border: "1px solid rgba(200,50,50,0.2)", borderRadius: "6px", color: "#8a4a4a", cursor: "pointer", padding: "5px 9px", fontSize: "11px" }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === "beanDetail" && liveBean && (
          <BeanDetailView
            liveBean={liveBean}
            setEditBean={setEditBean}
            setView={setView}
            isGreenBeanSheet={tab === "greenBeans"}
            deleteBean={deleteBean}
            editBrew={editBrew}
            copyBrewToRecipe={copyBrewToRecipe}
            deleteBrew={deleteBrew}
            calcRatio={calcRatio}
            bloomRatio={bloomRatio}
            getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
            StarRating={StarRating}
            onToggleArchive={toggleArchiveBean}
            onLogRoast={onLogRoast}
            onEditRoast={(roast) => {
              setGreenBeanRoastForm({
                id: roast.id || null,
                date: roast.date || new Date().toISOString().split("T")[0],
                profile: roast.profile || "",
                roastLevel: roast.roastLevel || "Medium",
                startWeight: roast.startWeight || "",
                endWeight: roast.endWeight || "",
                reductionPercent: roast.reductionPercent || "",
                notes: roast.notes || "",
              });
              setEditingGreenBeanRoastId(roast.id || null);
              setView("greenBeanRoastForm");
            }}
            onDeleteRoast={deleteGreenBeanRoast}
          />
        )}

        {view === "greenBeanRoastForm" && liveBean && (
          <div>
            <button onClick={() => { setView("beanDetail"); setEditingGreenBeanRoastId(null); setGreenBeanRoastForm(defaultGreenBeanRoast); }} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← {liveBean.name}</button>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>{editingGreenBeanRoastId ? "Edit Roast" : "Log Roast"}</div>
                <div style={{ fontSize: "13px", color: "#c9b094", marginBottom: "18px" }}>{liveBean.name}</div>
              </div>

              <div style={{ display: "grid", gap: "14px" }}>
                <Field label="Roast Date">
                  <input style={inp()} type="date" value={greenBeanRoastForm.date} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, date: e.target.value }))} onFocus={onFoc} onBlur={onBlr} />
                </Field>

                <Field label="Roast Profile">
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      list="roast-profile-suggestions"
                      style={{ ...inp(), flex: 1 }}
                      value={greenBeanRoastForm.profile}
                      onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, profile: e.target.value }))}
                      placeholder="e.g. 12g charge, 1st crack at 1:20"
                      onFocus={onFoc}
                      onBlur={onBlr}
                    />
                    <datalist id="roast-profile-suggestions">
                      {roastProfiles.map((profile) => (
                        <option key={profile.id} value={profile.name} />
                      ))}
                    </datalist>
                    <button onClick={() => { setTab("roastProfiles"); setView("beans"); }} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", padding: "7px 10px", fontSize: "12px", whiteSpace: "nowrap" }}>Profiles</button>
                  </div>
                </Field>

                <Field label="Roast Level">
                  <select style={inp({ cursor: "pointer" })} value={greenBeanRoastForm.roastLevel} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, roastLevel: e.target.value }))} onFocus={onFoc} onBlur={onBlr}>
                    <option value="">Select roast</option>
                    {roastLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Field label="Start Weight (g)">
                    <input style={inp()} type="number" min="0" step="0.1" value={greenBeanRoastForm.startWeight} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, startWeight: e.target.value }))} onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                  <Field label="End Weight (g)">
                    <input style={inp()} type="number" min="0" step="0.1" value={greenBeanRoastForm.endWeight} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, endWeight: e.target.value }))} onFocus={onFoc} onBlur={onBlr} />
                  </Field>
                </div>

                {greenBeanRoastForm.startWeight && greenBeanRoastForm.endWeight && Number(greenBeanRoastForm.startWeight) > 0 && (
                  <div style={{ background: "rgba(200,137,58,0.05)", border: "1px solid rgba(200,137,58,0.18)", borderRadius: "10px", padding: "10px 12px", color: "#d8b98c", fontSize: "12px" }}>
                    Reduction %: {(((((Number(greenBeanRoastForm.startWeight) - Number(greenBeanRoastForm.endWeight)) / Number(greenBeanRoastForm.startWeight)) * 100) || 0).toFixed(1))}%
                  </div>
                )}

                <Field label="Notes">
                  <textarea style={inp({ resize: "vertical", minHeight: "90px", lineHeight: 1.6 })} value={greenBeanRoastForm.notes} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, notes: e.target.value }))} placeholder="What stood out in the roast?" onFocus={onFoc} onBlur={onBlr} />
                </Field>
              </div>

              <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
                <button onClick={saveGreenBeanRoast} style={{ flex: 1, background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "9px", color: "#fff", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: "pointer" }}>
                  {editingGreenBeanRoastId ? "Update Roast" : "Save Roast"}
                </button>
                <button onClick={() => { setView("beanDetail"); setEditingGreenBeanRoastId(null); setGreenBeanRoastForm(defaultGreenBeanRoast); }} style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#c9b094", cursor: "pointer", fontSize: "14px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BREW FORM ── */}
        {view === "brewForm" && liveBean && (
          <div>
            <button onClick={() => { setView("beanDetail"); setEditingBrewId(null); }} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← {liveBean.name}</button>
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
        onClose={() => {
          setShowTransfer(null);
          setImportText("");
          clearFeedback();
        }}
        importText={importText}
        onImportTextChange={(value) => {
          setImportText(value);
          clearFeedback();
        }}
        importError={transferError}
        importSuccess={importSuccess}
        exportData={exportData}
        importData={handleImportData}
        importing={importing}
        exporting={exporting}
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
    </AppShell>
  );
}
