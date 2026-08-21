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
    <div>
      {!editRecipe.id && !editRecipe.method_confirmed && (
        <div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← Recipes</button>
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
              onClose();
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

          <div style={{ display: "flex", gap: "10px", paddingBottom: "40px", marginTop: "26px" }}>
            <button onClick={saveRecipe} disabled={!editRecipe.name}
              style={{ flex: 1, background: editRecipe.name ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.15)", border: "none", borderRadius: "9px", color: editRecipe.name ? "#fff" : "#4a3020", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: editRecipe.name ? "pointer" : "not-allowed" }}>
              Save Recipe
            </button>
            <button onClick={onClose}
              style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#c9b094", cursor: "pointer", fontSize: "14px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
