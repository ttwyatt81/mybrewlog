function getValue(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return "";
}

function toTimestamp(value) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function getBrewSortTimestamp(brew = {}) {
  return toTimestamp(brew?.createdAt || brew?.created_at || brew?.date);
}

export function compareBrewsNewestFirst(a, b) {
  const dateDelta = toTimestamp(b?.date) - toTimestamp(a?.date);
  if (dateDelta !== 0) return dateDelta;
  return toTimestamp(b?.created_at || b?.createdAt) - toTimestamp(a?.created_at || a?.createdAt);
}

export function sortBrewsNewestFirst(brews = []) {
  return [...brews].sort(compareBrewsNewestFirst);
}

export function splitPourStructure(pourStructure = "") {
  return String(pourStructure || "")
    .split("→")
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

export function normalizePourSteps(pourSteps = [], numPours = "") {
  const count = Math.max(0, Math.min(10, Number(numPours)) - 1);
  const steps = Array.isArray(pourSteps)
    ? pourSteps.map((step) => ({
        water: step?.water || "",
        startTime: step?.startTime || "",
        duration: step?.duration || step?.time || "",
      }))
    : [];
  while (steps.length < count) steps.push({ water: "", startTime: "", duration: "" });
  return steps.slice(0, count);
}

export function buildPourStructureFromForm(form) {
  const steps = normalizePourSteps(form.pours, form.numPours);
  if (!steps.length) return form.pourStructure || "";

  const bloom = form.bloomWater || form.bloomTime
    ? `Bloom${form.bloomWater ? ` ${form.bloomWater}g` : ""}${form.bloomTime ? ` at ${parseTimeValue(form.bloomTime)}s` : ""}`
    : "Bloom";

  const stepLines = steps.map((step) => {
    const waterPart = step.water ? `Pour to ${step.water}g` : "Pour";
    const duration = step.duration || step.time || "";
    const timePart = duration ? ` at ${parseTimeValue(duration)}s` : "";
    return `${waterPart}${timePart}`.trim();
  });

  return [bloom, ...stepLines].join(" → ");
}

export function parseTimeValue(value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  if (/^\d+:\d{1,2}$/.test(text)) {
    const [minutes, seconds] = text.split(":").map(Number);
    return Number.isFinite(minutes) && Number.isFinite(seconds) ? minutes * 60 + seconds : 0;
  }
  const digits = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(digits) ? digits : 0;
}

export function formatSecondsToTime(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function getComputedBrewWater(form) {
  const pours = normalizePourSteps(form.pours, form.numPours);
  const lastFilled = [...pours].reverse().find((step) => step.water && !isNaN(step.water));
  if (lastFilled) return Number(lastFilled.water);
  return Number(form.bloomWater) || 0;
}

export function getComputedTotalTime(form) {
  const bloom = parseTimeValue(form.bloomTime);
  const pours = normalizePourSteps(form.pours, form.numPours);
  const pourTime = pours.reduce((sum, step) => sum + parseTimeValue(step.duration || step.time || ""), 0);
  return formatSecondsToTime(bloom + pourTime);
}

export function parsePourStepsFromStructure(pourStructure = "", numPours = "") {
  const lines = splitPourStructure(pourStructure).slice(1);
  const count = Math.max(0, Math.min(10, Number(numPours)) - 1);
  const pours = lines.slice(0, count).map((line) => {
    const waterMatch = line.match(/(\d+)\s*g/);
    const timeMatch = line.match(/at\s+([0-9:]+)|([0-9]+)\s*s/);
    let time = "";
    if (timeMatch) time = timeMatch[1] || timeMatch[2] || "";
    if (time.endsWith("s")) time = time.slice(0, -1);
    return {
      water: waterMatch ? waterMatch[1] : "",
      time,
    };
  });
  while (pours.length < count) pours.push({ water: "", time: "" });
  return pours;
}

export function normalizeBrewRow(row = {}) {
  const rawPours = Array.isArray(row.pours) ? row.pours : [];
  const pourStructure = getValue(row, "pourStructure", "pour_structure");
  const numPours = getValue(row, "numPours", "num_pours");
  const method = getValue(row, "method") || "";
  const water = getValue(row, "water") ?? "";
  const shotYield = getValue(row, "shotYield", "shot_yield");

  return {
    id: row.id,
    bean_id: getValue(row, "bean_id", "beanId"),
    date: getValue(row, "date") || "",
    createdAt: getValue(row, "createdAt", "created_at") || "",
    method,
    brewer: getValue(row, "brewer") || "",
    filterPaper: getValue(row, "filterPaper", "filter_paper") || "",
    dose: getValue(row, "dose") ?? "",
    water,
    temperature: getValue(row, "temperature") ?? "",
    grindSize: getValue(row, "grindSize", "grind_size") || "",
    bloomWater: getValue(row, "bloomWater", "bloom_water") ?? "",
    bloomTime: getValue(row, "bloomTime", "bloom_time") ?? "",
    numPours: numPours ?? "",
    totalTime: getValue(row, "totalTime", "total_time") || "",
    pours: rawPours.length ? rawPours : parsePourStepsFromStructure(pourStructure, numPours),
    pourStructure,
    rating: getValue(row, "rating") ?? 0,
    tastingNotes: getValue(row, "tastingNotes", "tasting_notes") || "",
    recipeSource: getValue(row, "recipeSource", "recipe_source") || "Manual",
    recipeName: getValue(row, "recipeName", "recipe_name") || "",
    machine: getValue(row, "machine") || "",
    grinder: getValue(row, "grinder") || "",
    preHeat: getValue(row, "preHeat", "pre_heat") || "",
    preInfusionTime: getValue(row, "preInfusionTime", "pre_infusion_time") ?? "",
    preInfusionBar: getValue(row, "preInfusionBar", "pre_infusion_bar") ?? "",
    maxPressureBar: getValue(row, "maxPressureBar", "max_pressure_bar") ?? "",
    maxPressureUntilG: getValue(row, "maxPressureUntilG", "max_pressure_until_g") ?? "",
    finishPressureBar: getValue(row, "finishPressureBar", "finish_pressure_bar") ?? "",
    shotYield: shotYield ?? (method === "Espresso" ? water : ""),
    brewTime: getValue(row, "brewTime", "brew_time") ?? ""
  };
}

export function brewPayload(brew) {
  const espressoYield = brew.method === "Espresso" ? (brew.shotYield || brew.water) : brew.water;

  return {
    bean_id: brew.bean_id,
    date: brew.date || null,
    method: brew.method,
    brewer: brew.brewer || null,
    filter_paper: brew.filterPaper || null,
    dose: brew.dose ? Number(brew.dose) : null,
    water: espressoYield ? Number(espressoYield) : null,
    temperature: brew.temperature ? Number(brew.temperature) : null,
    grind_size: brew.grindSize || null,
    bloom_water: brew.bloomWater ? Number(brew.bloomWater) : null,
    bloom_time: brew.bloomTime ? Number(brew.bloomTime) : null,
    num_pours: brew.numPours ? Number(brew.numPours) : null,
    total_time: brew.totalTime || null,
    pours: Array.isArray(brew.pours) ? brew.pours : [],
    rating: brew.rating ?? null,
    tasting_notes: brew.tastingNotes || null,
    recipe_source: brew.recipeSource || "Manual",
    recipe_name: brew.recipeName || null,
    machine: brew.machine || null,
    grinder: brew.grinder || null,
    pre_heat: brew.preHeat || null,
    pre_infusion_time: brew.preInfusionTime ? Number(brew.preInfusionTime) : null,
    pre_infusion_bar: brew.preInfusionBar ? Number(brew.preInfusionBar) : null,
    max_pressure_bar: brew.maxPressureBar ? Number(brew.maxPressureBar) : null,
    max_pressure_until_g: brew.maxPressureUntilG ? Number(brew.maxPressureUntilG) : null,
    finish_pressure_bar: brew.finishPressureBar ? Number(brew.finishPressureBar) : null,
    shot_yield: brew.shotYield ? Number(brew.shotYield) : (brew.method === "Espresso" && brew.water ? Number(brew.water) : null),
    brew_time: brew.brewTime ? Number(brew.brewTime) : null
  };
}

export function getTechniqueLinesFromBrew(brew) {
  const lines = [];
  const pourCount = brew?.numPours ? `${brew.numPours} pours` : null;
  const pourWater = brew?.numPours ? `${getComputedBrewWater(brew)}g` : null;
  const totalTime = brew?.totalTime || "";

  if (pourCount) {
    lines.push({ text: `${pourCount}${pourWater ? ` · ${pourWater}` : ""}${totalTime ? ` · ${totalTime}` : ""}` });
  }

  if (brew?.bloomWater || brew?.bloomTime) {
    const bloomText = `Bloom${brew.bloomWater ? ` ${brew.bloomWater}g` : ""}`;
    const bloomTimeText = brew.bloomTime ? `${brew.bloomTime}s` : "";
    lines.push({ text: `${bloomText}${bloomTimeText ? ` · ${bloomTimeText}` : ""}` });
  }

  const steps = normalizePourSteps(brew?.pours, brew?.numPours);
  let currentStart = parseTimeValue(brew?.bloomTime);
  steps.forEach((step, index) => {
    const stepStart = parseTimeValue(step.startTime) || currentStart;
    const pourTime = parseTimeValue(step.duration || step.time || "");
    const pourEnd = stepStart + pourTime;
    const nextStepStart = index < steps.length - 1 ? parseTimeValue(steps[index + 1]?.startTime) : parseTimeValue(totalTime);
    const boundaryEnd = nextStepStart || pourEnd;
    if (step.water || step.startTime || step.duration || step.time) {
      lines.push({
        text: `Pour ${index + 2} · ${step.water ? `${step.water}g` : "?g"} · ${formatSecondsToTime(stepStart)}-${formatSecondsToTime(pourEnd)} -> ${formatSecondsToTime(boundaryEnd)}`
      });
    }
    currentStart = nextStepStart || pourEnd;
  });

  return lines;
}

export function getBeanSummaryTechniqueLine(brew) {
  const bloomTime = parseTimeValue(brew?.bloomTime);
  const bloomLabel = brew?.bloomWater ? `Bloom ${brew.bloomWater}g` : "Bloom";
  const parts = [];

  if (brew?.bloomWater || brew?.bloomTime) {
    parts.push(bloomLabel);
    if (bloomTime) parts.push(formatSecondsToTime(bloomTime));
  }

  let steps = normalizePourSteps(brew?.pours, brew?.numPours);
  if (!steps.length && brew?.pourStructure) {
    steps = parsePourStepsFromStructure(brew.pourStructure, brew.numPours);
  }

  let currentStart = bloomTime;
  steps.forEach((step, index) => {
    if (!step.water && !step.duration && !step.time) return;
    parts.push(`Pour ${index + 2}${step.water ? ` ${step.water}g` : ""}`);
    currentStart += parseTimeValue(step.duration || step.time || "");
    parts.push(formatSecondsToTime(currentStart));
  });

  return parts.join(" -> ");
}
