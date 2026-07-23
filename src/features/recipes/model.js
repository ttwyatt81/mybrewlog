import { parsePourStepsFromStructure } from "../brews/model";
export function normalizeRecipeRow(row) {
  const method = row.method || "Pour Over";
  const water = row.water ?? "";
  const shotYield = row.shot_yield ?? row.shotYield;
  return {
    id: row.id,
    name: row.name || "",
    method,
    brewer: row.brewer || "",
    filterPaper: row.filter_paper || row.filterPaper || "",
    dose: row.dose ?? "",
    water,
    temperature: row.temperature ?? "",
    grindSize: row.grind_size || row.grindSize || "",
    bloomWater: row.bloom_water ?? "",
    bloomTime: row.bloom_time ?? "",
    numPours: row.num_pours ?? "",
    totalTime: row.total_time || row.totalTime || "",
    pours: row.pours && row.pours.length ? row.pours : parsePourStepsFromStructure(row.pour_structure, row.num_pours),
    pourStructure: row.pour_structure || row.pourStructure || "",
    machine: row.machine || "",
    grinder: row.grinder || "",
    preHeat: row.pre_heat || row.preHeat || "",
    preInfusionTime: row.pre_infusion_time ?? row.preInfusionTime ?? "",
    preInfusionBar: row.pre_infusion_bar ?? row.preInfusionBar ?? "",
    maxPressureBar: row.max_pressure_bar ?? row.maxPressureBar ?? "",
    maxPressureUntilG: row.max_pressure_until_g ?? row.maxPressureUntilG ?? "",
    finishPressureBar: row.finish_pressure_bar ?? row.finishPressureBar ?? "",
    shotYield: shotYield ?? (method === "Espresso" ? water : ""),
    brewTime: row.brew_time ?? row.brewTime ?? ""
  };
}

export function recipePayload(recipe) {
  const espressoYield = recipe.method === "Espresso" ? (recipe.shotYield || recipe.water) : recipe.water;

  return {
    name: recipe.name,
    method: recipe.method,
    brewer: recipe.brewer || null,
    filter_paper: recipe.filterPaper || null,
    dose: recipe.dose ? Number(recipe.dose) : null,
    water: espressoYield ? Number(espressoYield) : null,
    temperature: recipe.temperature ? Number(recipe.temperature) : null,
    grind_size: recipe.grindSize || null,
    bloom_water: recipe.bloomWater ? Number(recipe.bloomWater) : null,
    bloom_time: recipe.bloomTime ? Number(recipe.bloomTime) : null,
    num_pours: recipe.numPours ? Number(recipe.numPours) : null,
    total_time: recipe.totalTime || null,
    pours: Array.isArray(recipe.pours) ? recipe.pours : [],
    pour_structure: recipe.pourStructure || null,
    machine: recipe.machine || null,
    grinder: recipe.grinder || null,
    pre_heat: recipe.preHeat || null,
    pre_infusion_time: recipe.preInfusionTime ? Number(recipe.preInfusionTime) : null,
    pre_infusion_bar: recipe.preInfusionBar ? Number(recipe.preInfusionBar) : null,
    max_pressure_bar: recipe.maxPressureBar ? Number(recipe.maxPressureBar) : null,
    max_pressure_until_g: recipe.maxPressureUntilG ? Number(recipe.maxPressureUntilG) : null,
    finish_pressure_bar: recipe.finishPressureBar ? Number(recipe.finishPressureBar) : null,
    shot_yield: recipe.shotYield ? Number(recipe.shotYield) : (recipe.method === "Espresso" && recipe.water ? Number(recipe.water) : null),
    brew_time: recipe.brewTime ? Number(recipe.brewTime) : null
  };
}
