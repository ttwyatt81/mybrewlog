import { normalizeBrewRow } from "../brews/model";

function getValue(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) return row[key];
  }
  return "";
}

export function normalizeBeanRow(row = {}) {
  return {
    id: row.id,
    name: getValue(row, "name") || "",
    roaster: getValue(row, "roaster") || "",
    origin: getValue(row, "origin") || "",
    region: getValue(row, "region") || "",
    roastLevel: getValue(row, "roastLevel", "roast_level") || "",
    process: getValue(row, "process") || "",
    varietal: getValue(row, "varietal") || "",
    altitude: getValue(row, "altitude") || "",
    type: getValue(row, "type") || "",
    roastDate: getValue(row, "roastDate", "roast_date") || "",
    notes: getValue(row, "notes") || "",
    brews: Array.isArray(row.brews) ? row.brews.map((brew) => normalizeBrewRow(brew)) : []
  };
}

export function beanPayload(bean) {
  return {
    name: bean.name,
    roaster: bean.roaster,
    origin: bean.origin,
    region: bean.region,
    roast_level: bean.roastLevel || null,
    process: bean.process || null,
    varietal: bean.varietal || null,
    altitude: bean.altitude || null,
    type: bean.type || null,
    roast_date: bean.roastDate || null,
    notes: bean.notes || null
  };
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

  return Object.values(lookup).map((bean) => ({
    ...bean,
    brews: Array.isArray(bean.brews)
      ? [...bean.brews].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      : []
  }));
}
