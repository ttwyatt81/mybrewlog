import RecipeForm from "../forms/RecipeForm";

export default function RecipeFormView({
  editRecipe,
  setEditRecipe,
  saveRecipe,
  onClose,
  pourOverBrewers,
  filterPapers,
  preHeatOptions,
  calcRatio,
  Field,
  SectionHead,
  inp,
  onFoc,
  onBlr,
}) {
  const method = editRecipe.id ? editRecipe.method : (editRecipe.method_confirmed || editRecipe.method);

  return (
    <div className="mbl-editor-form mbl-recipe-form">
      {!editRecipe.id && !editRecipe.method_confirmed && (
        <div>
          <h1 className="mbl-title mbl-form-title">New Recipe</h1>
          <p className="mbl-form-intro">Select your brewing method</p>
          <div className="mbl-method-options">
            {[
              { method: "Pour Over", icon: "☕", sub: "V60, Chemex, Kalita…" },
              { method: "Espresso", icon: "🫖", sub: "Shot, lungo, ristretto…" },
            ].map(({ method: optionMethod, icon, sub }) => (
              <div className="mbl-method-card" key={optionMethod} onClick={() => setEditRecipe((recipe) => ({ ...recipe, method: optionMethod, method_confirmed: optionMethod }))}>
                <span className="mbl-method-icon" aria-hidden="true">{icon}</span>
                <span className="mbl-method-name">{optionMethod}</span>
                <span className="mbl-method-description">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(editRecipe.id || editRecipe.method_confirmed) && (
        <div>
          {!editRecipe.id && <button className="mbl-editor-text-button" onClick={() => setEditRecipe((recipe) => ({ ...recipe, method_confirmed: null }))}>← Change method</button>}
          <div className="mbl-editor-heading-row">
            <h1 className="mbl-title">{editRecipe.id ? "Edit Recipe" : method}</h1>
            <span className="mbl-editor-badge">{method}</span>
          </div>
          <p className="mbl-form-context">Save a reusable brew recipe</p>

          <RecipeForm
            editRecipe={editRecipe}
            setEditRecipe={setEditRecipe}
            method={method}
            pourOverBrewers={pourOverBrewers}
            filterPapers={filterPapers}
            preHeatOptions={preHeatOptions}
            calcRatio={calcRatio}
            Field={Field}
            SectionHead={SectionHead}
            inp={inp}
            onFoc={onFoc}
            onBlr={onBlr}
          />

          <div className="mbl-editor-actions mbl-recipe-actions">
            <button className="mbl-editor-button mbl-editor-button--primary" onClick={saveRecipe} disabled={!editRecipe.name}>
              Save Recipe
            </button>
            <button className="mbl-editor-button mbl-editor-button--quiet" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
