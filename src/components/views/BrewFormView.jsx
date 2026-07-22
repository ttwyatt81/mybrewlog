import Tag from "../ui/Tag";
import StarRating from "../ui/StarRating";

export default function BrewFormView({
  liveBean,
  brewForm,
  setBr,
  setPourStep,
  editingBrewId,
  recipes,
  setShowAI,
  saveBrew,
  setView,
  setEditingBrewId,
  getComputedBrewWater,
  normalizePourSteps,
  buildPourStructureFromForm,
  parseTimeValue,
  formatSecondsToTime,
  getTechniqueLinesFromBrew,
  brewMethods,
  pourOverBrewers,
  filterPapers,
  preHeatOptions,
  calcRatio,
  Field,
  SectionHead,
  inp,
  onFoc,
  onBlr,
  setBrewForm,
}) {
  const method = editingBrewId ? brewForm.method : brewForm.method_confirmed;
  const techniquePreviewLines = getTechniqueLinesFromBrew(brewForm).filter((line, index) => {
    if (index !== 0) return true;
    return !String(line?.text || "").includes(" pours · ");
  });
  const pourSteps = normalizePourSteps(brewForm.pours, brewForm.numPours);
  const bloomTimeFromPour2 = pourSteps[0]?.startTime ? parseTimeValue(pourSteps[0].startTime) : "";

  return (
    <div>
      {!editingBrewId && !brewForm.method_confirmed && (
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>Log a Brew</div>
          <div style={{ fontSize: "13px", color: "#c9b094", marginBottom: "32px" }}>Select your brewing method</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { method: "Pour Over", icon: "☕", sub: "V60, Chemex, Kalita…" },
              { method: "Espresso", icon: "🫖", sub: "Shot, lungo, ristretto…" },
            ].map(({ method: optionMethod, icon, sub }) => (
              <div key={optionMethod} onClick={() => setBrewForm((f) => ({ ...f, method_confirmed: optionMethod }))} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "14px", padding: "28px 16px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,137,58,0.08)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.6)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.25)"; }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>{icon}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", marginBottom: "6px" }}>{optionMethod}</div>
                <div style={{ fontSize: "11px", color: "#c9b094" }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(editingBrewId || brewForm.method_confirmed) && (
        <div>
          {!editingBrewId && (
            <button onClick={() => setBrewForm((f) => ({ ...f, method_confirmed: null }))} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "12px", marginBottom: "14px", padding: 0 }}>← Change method</button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px" }}>{editingBrewId ? "Edit Brew" : method}</div>
            <span style={{ fontSize: "11px", color: "#d4bca0", background: "rgba(200,137,58,0.08)", padding: "3px 10px", borderRadius: "20px" }}>{method}</span>
          </div>
          <div style={{ fontSize: "13px", color: "#c9b094", marginBottom: "16px" }}>{[liveBean.roastLevel, liveBean.process, liveBean.origin].filter(Boolean).join(" · ")}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setBrewForm((f) => ({ ...f, recipeSource: "AI Generated", recipeName: "" })); setShowAI(true); }} style={{ flex: 1, background: "rgba(200,137,58,0.07)", border: "1px solid rgba(200,137,58,0.28)", borderRadius: "9px", color: "#c8a060", cursor: "pointer", padding: "10px 8px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,137,58,0.14)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(200,137,58,0.07)")}>✦ AI Suggestion</button>
              <button onClick={() => {
                const last = liveBean.brews.find((b) => b.method === method);
                if (!last) return;
                setBrewForm((f) => ({...f, ...last, id: f.id, date: f.date, method: last.method || method, method_confirmed: method, recipeSource: "Last Brew", recipeName: "" }));
              }} disabled={!liveBean.brews.some((b) => b.method === method)} style={{ flex: 1, background: liveBean.brews.some((b) => b.method === method) ? "rgba(200,137,58,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${liveBean.brews.some((b) => b.method === method) ? "rgba(200,137,58,0.28)" : "rgba(255,255,255,0.06)"}`, borderRadius: "9px", color: liveBean.brews.some((b) => b.method === method) ? "#c8a060" : "#baa188", cursor: liveBean.brews.some((b) => b.method === method) ? "pointer" : "not-allowed", padding: "10px 8px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => { if (liveBean.brews.some((b) => b.method === method)) e.currentTarget.style.background = "rgba(200,137,58,0.14)"; }} onMouseLeave={(e) => { if (liveBean.brews.some((b) => b.method === method)) e.currentTarget.style.background = "rgba(200,137,58,0.07)"; }}>↑ Last Brew</button>
            </div>
            {recipes.filter((r) => r.method === method).length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "#c4ab90", letterSpacing: "0.08em", textTransform: "uppercase" }}>Recipes:</span>
                {recipes.filter((r) => r.method === method).map((recipe) => (
                  <button key={recipe.id} onClick={() => setBrewForm((f) => ({ ...f, ...recipe, id: f.id, date: f.date, method: recipe.method || method, method_confirmed: method, recipeSource: "Saved Recipe", recipeName: recipe.name }))} style={{ padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(200,137,58,0.28)", background: "rgba(200,137,58,0.07)", color: "#c8a060", cursor: "pointer", fontSize: "12px" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,137,58,0.16)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(200,137,58,0.07)")}>{recipe.name}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
            {method === "Pour Over" && (
              <>
                <section>
                  <SectionHead>Equipment</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Brewer">
                      <select style={inp({ cursor: "pointer" })} value={brewForm.brewer} onChange={(e) => setBr("brewer", e.target.value)} onFocus={onFoc} onBlur={onBlr}>
                        <option value="">Select…</option>
                        {pourOverBrewers.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </Field>
                    <Field label="Filter Paper">
                      <select style={inp({ cursor: "pointer" })} value={brewForm.filterPaper} onChange={(e) => setBr("filterPaper", e.target.value)} onFocus={onFoc} onBlur={onBlr}>
                        <option value="">Select…</option>
                        {filterPapers.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </Field>
                  </div>
                </section>
                <section>
                  <SectionHead>Recipe</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Dose (g)">
                      <input style={inp()} type="number" value={brewForm.dose} onChange={(e) => setBr("dose", e.target.value)} placeholder="e.g. 15" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Water (g)">
                      <input
                        style={inp({
                          background: "rgba(200,137,58,0.10)",
                          border: "1px solid rgba(200,137,58,0.35)",
                          color: "#d8c3a3",
                          boxShadow: "inset 0 0 0 1px rgba(200,137,58,0.08)",
                        })}
                        value={getComputedBrewWater(brewForm) || ""}
                        readOnly
                      />
                    </Field>
                    <Field label="Temperature (°C)">
                      <input style={inp()} type="number" value={brewForm.temperature} onChange={(e) => setBr("temperature", e.target.value)} placeholder="e.g. 96" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Grind Size">
                      <input style={inp()} value={brewForm.grindSize} onChange={(e) => setBr("grindSize", e.target.value)} placeholder="e.g. 3.2 / medium-fine" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                  {brewForm.dose && getComputedBrewWater(brewForm) && (
                    <div style={{ marginTop: "9px", padding: "9px 13px", background: "rgba(200,137,58,0.07)", borderRadius: "7px", fontSize: "13px", color: "#c8893a" }}>Ratio: 1:{calcRatio(brewForm.dose, getComputedBrewWater(brewForm))}</div>
                  )}
                </section>
                <section>
                  <SectionHead>Technique</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Bloom Water (g)">
                      <input style={inp()} type="number" value={brewForm.bloomWater} onChange={(e) => setBr("bloomWater", e.target.value)} placeholder="e.g. 45" onFocus={onFoc} onBlur={onBlr} />
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
                      <input style={inp()} type="number" value={brewForm.numPours} onChange={(e) => setBr("numPours", e.target.value)} placeholder="e.g. 3" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Total Time (mm:ss)">
                      <input style={inp()} value={brewForm.totalTime} onChange={(e) => setBr("totalTime", e.target.value)} placeholder="e.g. 2:45" onFocus={onFoc} onBlur={onBlr} />
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
                                    setBr("bloomTime", bloomSeconds === "" ? "" : String(bloomSeconds));
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
                          {techniquePreviewLines.map((line, idx) => (
                            <div key={`${line.text}-${idx}`} style={{ fontSize: "12px", color: "#f0e6d3", lineHeight: 1.6 }}>{line.text}</div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: "13px", color: "#d0b69a" }}>Enter bloom and pours to see the technique preview here.</div>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}

            {method === "Espresso" && (
              <>
                <section>
                  <SectionHead>Equipment</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Espresso Machine">
                      <input style={inp()} value={brewForm.machine} onChange={(e) => setBr("machine", e.target.value)} placeholder="e.g. Gaggia Classic" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Pre-heat Setting" hint="Group head / machine temperature">
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {preHeatOptions.map((opt) => (
                          <button key={opt} onClick={() => setBr("preHeat", brewForm.preHeat === opt ? "" : opt)} style={{ padding: "7px 16px", borderRadius: "20px", border: `1px solid ${brewForm.preHeat === opt ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: brewForm.preHeat === opt ? "rgba(200,137,58,0.18)" : "transparent", color: brewForm.preHeat === opt ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "13px", transition: "all 0.15s" }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Grinder">
                      <input style={inp()} value={brewForm.grinder} onChange={(e) => setBr("grinder", e.target.value)} placeholder="e.g. Niche Zero" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Grind Setting">
                      <input style={inp()} value={brewForm.grindSize} onChange={(e) => setBr("grindSize", e.target.value)} placeholder="e.g. 20 clicks" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                </section>
                <section>
                  <SectionHead>Recipe</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Dose (g)">
                      <input style={inp()} type="number" value={brewForm.dose} onChange={(e) => setBr("dose", e.target.value)} placeholder="e.g. 18" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Temperature (°C)">
                      <input style={inp()} type="number" value={brewForm.temperature} onChange={(e) => setBr("temperature", e.target.value)} placeholder="e.g. 93" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                  {brewForm.dose && (brewForm.shotYield || brewForm.water) && (
                    <div style={{ marginTop: "9px", padding: "9px 13px", background: "rgba(200,137,58,0.07)", borderRadius: "7px", fontSize: "13px", color: "#c8893a" }}>Brew ratio: 1:{calcRatio(brewForm.dose, brewForm.shotYield || brewForm.water)}</div>
                  )}
                </section>
                <section>
                  <SectionHead>Technique</SectionHead>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                    <Field label="Pre-Infusion (s)">
                      <input style={inp()} type="number" value={brewForm.preInfusionTime || ""} onChange={(e) => setBr("preInfusionTime", e.target.value)} placeholder="e.g. 12" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Pre-Infusion (Bar)">
                      <input style={inp()} type="number" value={brewForm.preInfusionBar || ""} onChange={(e) => setBr("preInfusionBar", e.target.value)} placeholder="e.g. 2" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Max Pressure (Bar)">
                      <input style={inp()} type="number" value={brewForm.maxPressureBar || ""} onChange={(e) => setBr("maxPressureBar", e.target.value)} placeholder="e.g. 9" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Max Pressure Until (g)">
                      <input style={inp()} type="number" value={brewForm.maxPressureUntilG || ""} onChange={(e) => setBr("maxPressureUntilG", e.target.value)} placeholder="e.g. 20" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Finish Pressure (Bar)">
                      <input style={inp()} type="number" value={brewForm.finishPressureBar || ""} onChange={(e) => setBr("finishPressureBar", e.target.value)} placeholder="e.g. 4.5" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Shot Yield (g)">
                      <input style={inp()} type="number" value={brewForm.shotYield || ""} onChange={(e) => { setBr("shotYield", e.target.value); setBr("water", e.target.value); }} placeholder="e.g. 36" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Brew Time (seconds)">
                      <input style={inp()} type="number" value={brewForm.brewTime} onChange={(e) => setBr("brewTime", e.target.value)} placeholder="e.g. 28" onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                    <Field label="Date">
                      <input style={inp()} type="date" value={brewForm.date} onChange={(e) => setBr("date", e.target.value)} onFocus={onFoc} onBlur={onBlr} />
                    </Field>
                  </div>
                </section>
              </>
            )}

            <section>
              <SectionHead>Tasting</SectionHead>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Field label="Rating">
                  <StarRating value={brewForm.rating} onChange={(v) => setBr("rating", v)} />
                </Field>
                <Field label="Tasting Notes">
                  <textarea style={inp({ resize: "vertical", minHeight: "80px", lineHeight: 1.6 })} value={brewForm.tastingNotes} onChange={(e) => setBr("tastingNotes", e.target.value)} placeholder="Flavours, body, finish…" onFocus={onFoc} onBlur={onBlr} />
                </Field>
              </div>
            </section>

            <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
              <button onClick={saveBrew} style={{ flex: 1, background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "9px", color: "#fff", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: "pointer" }}>
                {editingBrewId ? "Update Brew" : "Save Brew"}
              </button>
              <button onClick={() => { setView("beanDetail"); setEditingBrewId(null); }} style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#c9b094", cursor: "pointer", fontSize: "14px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
