import { parsePourStepsFromStructure } from "../brews/model";
export function normalizeRecipeRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    method: row.method || "Pour Over",
    brewer: row.brewer || "",
    filterPaper: row.filter_paper || "",
    dose: row.dose ?? "",
    water: row.water ?? "",
    temperature: row.temperature ?? "",
    grindSize: row.grind_size || "",
    bloomWater: row.bloom_water ?? "",
    bloomTime: row.bloom_time ?? "",
    numPours: row.num_pours ?? "",
    totalTime: row.total_time || "",
    pours: row.pours && row.pours.length ? row.pours : parsePourStepsFromStructure(row.pour_structure, row.num_pours),
    pourStructure: row.pour_structure || ""
  };
}

export function recipePayload(recipe) {
  return {
    name: recipe.name,
    method: recipe.method,
    brewer: recipe.brewer || null,
    filter_paper: recipe.filterPaper || null,
    dose: recipe.dose ? Number(recipe.dose) : null,
    water: recipe.water ? Number(recipe.water) : null,
    temperature: recipe.temperature ? Number(recipe.temperature) : null,
    grind_size: recipe.grindSize || null,
    bloom_water: recipe.bloomWater ? Number(recipe.bloomWater) : null,
    bloom_time: recipe.bloomTime ? Number(recipe.bloomTime) : null,
    num_pours: recipe.numPours ? Number(recipe.numPours) : null,
    total_time: recipe.totalTime || null,
    pours: Array.isArray(recipe.pours) ? recipe.pours : []
  };
}
