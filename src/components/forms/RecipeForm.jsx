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
  const setRecipeField = (key, value) => setEditRecipe((recipe) => ({ ...recipe, [key]: value }));
  const setRecipePourStep = (index, key, value) => setEditRecipe((recipe) => {
    const pours = normalizePourSteps(recipe.pours, recipe.numPours);
    pours[index] = { ...pours[index], [key]: value };
    return { ...recipe, pours };
  });

  return (
    <div>
      <button onClick={() => setEditRecipe(null)} style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← Recipes</button>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>{editRecipe.id ? "Edit Recipe" : "New Recipe"}</div>
      <div style={{ fontSize: "13px", color: "#6a5040", marginBottom: "24px" }}>Save a reusable brew recipe</div>

      <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
        <section>
          <SectionHead>Recipe Name & Method</SectionHead>
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            <Field label="Recipe Name">
              <input style={inp()} value={editRecipe.name} onChange={e => setEditRecipe(r => ({ ...r, name: e.target.value }))} placeholder="e.g. My go-to V60" onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="Brew Method">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {brewMethods.map(m => (
                  <button key={m} onClick={() => setEditRecipe(r => ({ ...r, method: m }))}
                    style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${editRecipe.method === m ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: editRecipe.method === m ? "rgba(200,137,58,0.18)" : "transparent", color: editRecipe.method === m ? "#c8a060" : "#5a4a3a", cursor: "pointer", fontSize: "13px", transition: "all 0.15s" }}>
                    {m}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </section>

        {(editRecipe.method === "Pour Over" || editRecipe.method === "Espresso") && (
          <MethodFormSections
            method={editRecipe.method}
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

        {editRecipe.method !== "Pour Over" && editRecipe.method !== "Espresso" && (
          <div style={{ textAlign: "center", padding: "32px 0", border: "1px dashed rgba(200,137,58,0.15)", borderRadius: "10px" }}>
            <div style={{ fontSize: "13px", color: "#4a3a2a" }}>{editRecipe.method} recipe fields coming soon</div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
          <button onClick={saveRecipe} disabled={!editRecipe.name}
            style={{ flex: 1, background: editRecipe.name ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.15)", border: "none", borderRadius: "9px", color: editRecipe.name ? "#fff" : "#4a3020", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: editRecipe.name ? "pointer" : "not-allowed" }}>
            Save Recipe
          </button>
          <button onClick={() => setEditRecipe(null)}
            style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#6a5040", cursor: "pointer", fontSize: "14px" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
