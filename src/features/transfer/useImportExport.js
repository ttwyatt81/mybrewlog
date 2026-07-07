import { useCallback, useState } from "react";

export function useImportExport({
  sessionToken,
  beans,
  recipes,
  setBeans,
  loadData,
  setGlobalLoading,
  setSaveError,
  insertRow,
  buildBeanPayload,
  buildBrewPayload,
  buildRecipePayload,
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
        brews: (bean.brews || []).map((brew) => ({ ...brew, pours: brew.pours || [] })),
      }));

      const allBrews = beans.flatMap((bean) =>
        (bean.brews || []).map((brew) => ({ ...brew, bean_id: bean.id, pours: brew.pours || [] }))
      );

      const payload = {
        beans: exportedBeans,
        brews: allBrews,
        recipes: recipes.map((recipe) => ({ ...recipe })),
        exportedAt: new Date().toISOString(),
      };

      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    } finally {
      setExporting(false);
    }
  }, [beans, recipes]);

  const importData = useCallback(async (rawImportText) => {
    if (!sessionToken) return false;

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

      const beanIdMap = {};
      const brewPoursMap = {};

      for (const rawBean of payload.beans) {
        const beanPayloadToInsert = buildBeanPayload(rawBean);
        const record = await insertRow("beans", sessionToken, beanPayloadToInsert);
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
          const insertedBrew = await insertRow("brews", sessionToken, brewPayloadToInsert);
          if (insertedBrew && rawBrew.pours) {
            brewPoursMap[insertedBrew.id] = rawBrew.pours;
          }
        }
      }

      for (const rawRecipe of payload.recipes) {
        const recipePayloadToInsert = buildRecipePayload(rawRecipe);
        await insertRow("recipes", sessionToken, recipePayloadToInsert);
      }

      await loadData(sessionToken);
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
    setGlobalLoading,
    clearFeedback,
    setSaveError,
    buildBeanPayload,
    insertRow,
    buildBrewPayload,
    buildRecipePayload,
    loadData,
    setBeans,
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
