import { normalizeBrewRow, sortBrewsNewestFirst } from "../brews/model";

function getValue(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return "";
}

export function normalizeBeanRow(row = {}) {
  const archivedValue = getValue(row, "archived", "is_archived");

  return {
    id: row.id,
    createdAt: getValue(row, "createdAt", "created_at") || "",
    name: getValue(row, "name") || "",
    roaster: getValue(row, "roaster") || "",
    origin: getValue(row, "origin") || "",
    producer: getValue(row, "producer") || "",
    region: getValue(row, "region") || "",
    roastLevel: getValue(row, "roastLevel", "roast_level") || "",
    process: getValue(row, "process") || "",
    varietal: getValue(row, "varietal") || "",
    altitude: getValue(row, "altitude") || "",
    type: getValue(row, "type") || "",
    roastDate: getValue(row, "roastDate", "roast_date") || "",
    notes: getValue(row, "notes") || "",
    archived: archivedValue === true || archivedValue === "true" || archivedValue === 1 || archivedValue === "1",
    brews: Array.isArray(row.brews) ? row.brews.map((brew) => normalizeBrewRow(brew)) : []
  };
}

export function beanPayload(bean) {
  return {
    name: bean.name,
    roaster: bean.roaster,
    origin: bean.origin,
    producer: bean.producer || null,
    region: bean.region,
    roast_level: bean.roastLevel || null,
    process: bean.process || null,
    varietal: bean.varietal || null,
    altitude: bean.altitude || null,
    type: bean.type || null,
    roast_date: bean.roastDate || null,
    notes: bean.notes || null,
    archived: Boolean(bean.archived)
  };
}

function toTimestamp(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getBrewActivityTimestamp(brew = {}) {
  return toTimestamp(brew?.createdAt || brew?.created_at || brew?.date);
}

export function getBeanSortTimestamp(bean) {
  const brews = Array.isArray(bean?.brews) ? bean.brews : [];
  const latestBrew = brews.reduce((max, brew) => {
    const ts = getBrewActivityTimestamp(brew);
    return ts > max ? ts : max;
  }, 0);

  if (latestBrew > 0) return latestBrew;
  return toTimestamp(bean?.createdAt);
}

export function isBeanArchived(bean = {}) {
  return Boolean(bean?.archived === true || bean?.archived === "true" || bean?.archived === 1 || bean?.archived === "1");
}

export function getVisibleBeans(beans = [], mode = "active") {
  const activeMode = mode !== "archived";
  return [...beans].filter((bean) => activeMode ? !isBeanArchived(bean) : isBeanArchived(bean));
}

export function sortBeansByRecentActivity(beans = []) {
  return [...beans].sort((a, b) => {
    return getBeanSortTimestamp(b) - getBeanSortTimestamp(a);
  });
}

export function combineBeansAndBrews(beanRows, brewRows, existingBeans = []) {
  const lookup = (existingBeans || []).reduce((acc, bean) => {
    const normalizedBean = normalizeBeanRow(bean);
    acc[normalizedBean.id] = normalizedBean;
    return acc;
  }, {});

  (beanRows || []).forEach((row) => {
    const bean = normalizeBeanRow(row);
    if (!bean.id) return;
    const existingBean = lookup[bean.id];
    lookup[bean.id] = existingBean
      ? { ...existingBean, ...bean, brews: existingBean.brews?.length ? existingBean.brews : bean.brews || [] }
      : bean;
  });

  (brewRows || []).forEach((row) => {
    const brew = normalizeBrewRow(row);
    if (!brew.bean_id) return;
    const bean = lookup[brew.bean_id];
    if (!bean) return;

    const existingBrews = Array.isArray(bean.brews) ? bean.brews : [];
    const existingIndex = existingBrews.findIndex((existing) => existing?.id === brew.id);

    if (existingIndex >= 0) {
      existingBrews[existingIndex] = { ...existingBrews[existingIndex], ...brew };
    } else {
      existingBrews.push(brew);
    }

    bean.brews = existingBrews;
  });

  return sortBeansByRecentActivity(Object.values(lookup).map((bean) => ({
    ...bean,
    brews: Array.isArray(bean.brews) ? sortBrewsNewestFirst(bean.brews) : []
  })));
}
