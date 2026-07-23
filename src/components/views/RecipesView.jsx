import RecipeForm from "../forms/RecipeForm";
import BrewLogCardContent from "../BrewLogCardContent";

export default function RecipesView({
  recipes,
  editRecipe,
  setEditRecipe,
  defaultRecipe,
  deleteRecipe,
  saveRecipe,
  brewMethods,
  pourOverBrewers,
  filterPapers,
  preHeatOptions,
  calcRatio,
  bloomRatio,
  getTechniqueLinesFromBrew,
  Tag,
  Field,
  SectionHead,
  inp,
  onFoc,
  onBlr,
}) {
  return (
    <div>
      {!editRecipe && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", marginBottom: "4px" }}>Recipes</div>
            <div style={{ fontSize: "10px", color: "#c3aa90", letterSpacing: "0.18em", textTransform: "uppercase" }}>Saved brew recipes</div>
          </div>
          <button onClick={() => setEditRecipe({ ...defaultRecipe, method_confirmed: null })}
            style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
            + New Recipe
          </button>
        </div>
      )}

      {editRecipe ? (
        <RecipeForm
          editRecipe={editRecipe}
          setEditRecipe={setEditRecipe}
          saveRecipe={saveRecipe}
          brewMethods={brewMethods}
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
      ) : (
        <div>
          {recipes.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: "60px" }}>
              <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.2 }}>📋</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#5a4030", marginBottom: "8px" }}>No saved recipes yet</div>
              <div style={{ fontSize: "13px", color: "#3a2a1a" }}>Hit "+ New Recipe" to save a reusable brew recipe</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recipes.map(recipe => (
                <div key={recipe.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.18)", borderRadius: "12px", padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", marginBottom: "4px" }}>{recipe.name}</div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => setEditRecipe({ ...recipe, method_confirmed: recipe.method || "Pour Over" })}
                        style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", padding: "5px 10px", fontSize: "12px" }}>Edit</button>
                      <button onClick={() => deleteRecipe(recipe.id)}
                        style={{ background: "none", border: "1px solid rgba(200,50,50,0.2)", borderRadius: "7px", color: "#8a4a4a", cursor: "pointer", padding: "5px 10px", fontSize: "12px" }}>Delete</button>
                    </div>
                  </div>
                  <BrewLogCardContent
                    entry={recipe}
                    calcRatio={calcRatio}
                    bloomRatio={bloomRatio}
                    getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
                    showRecipeSource={false}
                    showTastingNotes={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
