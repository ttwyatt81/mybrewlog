import { useEffect, useRef, useState } from "react";
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
  defaultBrew,
  VIEW_KEYS,
  TAB_KEYS,
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
import AppShell from "./components/layout/AppShell";
import AuthView from "./components/views/AuthView";
import BeanFormView from "./components/views/BeanFormView";
import BeansView from "./components/views/BeansView";
import BrewsView from "./components/views/BrewsView";
import RecipesView from "./components/views/RecipesView";
import BeanDetailScreenView from "./components/views/BeanDetailScreenView";
import BrewFormView from "./components/views/BrewFormView";
import RecipeFormView from "./components/views/RecipeFormView";
import TransferModalView from "./components/views/TransferModalView";
import RoastProfilesView from "./components/views/RoastProfilesView";
import GreenBeanRoastFormView from "./components/views/GreenBeanRoastFormView";
import RoastProfileFormView from "./components/views/RoastProfileFormView";
import { useAuthSession } from "./features/auth/useAuthSession";
import { useImportExport } from "./features/transfer/useImportExport";
import { beanPayload, getVisibleBeans, sortBeansByRecentActivity } from "./features/beans/model";
import { brewPayload } from "./features/brews/model";
import { recipePayload } from "./features/recipes/model";
import { useGreenBeans } from "./features/greenBeans/hooks";
import { useRoastProfiles } from "./features/roastProfiles/hooks";
import { roastProfilePayload } from "./features/roastProfiles/model";

