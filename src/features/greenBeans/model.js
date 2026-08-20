function getValue(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return "";
}

export function normalizeGreenBeanRow(row = {}) {
  const archivedValue = getValue(row, "archived", "is_archived");

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
    brews: []
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
    archived: Boolean(bean.archived)
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
