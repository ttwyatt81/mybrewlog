import RecipeForm from "../forms/RecipeForm";
import BrewLogCardContent from "../BrewLogCardContent";

export default function RecipesView({
  recipes,
  editRecipe,
  setEditRecipe,
  defaultRecipe,
  deleteRecipe,
  saveRecipe,
  recipeListMode,
  setRecipeListMode,
  onToggleArchive,
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

      {!editRecipe && (
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "999px", padding: "4px", marginBottom: "18px" }}>
          {[
            { id: "active", label: "Active" },
            { id: "archived", label: "Archived" }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setRecipeListMode(option.id)}
              style={{
                padding: "7px 16px",
                borderRadius: "999px",
                border: "none",
                background: recipeListMode === option.id ? "rgba(200,137,58,0.18)" : "transparent",
                color: recipeListMode === option.id ? "#e4bf82" : "#bca385",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: recipeListMode === option.id ? 600 : 400,
                transition: "all 0.15s"
              }}
            >
              {option.label}
            </button>
          ))}
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
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#5a4030", marginBottom: "8px" }}>{recipeListMode === "archived" ? "No archived recipes yet" : "No saved recipes yet"}</div>
              <div style={{ fontSize: "13px", color: "#3a2a1a" }}>{recipeListMode === "archived" ? "Archived recipes will show up here" : "Hit \"+ New Recipe\" to save a reusable brew recipe"}</div>
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
                      <button
                        onClick={() => onToggleArchive?.(recipe)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(200,137,58,0.2)",
                          borderRadius: "999px",
                          color: "#d9b98a",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: "9px",
                          lineHeight: 1,
                          height: "22px"
                        }}
                        aria-label={recipe.archived ? "Move recipe back to active" : "Archive recipe"}
                        title={recipe.archived ? "Move back to active" : "Archive recipe"}
                      >
                        <span>{recipe.archived ? "Archived" : "Active"}</span>
                        <span style={{
                          display: "inline-block",
                          width: "26px",
                          height: "14px",
                          borderRadius: "999px",
                          background: recipe.archived ? "linear-gradient(135deg, rgba(200,137,58,0.7), rgba(160,104,40,0.9))" : "rgba(255,255,255,0.12)",
                          position: "relative",
                          boxShadow: recipe.archived ? "0 0 0 1px rgba(200,137,58,0.4), 0 4px 10px rgba(160,104,40,0.25)" : "inset 0 0 0 1px rgba(255,255,255,0.06)"
                        }}>
                          <span style={{
                            position: "absolute",
                            top: "2px",
                            left: recipe.archived ? "14px" : "2px",
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: "#f5f0e7",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.28)"
                          }} />
                        </span>
                      </button>
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