// Cache row IDs per table so we always update the same row
const LEGACY_ROAST_PROFILES_KEY = "mybrewlog-roast-profiles";

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
  const { roastProfiles, setRoastProfiles, load: loadRoastProfilesData, save: saveRoastProfileData, remove: deleteRoastProfileData } = useRoastProfiles();
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
    loadRoastProfilesData,
    setBeans,
    setGreenBeans,
    setRecipes,
    setRoastProfiles,
  });
  const [view, setView] = useState(VIEW_KEYS.BEANS);
  const [editBean, setEditBean] = useState(null);
  const [activeBean, setActiveBean] = useState(null);
  const [brewForm, setBrewForm] = useState(defaultBrew);
  const [greenBeanRoastForm, setGreenBeanRoastForm] = useState(defaultGreenBeanRoast);
  const [editingGreenBeanRoastId, setEditingGreenBeanRoastId] = useState(null);
  const [roastProfileForm, setRoastProfileForm] = useState({
    id: null,
    name: "",
    machine: "",
    description: "",
    lastUsed: "",
    rating: 0,
    archived: false,
  });
  const [showAI, setShowAI] = useState(false);
  const [filter, setFilter] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterType, setFilterType] = useState("");
  const [editRecipe, setEditRecipe] = useState(null);
  const [tab, setTab] = useState(TAB_KEYS.BEANS); // beans | greenBeans | recipes | brews
  const [beanTab, setBeanTab] = useState(TAB_KEYS.BEANS);
  const [beanListMode, setBeanListMode] = useState("active"); // active | archived
  const [greenBeanListMode, setGreenBeanListMode] = useState("active"); // active | archived
  const [recipeListMode, setRecipeListMode] = useState("active"); // active | archived
  const [roastProfileListMode, setRoastProfileListMode] = useState("active"); // active | archived
  const [selectedBrew, setSelectedBrew] = useState(null); // { brew, bean } for standalone detail
  const [editingBrewId, setEditingBrewId] = useState(null); // id of brew being edited
  const [showTransfer, setShowTransfer] = useState(null); // "export" | "import" | null
  const [importText, setImportText] = useState("");
  const [filterRoaster, setFilterRoaster] = useState("");
  const [saveError, setSaveError] = useState("");
  const [brewFilterMethod, setBrewFilterMethod] = useState("");
  const [brewFilterBean, setBrewFilterBean] = useState("");
  const [brewSort, setBrewSort] = useState("date");
  const legacyRoastProfileMigrationRef = useRef(false);

  useEffect(() => {
    if (tab === TAB_KEYS.BEANS || tab === TAB_KEYS.GREEN_BEANS) {
      setBeanTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    if (legacyRoastProfileMigrationRef.current) return;
    if (!session?.access_token) return;
    if (roastProfiles.length > 0) {
      legacyRoastProfileMigrationRef.current = true;
      return;
    }

    let cancelled = false;

    const migrateLegacyRoastProfiles = async () => {
      try {
        const raw = window.localStorage.getItem(LEGACY_ROAST_PROFILES_KEY);
        if (!raw) {
          legacyRoastProfileMigrationRef.current = true;
          return;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          legacyRoastProfileMigrationRef.current = true;
          window.localStorage.removeItem(LEGACY_ROAST_PROFILES_KEY);
          return;
        }

        for (const profile of parsed) {
          if (cancelled) return;
          const cleanName = (profile?.name || profile?.profile || "").trim();
          if (!cleanName) continue;

          await saveRoastProfileData(session.access_token, {
            name: cleanName,
            profile: cleanName,
            machine: profile.machine || "",
            description: profile.description || "",
            lastUsed: profile.lastUsed || "",
            rating: Number(profile.rating) || 0,
            archived: Boolean(profile.archived),
          });
        }

        if (!cancelled) {
          window.localStorage.removeItem(LEGACY_ROAST_PROFILES_KEY);
          legacyRoastProfileMigrationRef.current = true;
        }
      } catch (error) {
        console.error("Failed to migrate legacy roast profiles:", error);
      }
    };

    migrateLegacyRoastProfiles();

    return () => {
      cancelled = true;
    };
  }, [roastProfiles.length, saveRoastProfileData, session?.access_token]);

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
    roastProfiles,
    setBeans,
    setRoastProfiles,
    loadData,
    setGlobalLoading: setLoading,
    setSaveError,
    insertRow: sbInsert,
    buildBeanPayload: beanPayload,
    buildBrewPayload: brewPayload,
    buildRecipePayload: recipePayload,
    buildRoastProfilePayload: roastProfilePayload,
  });

  const getAccessTokenOrFail = async () => {
    const { token, errorType } = await ensureValidAccessToken();
    if (token) return token;
    if (errorType && errorType !== "invalid_refresh_token") {
      setSaveError("Session temporarily unavailable. Please try again.");
    }
    return null;
  };

  const closeRecipeForm = () => {
    setEditRecipe(null);
    setTab(TAB_KEYS.RECIPES);
    setView(VIEW_KEYS.BEANS);
  };

  const openNewRecipeForm = () => {
    setEditRecipe({ ...defaultRecipe, method_confirmed: null });
    setTab(TAB_KEYS.RECIPES);
    setView(VIEW_KEYS.RECIPE_FORM);
  };

  const openEditRecipeForm = (recipe) => {
    setEditRecipe({ ...recipe, method_confirmed: recipe.method || "Pour Over" });
    setTab(TAB_KEYS.RECIPES);
    setView(VIEW_KEYS.RECIPE_FORM);
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
    closeRecipeForm();
  };

  const deleteRecipe = async (id) => {
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const deleted = await deleteRecipeData(token, id);
    if (deleted) {
      closeRecipeForm();
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
      setView(VIEW_KEYS.BEANS);
    }
    if (recipeListMode === "archived" && !nextValue) {
      setView(VIEW_KEYS.BEANS);
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
    if (tab === TAB_KEYS.GREEN_BEANS) {
      const token = await getAccessTokenOrFail();
      if (!token) return;
      const saved = await saveGreenBeanData(token, editBean);
      if (!saved) {
        setSaveError("Failed to save green bean. Check your connection and try again.");
        return;
      }
      setEditBean(null);
      setView(VIEW_KEYS.BEANS);
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
    setView(VIEW_KEYS.BEANS);
  };

  const deleteBean = async (id) => {
    if (tab === TAB_KEYS.GREEN_BEANS) {
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
      setView(VIEW_KEYS.BEANS);
      return;
    }
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const deleted = await deleteBeanData(token, id);
    if (deleted) {
      setView(VIEW_KEYS.BEANS);
    }
  };

  const toggleArchiveBean = async (bean) => {
    if (!bean?.id) return;
    if (tab === TAB_KEYS.GREEN_BEANS) {
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
        setView(VIEW_KEYS.BEANS);
      }
      if (greenBeanListMode === "archived" && !nextValue) {
        setView(VIEW_KEYS.BEANS);
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
      setView(VIEW_KEYS.BEANS);
    }
    if (beanListMode === "archived" && !nextValue) {
      setView(VIEW_KEYS.BEANS);
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
    setView(VIEW_KEYS.BEAN_DETAIL);
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
    if (!activeBean || tab !== TAB_KEYS.GREEN_BEANS) return;
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
      restingFromDays: greenBeanRoastForm.restingFromDays,
      restingToDays: greenBeanRoastForm.restingToDays,
      firstCrack: greenBeanRoastForm.firstCrack,
      totalRoast: greenBeanRoastForm.totalRoast,
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

    const cleanProfileName = (greenBeanRoastForm.profile || "").trim().toLowerCase();
    if (cleanProfileName && greenBeanRoastForm.date) {
      const matchingProfiles = roastProfiles.filter((profile) => ((profile.name || "").trim().toLowerCase()) === cleanProfileName);
      for (const profile of matchingProfiles) {
        await saveRoastProfileData(token, { ...profile, lastUsed: greenBeanRoastForm.date });
      }
    }

    setEditingGreenBeanRoastId(null);
    setGreenBeanRoastForm(defaultGreenBeanRoast);
    setView(VIEW_KEYS.BEAN_DETAIL);
  };

  const deleteGreenBeanRoast = async (roastId) => {
    if (!activeBean || tab !== TAB_KEYS.GREEN_BEANS) return;
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
    setView(VIEW_KEYS.BREW_FORM);
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
    setTab(TAB_KEYS.RECIPES);
    setView(VIEW_KEYS.RECIPE_FORM);
    setSelectedBrew(null);
  };

  const setB = (k, v) => setEditBean(f => ({ ...f, [k]: v }));
  const setBr = (k, v) => setBrewForm(f => ({ ...f, [k]: v }));
  const setPourStep = (index, key, value) => setBrewForm((f) => {
    const pours = normalizePourSteps(f.pours, f.numPours);
    pours[index] = { ...pours[index], [key]: value };
    return { ...f, pours };
  });

  const sheetBeans = tab === TAB_KEYS.GREEN_BEANS ? greenBeans : beans;
  const sheetListMode = tab === TAB_KEYS.GREEN_BEANS ? greenBeanListMode : beanListMode;
  const sheetSetListMode = tab === TAB_KEYS.GREEN_BEANS ? setGreenBeanListMode : setBeanListMode;

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
  const visibleRoastProfiles = [...roastProfiles].filter((profile) => roastProfileListMode === "archived"
    ? Boolean(profile.archived)
    : !Boolean(profile.archived));

  const bestBrew = (bean) => bean.brews.length ? bean.brews.reduce((a, b) => b.rating > a.rating ? b : a, bean.brews[0]) : null;

  const liveBean = activeBean ? sheetBeans.find(b => b.id === activeBean.id) || activeBean : null;

  const onLogRoast = () => {
    setGreenBeanRoastForm({ ...defaultGreenBeanRoast, date: new Date().toISOString().split("T")[0] });
    setEditingGreenBeanRoastId(null);
    setView(VIEW_KEYS.GREEN_BEAN_ROAST_FORM);
  };

  const mapRoastToGreenBeanRoastForm = (roast) => ({
    id: roast.id || null,
    date: roast.date || new Date().toISOString().split("T")[0],
    profile: roast.profile || "",
    roastLevel: roast.roastLevel || "Medium",
    restingFromDays: roast.restingFromDays || "",
    restingToDays: roast.restingToDays || "",
    firstCrack: roast.firstCrack || "",
    totalRoast: roast.totalRoast || "",
    startWeight: roast.startWeight || "",
    endWeight: roast.endWeight || "",
    reductionPercent: roast.reductionPercent || "",
    notes: roast.notes || "",
  });

  const saveRoastProfile = async () => {
    const cleanName = roastProfileForm.name.trim();
    if (!cleanName) return;
    setSaveError("");
    const token = await getAccessTokenOrFail();
    if (!token) return;

    const nextPreset = {
      id: roastProfileForm.id || null,
      name: cleanName,
      profile: cleanName,
      machine: (roastProfileForm.machine || "").trim(),
      description: (roastProfileForm.description || "").trim(),
      lastUsed: roastProfileForm.lastUsed || "",
      rating: Number(roastProfileForm.rating) || 0,
      archived: Boolean(roastProfileForm.archived),
    };

    const saved = await saveRoastProfileData(token, nextPreset);
    if (!saved) {
      setSaveError("Failed to save roast profile. Check your connection and try again.");
      return;
    }

    setRoastProfileForm({ id: null, name: "", machine: "", description: "", lastUsed: "", rating: 0, archived: false });
    setView(VIEW_KEYS.BEANS);
  };

  const deleteRoastProfile = async (id) => {
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const deleted = await deleteRoastProfileData(token, id);
    if (!deleted) {
      setSaveError("Failed to delete roast profile. Check your connection and try again.");
      return;
    }
    if (roastProfileForm.id === id) {
      setRoastProfileForm({ id: null, name: "", machine: "", description: "", lastUsed: "", rating: 0, archived: false });
    }
  };

  const toggleArchiveRoastProfile = async (profile) => {
    if (!profile?.id) return;
    setSaveError("");
    const token = await getAccessTokenOrFail();
    if (!token) return;
    const nextArchived = !Boolean(profile.archived);
    const saved = await saveRoastProfileData(token, { ...profile, archived: nextArchived });
    if (!saved) {
      setSaveError("Failed to update roast profile status. Check your connection and try again.");
      return;
    }

    if (roastProfileForm.id === profile.id) {
      setRoastProfileForm((current) => ({ ...current, archived: nextArchived }));
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
    setView(VIEW_KEYS.GREEN_BEAN_ROAST_FORM);
  };

  const startNewRoastProfile = () => {
    setRoastProfileForm({ id: null, name: "", machine: "", description: "", lastUsed: "", rating: 0, archived: false });
    setView(VIEW_KEYS.ROAST_PROFILE_FORM);
  };

  const editRoastProfile = (profile) => {
    setRoastProfileForm({
      id: profile.id,
      name: profile.name || "",
      machine: profile.machine || "",
      description: profile.description || "",
      lastUsed: profile.lastUsed || "",
      rating: Number(profile.rating) || 0,
      archived: Boolean(profile.archived),
    });
    setView(VIEW_KEYS.ROAST_PROFILE_FORM);
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
      canLogBrew={view === VIEW_KEYS.BEAN_DETAIL && !!liveBean && tab !== TAB_KEYS.GREEN_BEANS}
      canLogRoast={view === VIEW_KEYS.BEAN_DETAIL && !!liveBean && tab === TAB_KEYS.GREEN_BEANS}
      onLogBrew={() => { setBrewForm({ ...defaultBrew, date: new Date().toISOString().split("T")[0] }); setView(VIEW_KEYS.BREW_FORM); }}
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
        {view === VIEW_KEYS.BEANS && (tab === TAB_KEYS.BEANS || tab === TAB_KEYS.GREEN_BEANS) && (
          <BeansView
            title={tab === TAB_KEYS.GREEN_BEANS ? "Green Beans" : "Roasted Beans"}
            isGreenBeanSheet={tab === TAB_KEYS.GREEN_BEANS}
            beans={sheetBeans}
            saveError={saveError}
            setSaveError={setSaveError}
            setShowTransfer={setShowTransfer}
            showTransferActions={tab !== TAB_KEYS.GREEN_BEANS}
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
        {view === VIEW_KEYS.BEANS && tab === TAB_KEYS.RECIPES && (
          <RecipesView
            recipes={visibleRecipes}
            onCreateRecipe={openNewRecipeForm}
            onEditRecipe={openEditRecipeForm}
            deleteRecipe={deleteRecipe}
            recipeListMode={recipeListMode}
            setRecipeListMode={setRecipeListMode}
            onToggleArchive={toggleArchiveRecipe}
            calcRatio={calcRatio}
            bloomRatio={bloomRatio}
            getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
          />
        )}

        {view === VIEW_KEYS.RECIPE_FORM && editRecipe && (
          <RecipeFormView
            editRecipe={editRecipe}
            setEditRecipe={setEditRecipe}
            saveRecipe={saveRecipe}
            onClose={closeRecipeForm}
            brewMethods={brewMethods}
            pourOverBrewers={pourOverBrewers}
            filterPapers={filterPapers}
            preHeatOptions={preHeatOptions}
            calcRatio={calcRatio}
            Field={Field}
            SectionHead={SectionHead}
            inp={inp}
            onFoc={onFoc}
            onBlr={onBlr}
          />
        )}

        {/* ── BREWS TAB ── */}
        {view === VIEW_KEYS.BEANS && tab === TAB_KEYS.BREWS && !selectedBrew && (
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
        {view === VIEW_KEYS.BEANS && tab === TAB_KEYS.BREWS && selectedBrew && (
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
              setView(VIEW_KEYS.BEAN_DETAIL);
            }}
          />
        )}

        {/* ── BEAN FORM ── */}
        {view === VIEW_KEYS.BEAN_FORM && editBean && (
          <BeanFormView
            editBean={editBean}
            setB={setB}
            saveBean={saveBean}
            setView={setView}
            isGreenBeanSheet={tab === TAB_KEYS.GREEN_BEANS}
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

        {view === VIEW_KEYS.ROAST_PROFILE_FORM && (
          <RoastProfileFormView
            setView={setView}
            setRoastProfileForm={setRoastProfileForm}
            roastProfileForm={roastProfileForm}
            saveRoastProfile={saveRoastProfile}
            Field={Field}
            SectionHead={SectionHead}
            inp={inp}
            onFoc={onFoc}
            onBlr={onBlr}
            StarRating={StarRating}
          />
        )}

        {/* ── BEAN DETAIL ── */}
        {view === VIEW_KEYS.BEANS && tab === TAB_KEYS.ROAST_PROFILES && (
          <RoastProfilesView
            startNewRoastProfile={startNewRoastProfile}
            roastProfileListMode={roastProfileListMode}
            setRoastProfileListMode={setRoastProfileListMode}
            visibleRoastProfiles={visibleRoastProfiles}
            toggleArchiveRoastProfile={toggleArchiveRoastProfile}
            editRoastProfile={editRoastProfile}
            deleteRoastProfile={deleteRoastProfile}
          />
        )}

        {view === VIEW_KEYS.BEAN_DETAIL && liveBean && (
          <BeanDetailScreenView
            liveBean={liveBean}
            setEditBean={setEditBean}
            setView={setView}
            isGreenBeanSheet={tab === TAB_KEYS.GREEN_BEANS}
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
              setGreenBeanRoastForm(mapRoastToGreenBeanRoastForm(roast));
              setEditingGreenBeanRoastId(roast.id || null);
              setView(VIEW_KEYS.GREEN_BEAN_ROAST_FORM);
            }}
            onDeleteRoast={deleteGreenBeanRoast}
          />
        )}

        {view === VIEW_KEYS.GREEN_BEAN_ROAST_FORM && liveBean && (
          <GreenBeanRoastFormView
            liveBean={liveBean}
            setView={setView}
            setEditingGreenBeanRoastId={setEditingGreenBeanRoastId}
            setGreenBeanRoastForm={setGreenBeanRoastForm}
            defaultGreenBeanRoast={defaultGreenBeanRoast}
            editingGreenBeanRoastId={editingGreenBeanRoastId}
            greenBeanRoastForm={greenBeanRoastForm}
            roastProfiles={roastProfiles}
            setTab={setTab}
            Field={Field}
            inp={inp}
            onFoc={onFoc}
            onBlr={onBlr}
            saveGreenBeanRoast={saveGreenBeanRoast}
          />
        )}

        {/* ── BREW FORM ── */}
        {view === VIEW_KEYS.BREW_FORM && liveBean && (
          <div>
            <button onClick={() => { setView(VIEW_KEYS.BEAN_DETAIL); setEditingBrewId(null); }} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← {liveBean.name}</button>
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
      <TransferModalView
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
            setView(VIEW_KEYS.BREW_FORM);
          }}
        />
      )}
    </AppShell>
  );
}
