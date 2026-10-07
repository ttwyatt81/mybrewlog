import { useCallback, useState } from "react";
import { commitIfCurrent } from "../auth/expiredAccessTokenHandler.js";
import { loadRecipes, saveRecipe, deleteRecipe } from "./api";
import { normalizeRecipeRow } from "./model";

export function useRecipes(initialRecipes = []) {
  const [recipes, setRecipes] = useState(initialRecipes);

  const load = useCallback(async (token, canCommit = () => true) => {
    const recipeRows = await loadRecipes(token);
    const normalizedRecipes = (recipeRows || []).map((row) => normalizeRecipeRow(row));
    commitIfCurrent(canCommit, () => setRecipes(normalizedRecipes));
    return recipeRows;
  }, []);

  const save = useCallback(async (token, recipe) => {
    const saved = await saveRecipe(token, recipe);
    if (!saved) return null;

    const normalized = normalizeRecipeRow(saved);
    setRecipes((current) => {
      const exists = current.some((existing) => existing.id === normalized.id);
      return exists
        ? current.map((existing) => (existing.id === normalized.id ? normalized : existing))
        : [normalized, ...current];
    });

    return normalized;
  }, []);

  const remove = useCallback(async (token, id) => {
    const deleted = await deleteRecipe(token, id);
    if (deleted) {
      setRecipes((current) => current.filter((recipe) => recipe.id !== id));
    }
    return deleted;
  }, []);

  return { recipes, setRecipes, load, save, remove };
}
