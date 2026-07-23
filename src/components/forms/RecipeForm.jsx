import { normalizePourSteps } from "../../features/brews/model";
import MethodFormSections from "./MethodFormSections";

export default function RecipeForm({
  editRecipe,
  setEditRecipe,
  saveRecipe,
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
}) {
  const method = editRecipe.id ? editRecipe.method : (editRecipe.method_confirmed || editRecipe.method);
  const setRecipeField = (key, value) => setEditRecipe((recipe) => ({ ...recipe, [key]: value }));
  const setRecipePourStep = (index, key, value) => setEditRecipe((recipe) => {
    const pours = normalizePourSteps(recipe.pours, recipe.numPours);
    pours[index] = { ...pours[index], [key]: value };
    return { ...recipe, pours };
  });

  return (
    <div>
      {!editRecipe.id && !editRecipe.method_confirmed && (
        <div>
          <button onClick={() => setEditRecipe(null)} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← Recipes</button>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>New Recipe</div>
          <div style={{ fontSize: "13px", color: "#c9b094", marginBottom: "32px" }}>Select your brewing method</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { method: "Pour Over", icon: "☕", sub: "V60, Chemex, Kalita…" },
              { method: "Espresso", icon: "🫖", sub: "Shot, lungo, ristretto…" },
            ].map(({ method: optionMethod, icon, sub }) => (
              <div key={optionMethod} onClick={() => setEditRecipe((recipe) => ({ ...recipe, method: optionMethod, method_confirmed: optionMethod }))} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "14px", padding: "28px 16px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,137,58,0.08)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.6)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.25)"; }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>{icon}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", marginBottom: "6px" }}>{optionMethod}</div>
                <div style={{ fontSize: "11px", color: "#c9b094" }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(editRecipe.id || editRecipe.method_confirmed) && (
        <div>
          <button onClick={() => {
            if (editRecipe.id) {
              setEditRecipe(null);
              return;
            }
            setEditRecipe((recipe) => ({ ...recipe, method_confirmed: null }));
          }} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", marginBottom: "14px", padding: 0 }}>
            {editRecipe.id ? "← Recipes" : "← Change method"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px" }}>{editRecipe.id ? "Edit Recipe" : method}</div>
            <span style={{ fontSize: "11px", color: "#d4bca0", background: "rgba(200,137,58,0.08)", padding: "3px 10px", borderRadius: "20px" }}>{method}</span>
          </div>
          <div style={{ fontSize: "13px", color: "#c9b094", marginBottom: "24px" }}>Save a reusable brew recipe</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
            <section>
              <SectionHead>Recipe Name</SectionHead>
              <Field label="Recipe Name">
                <input style={inp()} value={editRecipe.name} onChange={e => setEditRecipe(r => ({ ...r, name: e.target.value }))} placeholder="e.g. My go-to V60" onFocus={onFoc} onBlur={onBlr} />
              </Field>
            </section>

            {(method === "Pour Over" || method === "Espresso") && (
              <MethodFormSections
                method={method}
                formState={editRecipe}
                setField={setRecipeField}
                setPourStep={setRecipePourStep}
                calcRatio={calcRatio}
                Field={Field}
                SectionHead={SectionHead}
                inp={inp}
                onFoc={onFoc}
                onBlr={onBlr}
                pourOverBrewers={pourOverBrewers}
                filterPapers={filterPapers}
                preHeatOptions={preHeatOptions}
                includeDateField={false}
              />
            )}

            {method !== "Pour Over" && method !== "Espresso" && (
              <div style={{ textAlign: "center", padding: "32px 0", border: "1px dashed rgba(200,137,58,0.15)", borderRadius: "10px" }}>
                <div style={{ fontSize: "13px", color: "#4a3a2a" }}>{method} recipe fields coming soon</div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
              <button onClick={saveRecipe} disabled={!editRecipe.name}
                style={{ flex: 1, background: editRecipe.name ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.15)", border: "none", borderRadius: "9px", color: editRecipe.name ? "#fff" : "#4a3020", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: editRecipe.name ? "pointer" : "not-allowed" }}>
                Save Recipe
              </button>
              <button onClick={() => setEditRecipe(null)}
                style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#c9b094", cursor: "pointer", fontSize: "14px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
