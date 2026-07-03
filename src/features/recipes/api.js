import { sbGet, sbInsert, sbUpdate, sbDelete } from "../../lib/supabase";
import { recipePayload } from "./model";

export async function loadRecipes(token) {
  return sbGet("recipes", token, "select=*&order=updated_at.desc");
}

export async function saveRecipe(token, recipe) {
  if (!token) return null;
  const payload = recipePayload(recipe);
  return recipe.id
    ? await sbUpdate("recipes", token, recipe.id, payload)
    : await sbInsert("recipes", token, payload);
}

export async function deleteRecipe(token, id) {
  if (!token) return false;
  return sbDelete("recipes", token, id);
}
