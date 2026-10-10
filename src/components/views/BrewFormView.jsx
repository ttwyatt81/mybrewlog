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
    <div className="mbl-editor-form mbl-brew-form">
      {!editingBrewId && !brewForm.method_confirmed && (
        <div>
          <h1 className="mbl-title mbl-form-title">Log a Brew</h1>
          <p className="mbl-form-intro">Select your brewing method</p>
          <div className="mbl-method-options">
            {[
              { method: "Pour Over", icon: "☕", sub: "V60, Chemex, Kalita…" },
              { method: "Espresso", icon: "🫖", sub: "Shot, lungo, ristretto…" },
            ].map(({ method: optionMethod, icon, sub }) => (
              <div className="mbl-method-card" key={optionMethod} onClick={() => setBrewForm((f) => ({ ...f, method_confirmed: optionMethod }))}>
                <span className="mbl-method-icon" aria-hidden="true">{icon}</span>
                <span className="mbl-method-name">{optionMethod}</span>
                <span className="mbl-method-description">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(editingBrewId || brewForm.method_confirmed) && (
        <div>
          {!editingBrewId && (
            <button className="mbl-editor-text-button" onClick={() => setBrewForm((f) => ({ ...f, method_confirmed: null }))}>← Change method</button>
          )}
          <div className="mbl-editor-heading-row">
            <h1 className="mbl-title">{editingBrewId ? "Edit Brew" : method}</h1>
            <span className="mbl-editor-badge">{method}</span>
          </div>
          <p className="mbl-form-context">{[liveBean.roastLevel, liveBean.process, liveBean.origin].filter(Boolean).join(" · ")}</p>

          <div className="mbl-form-presets">
            <div className="mbl-form-preset-row">
              <button onClick={() => {
                const last = liveBean.brews.find((b) => b.method === method);
                if (!last) return;
                setBrewForm((f) => ({...f, ...last, id: f.id, date: f.date, method: last.method || method, method_confirmed: method, recipeSource: "Last Brew", recipeId: "", recipeName: "" }));
              }} disabled={!liveBean.brews.some((b) => b.method === method)} className="mbl-editor-chip">↑ Last Brew</button>
            </div>
            {recipes.filter((r) => r.method === method).length > 0 && (
              <div className="mbl-form-recipe-shortcuts">
                <span className="mbl-label">Recipes</span>
                {recipes.filter((r) => r.method === method).map((recipe) => (
                  <button className="mbl-editor-chip" key={recipe.id} onClick={() => setBrewForm((f) => ({ ...f, ...recipe, id: f.id, date: f.date, method: recipe.method || method, method_confirmed: method, recipeSource: "Saved Recipe", recipeId: recipe.id, recipeName: recipe.name }))}>{recipe.name}</button>
                ))}
              </div>
            )}
          </div>

          <div className="mbl-editor-sections">
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
              <div className="mbl-editor-field-stack">
                <Field label="Rating">
                  <StarRating value={brewForm.rating} onChange={(v) => setBr("rating", v)} />
                </Field>
                <Field label="Tasting Notes">
                  <textarea style={inp({ resize: "vertical", minHeight: "80px", lineHeight: 1.6 })} value={brewForm.tastingNotes} onChange={(e) => setBr("tastingNotes", e.target.value)} placeholder="Flavours, body, finish…" onFocus={onFoc} onBlur={onBlr} />
                </Field>
              </div>
            </section>

            <div className="mbl-editor-actions">
              <button className="mbl-editor-button mbl-editor-button--primary" onClick={saveBrew}>
                {editingBrewId ? "Update Brew" : "Save Brew"}
              </button>
              <button className="mbl-editor-button mbl-editor-button--quiet" onClick={() => { setView("beanDetail"); setEditingBrewId(null); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
