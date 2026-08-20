function getValue(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return "";
}

export function normalizeGreenBeanRoast(roast = {}) {
  const startWeight = getValue(roast, "startWeight", "start_weight");
  const endWeight = getValue(roast, "endWeight", "end_weight");
  const parsedStart = startWeight !== "" && startWeight !== null && startWeight !== undefined ? Number(startWeight) : null;
  const parsedEnd = endWeight !== "" && endWeight !== null && endWeight !== undefined ? Number(endWeight) : null;
  const reductionPercent = getValue(roast, "reductionPercent", "reduction_percent");

  const computedReduction = parsedStart && parsedEnd && parsedStart > 0
    ? (((parsedStart - parsedEnd) / parsedStart) * 100).toFixed(1)
    : null;

  return {
    id: roast.id || null,
    date: getValue(roast, "date", "roastDate", "roast_date") || "",
    profile: getValue(roast, "profile") || "",
    roastLevel: getValue(roast, "roastLevel", "roast_level") || "",
    startWeight: startWeight !== undefined && startWeight !== null ? startWeight : "",
    endWeight: endWeight !== undefined && endWeight !== null ? endWeight : "",
    reductionPercent: reductionPercent !== undefined && reductionPercent !== null && reductionPercent !== "" ? reductionPercent : (computedReduction ?? ""),
    notes: getValue(roast, "notes") || "",
    createdAt: getValue(roast, "createdAt", "created_at") || "",
  };
}

export function sortGreenBeanRoasts(roasts = []) {
  const toTimestamp = (value) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  return [...roasts].sort((a, b) => {
    const aTime = toTimestamp(a?.date || a?.createdAt);
    const bTime = toTimestamp(b?.date || b?.createdAt);
    return bTime - aTime;
  });
}

export function normalizeGreenBeanRow(row = {}) {
  const archivedValue = getValue(row, "archived", "is_archived");
  const rawRoasts = (() => {
    const value = row.roasts;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  return {
    id: row.id,
    createdAt: getValue(row, "createdAt", "created_at") || "",
    name: getValue(row, "name") || "",
    origin: getValue(row, "origin") || "",
    producer: getValue(row, "producer") || "",
    importer: getValue(row, "importer") || "",
    cuppingScore: getValue(row, "cuppingScore", "cupping_score") || "",
    region: getValue(row, "region") || "",
    process: getValue(row, "process") || "",
    varietal: getValue(row, "varietal") || "",
    altitude: getValue(row, "altitude") || "",
    beanDensity: getValue(row, "beanDensity", "bean_density") || "",
    price: getValue(row, "price") || "",
    weightKg: getValue(row, "weightKg", "weight_kg") || "",
    notes: getValue(row, "notes") || "",
    archived: archivedValue === true || archivedValue === "true" || archivedValue === 1 || archivedValue === "1",
    brews: [],
    roasts: sortGreenBeanRoasts(rawRoasts.map((roast) => normalizeGreenBeanRoast(roast)))
  };
}

export function greenBeanRoastPayload(roast = {}) {
  const startWeight = roast.startWeight !== "" && roast.startWeight !== null && roast.startWeight !== undefined ? Number(roast.startWeight) : null;
  const endWeight = roast.endWeight !== "" && roast.endWeight !== null && roast.endWeight !== undefined ? Number(roast.endWeight) : null;
  const reductionPercent = startWeight && endWeight && startWeight > 0
    ? (((startWeight - endWeight) / startWeight) * 100).toFixed(1)
    : null;

  return {
    id: roast.id || null,
    date: roast.date || null,
    profile: roast.profile || null,
    roast_level: roast.roastLevel || null,
    start_weight: startWeight,
    end_weight: endWeight,
    reduction_percent: reductionPercent,
    notes: roast.notes || null,
  };
}

export function greenBeanPayload(bean) {
  return {
    name: bean.name,
    origin: bean.origin || null,
    producer: bean.producer || null,
    importer: bean.importer || null,
    cupping_score: bean.cuppingScore || null,
    region: bean.region || null,
    process: bean.process || null,
    varietal: bean.varietal || null,
    altitude: bean.altitude || null,
    bean_density: bean.beanDensity || null,
    price: bean.price === "" ? null : bean.price,
    weight_kg: bean.weightKg === "" ? null : bean.weightKg,
    notes: bean.notes || null,
    archived: Boolean(bean.archived),
    roasts: Array.isArray(bean.roasts)
      ? bean.roasts.map((roast) => greenBeanRoastPayload(roast))
      : []
  };
}

function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getGreenBeanSortTimestamp(bean) {
  return toTimestamp(bean?.createdAt);
}

export function sortGreenBeansByRecentActivity(beans = []) {
  return [...beans].sort((a, b) => getGreenBeanSortTimestamp(b) - getGreenBeanSortTimestamp(a));
}
