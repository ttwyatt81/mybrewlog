import { useCallback, useState } from "react";

export function useImportExport({
  sessionToken,
  getAccessToken,
  beans,
  recipes,
  roastProfiles,
  setBeans,
  setRoastProfiles,
  loadData,
  setGlobalLoading,
  setSaveError,
  insertRow,
  buildBeanPayload,
  buildBrewPayload,
  buildRecipePayload,
  buildRoastProfilePayload,
}) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);

  const clearFeedback = useCallback(() => {
    setError("");
    setImportSuccess(false);
  }, []);

  const exportData = useCallback(() => {
    setExporting(true);
    try {
      const exportedBeans = beans.map((bean) => ({
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
        archived: Boolean(bean.archived),
        brews: (bean.brews || []).map((brew) => ({ ...brew, pours: brew.pours || [] })),
      }));

      const allBrews = beans.flatMap((bean) =>
        (bean.brews || []).map((brew) => ({ ...brew, bean_id: bean.id, pours: brew.pours || [] }))
      );

      const payload = {
        beans: exportedBeans,
        brews: allBrews,
        recipes: recipes.map((recipe) => ({ ...recipe })),
        roastProfiles: roastProfiles.map((profile) => ({ ...profile })),
        exportedAt: new Date().toISOString(),
      };

      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    } finally {
      setExporting(false);
    }
  }, [beans, recipes, roastProfiles]);

  const importData = useCallback(async (rawImportText) => {
    const tokenResult = getAccessToken ? await getAccessToken() : { token: sessionToken };
    const token = tokenResult?.token || null;
    if (!token) return false;

    try {
      setImporting(true);
      setGlobalLoading(true);
      clearFeedback();
      setSaveError("");

      const decoded = decodeURIComponent(escape(atob((rawImportText || "").trim())));
      const payload = JSON.parse(decoded);

      if (!payload.beans || !Array.isArray(payload.beans)) {
        throw new Error("Invalid export file: missing beans array");
      }
      if (!Array.isArray(payload.brews) && !payload.beans.some((bean) => Array.isArray(bean.brews))) {
        throw new Error("Invalid export file: missing brews data");
      }
      if (!Array.isArray(payload.recipes)) {
        throw new Error("Invalid export file: missing recipes array");
      }
      if (payload.roastProfiles !== undefined && !Array.isArray(payload.roastProfiles)) {
        throw new Error("Invalid export file: roastProfiles must be an array when present");
      }

      const beanIdMap = {};
      const brewPoursMap = {};

      for (const rawBean of payload.beans) {
        const beanPayloadToInsert = buildBeanPayload(rawBean);
        const record = await insertRow("beans", token, beanPayloadToInsert);
        if (record) {
          beanIdMap[rawBean.id] = record.id;
        }
      }

      const brewsToImport = Array.isArray(payload.brews)
        ? payload.brews
        : payload.beans.flatMap((bean) => (bean.brews || []).map((brew) => ({ ...brew, bean_id: bean.id })));

      for (const rawBrew of brewsToImport) {
        if (rawBrew.bean_id && beanIdMap[rawBrew.bean_id]) {
          const brewPayloadToInsert = buildBrewPayload(rawBrew);
          brewPayloadToInsert.bean_id = beanIdMap[rawBrew.bean_id];
          const insertedBrew = await insertRow("brews", token, brewPayloadToInsert);
          if (insertedBrew && rawBrew.pours) {
            brewPoursMap[insertedBrew.id] = rawBrew.pours;
          }
        }
      }

      for (const rawRecipe of payload.recipes) {
        const recipePayloadToInsert = buildRecipePayload(rawRecipe);
        await insertRow("recipes", token, recipePayloadToInsert);
      }

      for (const rawRoastProfile of payload.roastProfiles || []) {
        const roastProfilePayloadToInsert = buildRoastProfilePayload(rawRoastProfile);
        await insertRow("roast_profiles", token, roastProfilePayloadToInsert);
      }

      await loadData(token);
      if (Object.keys(brewPoursMap).length > 0) {
        setBeans((currentBeans) =>
          currentBeans.map((bean) => ({
            ...bean,
            brews: (bean.brews || []).map((brew) => (brewPoursMap[brew.id] ? { ...brew, pours: brewPoursMap[brew.id] } : brew)),
          }))
        );
      }

      setImportSuccess(true);
      return true;
    } catch (importError) {
      console.error("Import error:", importError);
      const message = importError?.message || "Invalid code. Please try again.";
      setError(message);
      setSaveError(`Import failed: ${message}`);
      return false;
    } finally {
      setGlobalLoading(false);
      setImporting(false);
    }
  }, [
    sessionToken,
    getAccessToken,
    setGlobalLoading,
    clearFeedback,
    setSaveError,
    buildBeanPayload,
    insertRow,
    buildBrewPayload,
    buildRecipePayload,
    buildRoastProfilePayload,
    loadData,
    setBeans,
    setRoastProfiles,
  ]);

  return {
    exportData,
    importData,
    importing,
    exporting,
    error,
    importSuccess,
    clearFeedback,
  };
}
