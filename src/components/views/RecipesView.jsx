import BrewLogCardContent from "../BrewLogCardContent";

export default function RecipesView({
  recipes,
  recipeSearch,
  setRecipeSearch,
  onCreateRecipe,
  onEditRecipe,
  deleteRecipe,
  recipeListMode,
  setRecipeListMode,
  onToggleArchive,
  calcRatio,
  bloomRatio,
  getTechniqueLinesFromBrew,
}) {
  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", marginBottom: "4px" }}>Recipes</div>
        <div style={{ fontSize: "10px", color: "#c3aa90", letterSpacing: "0.18em", textTransform: "uppercase" }}>Saved brew recipes</div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        <button onClick={onCreateRecipe}
          style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
          + New Recipe
        </button>
        <input
          value={recipeSearch}
          onChange={(e) => setRecipeSearch(e.target.value)}
          placeholder="Search recipes…"
          style={{ flex: 1, minWidth: "120px", fontSize: "13px", padding: "7px 11px" }}
        />
      </div>

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
                    <button
                      onClick={() => onEditRecipe(recipe)}
                      style={{ background: "none", border: "none", color: "#c9b094", cursor: "pointer", fontSize: "14px", padding: "0 2px", display: "inline-flex", alignItems: "center", gap: "0px", overflow: "hidden", minWidth: "46px", justifyContent: "flex-start", transition: "color 0.15s ease" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#c8893a";
                        const icon = e.currentTarget.querySelector('[data-role="edit-icon"]');
                        const label = e.currentTarget.querySelector('[data-role="edit-label"]');
                        if (icon) icon.style.transform = "translateX(1px)";
                        if (label) label.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#c9b094";
                        const icon = e.currentTarget.querySelector('[data-role="edit-icon"]');
                        const label = e.currentTarget.querySelector('[data-role="edit-label"]');
                        if (icon) icon.style.transform = "translateX(0)";
                        if (label) label.style.opacity = "0";
                      }}
                      aria-label={`Edit ${recipe.name}`}
                    >
                      <span data-role="edit-label" style={{ fontSize: "11px", color: "#d4bca0", opacity: 0, width: "40px", overflow: "hidden", whiteSpace: "nowrap", transition: "opacity 0.15s ease" }}>Edit</span>
                      <span data-role="edit-icon" style={{ fontSize: "14px", lineHeight: "1", display: "inline-block", transition: "transform 0.15s ease" }}>✎</span>
                    </button>
                    <button onClick={() => deleteRecipe(recipe.id)} style={{ background: "none", border: "none", color: "#c9b094", cursor: "pointer", fontSize: "14px", padding: "0 4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#c9b094")}>✕</button>
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
    </div>
  );
}
