import { useState } from "react";
import AIModal from "./components/modals/AIModal";
import BeanCard from "./components/BeanCard";
import { BrewCard, BrewDetail } from "./components/BrewCard";
import {
  defaultRecipe,
  processOptions,
  roastLevels,
  beanTypes,
  defaultBean,
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
import { beanPayload } from "./features/beans/model";
import { brewPayload } from "./features/brews/model";
import { recipePayload } from "./features/recipes/model";

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
    loadRecipesData,
    setBeans,
    setRecipes,
  });
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
  const [filterRoaster, setFilterRoaster] = useState("");
  const [saveError, setSaveError] = useState("");
  const [brewFilterMethod, setBrewFilterMethod] = useState("");
  const [brewFilterBean, setBrewFilterBean] = useState("");
  const [brewSort, setBrewSort] = useState("date");

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
    const saved = await saveRecipeData(token, editRecipe);
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
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const deleted = await deleteBeanData(token, id);
    if (deleted) {
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
    const updated = beans.map(b => {
      if (b.id !== activeBean.id) return b;
      const nextBrews = editingBrewId
        ? b.brews.map(br => br.id === editingBrewId ? savedWithPours : br)
        : [savedWithPours, ...b.brews];
      return { ...b, brews: sortBrewsNewestFirst(nextBrews) };
    });

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
      canLogBrew={view === "beanDetail" && !!liveBean}
      onLogBrew={() => { setBrewForm({ ...defaultBrew, date: new Date().toISOString().split("T")[0] }); setView("brewForm"); }}
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
          <RecipesView
            recipes={recipes}
            editRecipe={editRecipe}
            setEditRecipe={setEditRecipe}
            defaultRecipe={defaultRecipe}
            deleteRecipe={deleteRecipe}
            saveRecipe={saveRecipe}
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
              setTab("beans");
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
