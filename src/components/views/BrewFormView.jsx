import StarRating from "../ui/StarRating";
import MethodFormSections from "../forms/MethodFormSections";

export default function BrewFormView({
  liveBean,
  brewForm,
  setBr,
  setPourStep,
  editingBrewId,
  recipes,
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
            <MethodFormSections
              method={method}
              formState={brewForm}
              setField={setBr}
              setPourStep={setPourStep}
              calcRatio={calcRatio}
              Field={Field}
              SectionHead={SectionHead}
              inp={inp}
              onFoc={onFoc}
              onBlr={onBlr}
              pourOverBrewers={pourOverBrewers}
              filterPapers={filterPapers}
              preHeatOptions={preHeatOptions}
              includeDateField
            />

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
