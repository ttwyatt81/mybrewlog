import RecipeForm from "../forms/RecipeForm";

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
  calcRatio,
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
          <button onClick={() => setEditRecipe({ ...defaultRecipe })}
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
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <Tag>{recipe.method}</Tag>
                        {recipe.brewer && <Tag>{recipe.brewer}</Tag>}
                        {recipe.filterPaper && <Tag>{recipe.filterPaper}</Tag>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => setEditRecipe({ ...recipe })}
                        style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", padding: "5px 10px", fontSize: "12px" }}>Edit</button>
                      <button onClick={() => deleteRecipe(recipe.id)}
                        style={{ background: "none", border: "1px solid rgba(200,50,50,0.2)", borderRadius: "7px", color: "#8a4a4a", cursor: "pointer", padding: "5px 10px", fontSize: "12px" }}>Delete</button>
                    </div>
                  </div>
                  {recipe.method === "Pour Over" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                      {[
                        { l: "Dose", v: recipe.dose ? `${recipe.dose}g` : null },
                        { l: "Water", v: recipe.water ? `${recipe.water}g` : null },
                        { l: "Ratio", v: calcRatio(recipe.dose, recipe.water) ? `1:${calcRatio(recipe.dose, recipe.water)}` : null },
                        { l: "Temp", v: recipe.temperature ? `${recipe.temperature}°C` : null },
                        { l: "Grind", v: recipe.grindSize || null },
                        { l: "Bloom", v: recipe.bloomWater ? `${recipe.bloomWater}g` : null },
                        { l: "# Pours", v: recipe.numPours || null },
                        { l: "Time", v: recipe.totalTime || null },
                      ].filter(x => x.v).map(x => (
                        <div key={x.l} style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "7px 6px", textAlign: "center" }}>
                          <div style={{ fontSize: "12px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{x.v}</div>
                          <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {recipe.pourStructure && (
                    <div style={{ marginTop: "10px", fontSize: "12px", color: "#d0b69a", lineHeight: 1.6, borderLeft: "2px solid rgba(200,137,58,0.2)", paddingLeft: "10px" }}>
                      {recipe.pourStructure}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
