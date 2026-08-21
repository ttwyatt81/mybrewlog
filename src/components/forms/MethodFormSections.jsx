import {
  getComputedBrewWater,
  getTechniqueLinesFromBrew,
  normalizePourSteps,
  parseTimeValue,
} from "../../features/brews/model";

const formatDateForInput = (value) => {
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

const normalizeDateValue = (value) => {
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

export default function MethodFormSections({
  method,
  formState,
  setField,
  setPourStep,
  calcRatio,
  Field,
  SectionHead,
  inp,
  onFoc,
  onBlr,
  pourOverBrewers,
  filterPapers,
  preHeatOptions,
  includeDateField = false,
}) {
  const pourSteps = normalizePourSteps(formState.pours, formState.numPours);
  const bloomTimeFromPour2 = pourSteps[0]?.startTime ? parseTimeValue(pourSteps[0].startTime) : "";
  const techniquePreviewLines = getTechniqueLinesFromBrew(formState).filter((line, index) => {
    if (index !== 0) return true;
    return !String(line?.text || "").includes(" pours · ");
  });
  const computedBrewWater = getComputedBrewWater(formState);

  if (method === "Pour Over") {
    return (
      <>
        <section>
          <SectionHead>Equipment</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
            <Field label="Brewer">
              <select style={inp({ cursor: "pointer" })} value={formState.brewer} onChange={(e) => setField("brewer", e.target.value)} onFocus={onFoc} onBlur={onBlr}>
                <option value="">Select…</option>
                {pourOverBrewers.map((brewer) => <option key={brewer} value={brewer}>{brewer}</option>)}
              </select>
            </Field>
            <Field label="Filter Paper">
              <select style={inp({ cursor: "pointer" })} value={formState.filterPaper} onChange={(e) => setField("filterPaper", e.target.value)} onFocus={onFoc} onBlur={onBlr}>
                <option value="">Select…</option>
                {filterPapers.map((paper) => <option key={paper} value={paper}>{paper}</option>)}
              </select>
            </Field>
          </div>
        </section>
        <section>
          <SectionHead>Recipe</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
            <Field label="Dose (g)">
              <input style={inp()} type="number" value={formState.dose} onChange={(e) => setField("dose", e.target.value)} placeholder="e.g. 15" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Water (g)">
              <input
                style={inp({
                  background: "rgba(200,137,58,0.10)",
                  border: "1px solid rgba(200,137,58,0.35)",
                  color: "#d8c3a3",
                  boxShadow: "inset 0 0 0 1px rgba(200,137,58,0.08)",
                })}
                value={computedBrewWater || ""}
                readOnly
              />
            </Field>
            <Field label="Temperature (°C)">
              <input style={inp()} type="number" value={formState.temperature} onChange={(e) => setField("temperature", e.target.value)} placeholder="e.g. 96" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Grind Size">
              <input style={inp()} value={formState.grindSize} onChange={(e) => setField("grindSize", e.target.value)} placeholder="e.g. 3.2 / medium-fine" onFocus={onFoc} onBlur={onBlr} />
            </Field>
          </div>
          {formState.dose && computedBrewWater && (
            <div style={{ marginTop: "9px", padding: "9px 13px", background: "rgba(200,137,58,0.07)", borderRadius: "7px", fontSize: "13px", color: "#c8893a" }}>
              Ratio: 1:{calcRatio(formState.dose, computedBrewWater)}
            </div>
          )}
        </section>
        <section>
          <SectionHead>Technique</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
            <Field label="Bloom Water (g)">
              <input style={inp()} type="number" value={formState.bloomWater} onChange={(e) => setField("bloomWater", e.target.value)} placeholder="e.g. 45" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Bloom Time (s)">
              <input
                style={inp({
                  background: "rgba(200,137,58,0.10)",
                  border: "1px solid rgba(200,137,58,0.35)",
                  color: "#d8c3a3",
                  boxShadow: "inset 0 0 0 1px rgba(200,137,58,0.08)",
                })}
                value={bloomTimeFromPour2}
                readOnly
              />
            </Field>
            <Field label="Number of Pours">
              <input style={inp()} type="number" value={formState.numPours} onChange={(e) => setField("numPours", e.target.value)} placeholder="e.g. 3" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Total Time (mm:ss)">
              <input style={inp()} value={formState.totalTime} onChange={(e) => setField("totalTime", e.target.value)} placeholder="e.g. 2:45" onFocus={onFoc} onBlur={onBlr} />
            </Field>
          </div>
          <div style={{ marginTop: "11px" }}>
            <Field label="Pour Steps">
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {pourSteps.map((step, index) => (
                  <div key={`pour-step-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto", gap: "8px", alignItems: "end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#d4bca0", textTransform: "uppercase" }}>{`Pour ${index + 2} water (g)`}</label>
                      <input style={inp()} type="number" value={step.water ?? ""} onChange={(e) => setPourStep(index, "water", e.target.value)} placeholder={`Pour ${index + 2} water (g)`} onFocus={onFoc} onBlur={onBlr} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#d4bca0", textTransform: "uppercase" }}>{`Pour ${index + 2} start time (MM:SS)`}</label>
                      <input
                        style={inp()}
                        type="text"
                        value={step.startTime ?? ""}
                        onChange={(e) => {
                          const nextStartTime = e.target.value;
                          setPourStep(index, "startTime", nextStartTime);
                          if (index === 0) {
                            const bloomSeconds = nextStartTime.trim() ? parseTimeValue(nextStartTime) : "";
                            setField("bloomTime", bloomSeconds === "" ? "" : String(bloomSeconds));
                          }
                        }}
                        placeholder="e.g. 0:45"
                        onFocus={onFoc}
                        onBlur={onBlr}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <label style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#d4bca0", textTransform: "uppercase" }}>{`Pour ${index + 2} duration (S)`}</label>
                      <input style={inp()} type="number" value={step.duration ?? ""} onChange={(e) => setPourStep(index, "duration", e.target.value)} placeholder="e.g. 30" onFocus={onFoc} onBlur={onBlr} />
                    </div>
                    <div style={{ fontSize: "12px", color: "#d0b69a", paddingBottom: "8px" }}>{index + 2}</div>
                  </div>
                ))}
              </div>
            </Field>
          </div>
          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#d4bca0", textTransform: "uppercase" }}>Pour technique</label>
            <div style={inp({ minHeight: "80px", lineHeight: 1.6, whiteSpace: "pre-wrap" })}>
              {techniquePreviewLines.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {techniquePreviewLines.map((line, index) => (
                    <div key={`${line.text}-${index}`} style={{ fontSize: "12px", color: "#f0e6d3", lineHeight: 1.6 }}>{line.text}</div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: "#d0b69a" }}>Enter bloom and pours to see the technique preview here.</div>
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  if (method === "Espresso") {
    return (
      <>
        <section>
          <SectionHead>Equipment</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
            <Field label="Espresso Machine">
              <input style={inp()} value={formState.machine || ""} onChange={(e) => setField("machine", e.target.value)} placeholder="e.g. Gaggia Classic" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Pre-heat Setting" hint="Group head / machine temperature">
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {preHeatOptions.map((option) => (
                  <button key={option} onClick={() => setField("preHeat", formState.preHeat === option ? "" : option)} style={{ padding: "7px 16px", borderRadius: "20px", border: `1px solid ${formState.preHeat === option ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: formState.preHeat === option ? "rgba(200,137,58,0.18)" : "transparent", color: formState.preHeat === option ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "13px", transition: "all 0.15s" }}>
                    {option}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Grinder">
              <input style={inp()} value={formState.grinder || ""} onChange={(e) => setField("grinder", e.target.value)} placeholder="e.g. Niche Zero" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Grind Setting">
              <input style={inp()} value={formState.grindSize} onChange={(e) => setField("grindSize", e.target.value)} placeholder="e.g. 20 clicks" onFocus={onFoc} onBlur={onBlr} />
            </Field>
          </div>
        </section>
        <section>
          <SectionHead>Recipe</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
            <Field label="Dose (g)"><input style={inp()} type="number" value={formState.dose} onChange={(e) => setField("dose", e.target.value)} placeholder="e.g. 18" onFocus={onFoc} onBlur={onBlr} /></Field>
            <Field label="Temperature (°C)"><input style={inp()} type="number" value={formState.temperature} onChange={(e) => setField("temperature", e.target.value)} placeholder="e.g. 93" onFocus={onFoc} onBlur={onBlr} /></Field>
          </div>
          {formState.dose && (formState.shotYield || formState.water) && (
            <div style={{ marginTop: "9px", padding: "9px 13px", background: "rgba(200,137,58,0.07)", borderRadius: "7px", fontSize: "13px", color: "#c8893a" }}>
              Brew ratio: 1:{calcRatio(formState.dose, formState.shotYield || formState.water)}
            </div>
          )}
        </section>
        <section>
          <SectionHead>Technique</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
            <Field label="Pre-Infusion (s)"><input style={inp()} type="number" value={formState.preInfusionTime || ""} onChange={(e) => setField("preInfusionTime", e.target.value)} placeholder="e.g. 12" onFocus={onFoc} onBlur={onBlr} /></Field>
            <Field label="Pre-Infusion (Bar)"><input style={inp()} type="number" value={formState.preInfusionBar || ""} onChange={(e) => setField("preInfusionBar", e.target.value)} placeholder="e.g. 2" onFocus={onFoc} onBlur={onBlr} /></Field>
            <Field label="Max Pressure (Bar)"><input style={inp()} type="number" value={formState.maxPressureBar || ""} onChange={(e) => setField("maxPressureBar", e.target.value)} placeholder="e.g. 9" onFocus={onFoc} onBlur={onBlr} /></Field>
            <Field label="Max Pressure Until (g)"><input style={inp()} type="number" value={formState.maxPressureUntilG || ""} onChange={(e) => setField("maxPressureUntilG", e.target.value)} placeholder="e.g. 20" onFocus={onFoc} onBlur={onBlr} /></Field>
            <Field label="Finish Pressure (Bar)"><input style={inp()} type="number" value={formState.finishPressureBar || ""} onChange={(e) => setField("finishPressureBar", e.target.value)} placeholder="e.g. 4.5" onFocus={onFoc} onBlur={onBlr} /></Field>
            <Field label="Shot Yield (g)"><input style={inp()} type="number" value={formState.shotYield || ""} onChange={(e) => { setField("shotYield", e.target.value); setField("water", e.target.value); }} placeholder="e.g. 36" onFocus={onFoc} onBlur={onBlr} /></Field>
            <Field label="Brew Time (seconds)"><input style={inp()} type="number" value={formState.brewTime || ""} onChange={(e) => setField("brewTime", e.target.value)} placeholder="e.g. 28" onFocus={onFoc} onBlur={onBlr} /></Field>
            {includeDateField && (
              <Field label="Date">
                <input
                  style={inp()}
                  type="text"
                  inputMode="numeric"
                  value={formatDateForInput(formState.date || "")}
                  onChange={(e) => setField("date", normalizeDateValue(e.target.value))}
                  placeholder="DD-MM-YYYY"
                  onFocus={onFoc}
                  onBlur={onBlr}
                />
              </Field>
            )}
          </div>
        </section>
      </>
    );
  }

  return null;
}