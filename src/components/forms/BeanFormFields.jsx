const formatRoastDateForInput = (value) => {
  if (!value) return "";
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}-${month}-${year}`;
  }

  const inputMatch = String(value).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (inputMatch) {
    const [, day, month, year] = inputMatch;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  }

  return String(value);
};

const normalizeRoastDateValue = (value) => {
  if (!value) return "";

  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return value;

  const inputMatch = String(value).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (!inputMatch) return "";

  const [, day, month, year] = inputMatch;
  const parsed = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

export default function BeanFormFields({
  editBean,
  setB,
  saveBean,
  setView,
  isGreenBeanSheet = false,
  SectionHead,
  Field,
  inp,
  onFoc,
  onBlr,
  roastLevels,
  processOptions,
  beanTypes,
}) {
  const isLinkedRoastBean = Boolean(editBean?.sourceRoastId);

  return (
    <div>
      <button onClick={() => setView("beans")} style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← Back</button>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>{editBean.id ? "Edit Bean" : "New Bean"}</div>
      <div style={{ fontSize: "13px", color: "#6a5040", marginBottom: "24px" }}>Fill in what you know — more detail gives better AI suggestions</div>

      <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
        <section>
          <SectionHead>Identity</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
            <Field label="Bean / Lot Name">
              <input
                style={inp({ background: isLinkedRoastBean ? "rgba(255,255,255,0.02)" : undefined, color: isLinkedRoastBean ? "#cbb18f" : undefined, cursor: isLinkedRoastBean ? "not-allowed" : "text" })}
                value={editBean.name}
                onChange={e => setB("name", e.target.value)}
                placeholder="e.g. Sidra Las Flores"
                onFocus={onFoc}
                onBlur={onBlr}
                readOnly={isLinkedRoastBean}
              />
            </Field>
            {!isGreenBeanSheet && (
              <Field label="Roaster">
                <input style={inp()} value={editBean.roaster} onChange={e => setB("roaster", e.target.value)} placeholder="e.g. Nomad" onFocus={onFoc} onBlur={onBlr} />
              </Field>
            )}
            <Field label="Country / Origin">
              <input style={inp()} value={editBean.origin} onChange={e => setB("origin", e.target.value)} placeholder="e.g. Colombia" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Region">
              <input style={inp()} value={editBean.region} onChange={e => setB("region", e.target.value)} placeholder="e.g. Huila, Nariño" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Producer">
              <input style={inp()} value={editBean.producer || ""} onChange={e => setB("producer", e.target.value)} placeholder="e.g. Jose Ramirez" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            {isGreenBeanSheet && (
              <Field label="Importer">
                <input
                  style={inp()}
                  value={editBean.importer || ""}
                  onChange={e => setB("importer", e.target.value)}
                  placeholder="e.g. Belco"
                  onFocus={onFoc}
                  onBlur={onBlr}
                />
              </Field>
            )}
            {isGreenBeanSheet && (
              <Field label="Cupping score">
                <input
                  style={inp()}
                  type="number"
                  min="0"
                  max="100"
                  step="0.25"
                  value={editBean.cuppingScore || ""}
                  onChange={e => setB("cuppingScore", e.target.value)}
                  placeholder="e.g. 87.5"
                  onFocus={onFoc}
                  onBlur={onBlr}
                />
              </Field>
            )}
            {!isGreenBeanSheet && (
              <Field label="Roast Date">
                <input
                  style={inp({ background: isLinkedRoastBean ? "rgba(255,255,255,0.02)" : undefined, color: isLinkedRoastBean ? "#cbb18f" : undefined, cursor: isLinkedRoastBean ? "not-allowed" : "text" })}
                  type="text"
                  inputMode="numeric"
                  value={formatRoastDateForInput(editBean.roastDate)}
                  onChange={(e) => setB("roastDate", e.target.value)}
                  placeholder="DD-MM-YYYY"
                  onFocus={onFoc}
                  onBlur={(e) => {
                    if (!isLinkedRoastBean) {
                      setB("roastDate", normalizeRoastDateValue(e.target.value));
                    }
                    onBlr(e);
                  }}
                  readOnly={isLinkedRoastBean}
                />
              </Field>
            )}
          </div>
        </section>

        <section>
          <SectionHead>Profile</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
            {!isGreenBeanSheet && (
              <Field label="Type">
                <div style={{ display: "flex", gap: "8px" }}>
                  {beanTypes.map(t => (
                    <button key={t} onClick={() => setB("type", editBean.type === t ? "" : t)}
                      style={{ flex: 1, padding: "9px", borderRadius: "7px", border: `1px solid ${editBean.type === t ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: editBean.type === t ? "rgba(200,137,58,0.18)" : "transparent", color: editBean.type === t ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "13px", transition: "all 0.15s" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            {!isGreenBeanSheet && (
              <Field label="Roast Level">
                <select
                  style={inp({ cursor: isLinkedRoastBean ? "not-allowed" : "pointer", background: isLinkedRoastBean ? "rgba(255,255,255,0.02)" : undefined, color: isLinkedRoastBean ? "#cbb18f" : undefined })}
                  value={editBean.roastLevel}
                  onChange={e => setB("roastLevel", e.target.value)}
                  onFocus={onFoc}
                  onBlur={onBlr}
                  disabled={isLinkedRoastBean}
                >
                  <option value="">Select…</option>
                  {roastLevels.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            )}
            <Field label="Process">
              <select style={inp({ cursor: "pointer" })} value={editBean.process} onChange={e => setB("process", e.target.value)} onFocus={onFoc} onBlur={onBlr}>
                <option value="">Select…</option>
                {processOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Varietal">
              <input style={inp()} value={editBean.varietal} onChange={e => setB("varietal", e.target.value)} placeholder="e.g. Gesha, Bourbon, Sidra" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Altitude" hint="e.g. 1800m">
              <input style={inp()} value={editBean.altitude} onChange={e => setB("altitude", e.target.value)} placeholder="e.g. 1800m" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            {isGreenBeanSheet && (
              <Field label="Bean density">
                <input
                  style={inp()}
                  value={editBean.beanDensity || ""}
                  onChange={e => setB("beanDensity", e.target.value)}
                  placeholder="e.g. 700 g/L"
                  onFocus={onFoc}
                  onBlur={onBlr}
                />
              </Field>
            )}
            {isGreenBeanSheet && (
              <Field label="Price">
                <input
                  style={inp()}
                  type="number"
                  min="0"
                  step="0.01"
                  value={editBean.price || ""}
                  onChange={e => setB("price", e.target.value)}
                  placeholder="e.g. 28.50"
                  onFocus={onFoc}
                  onBlur={onBlr}
                />
              </Field>
            )}
            {isGreenBeanSheet && (
              <Field label="Weight (kg)">
                <input
                  style={inp()}
                  type="number"
                  min="0"
                  step="0.001"
                  value={editBean.weightKg || ""}
                  onChange={e => setB("weightKg", e.target.value)}
                  placeholder="e.g. 0.25"
                  onFocus={onFoc}
                  onBlur={onBlr}
                />
              </Field>
            )}
          </div>
          <div style={{ marginTop: "11px" }}>
            <Field label="Tasting Notes" hint={isLinkedRoastBean ? "Adjust after export if needed" : "Helps the AI tailor the recipe"}>
              <textarea
                style={inp({ resize: "vertical", minHeight: "65px", lineHeight: 1.6 })}
                value={editBean.notes}
                onChange={e => setB("notes", e.target.value)}
                placeholder="e.g. Jasmine, tropical fruit, creamy body…"
                onFocus={onFoc}
                onBlur={onBlr}
              />
            </Field>
          </div>
        </section>

        <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
          <button onClick={saveBean} disabled={!editBean.name}
            style={{ flex: 1, background: editBean.name ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.15)", border: "none", borderRadius: "9px", color: editBean.name ? "#fff" : "#4a3020", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: editBean.name ? "pointer" : "not-allowed" }}>
            Save Bean
          </button>
          <button onClick={() => setView("beans")}
            style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#6a5040", cursor: "pointer", fontSize: "14px" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
