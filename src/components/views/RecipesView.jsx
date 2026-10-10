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
      <div className="mbl-view-heading">
        <h1 className="mbl-title">Recipes</h1>
        <div className="mbl-label">Saved brew recipes</div>
      </div>

      <div className="mbl-row mbl-actions-row">
        <button className="mbl-btn mbl-btn--primary" onClick={onCreateRecipe}>
          + New Recipe
        </button>
        <div className="mbl-segment" role="group" aria-label="Recipe list">
        {[
          { id: "active", label: "Active" },
          { id: "archived", label: "Archived" }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setRecipeListMode(option.id)}
            aria-pressed={recipeListMode === option.id}
          >
            {option.label}
          </button>
        ))}
        </div>
      </div>

      <div className="mbl-row mbl-filter-row mbl-filter-row--single" style={{ marginBottom: "16px" }}>
        <input
          className="mbl-field mbl-field--search"
          value={recipeSearch}
          onChange={(e) => setRecipeSearch(e.target.value)}
          placeholder="Search recipes…"
          aria-label="Search recipes"
        />
      </div>

      <div className="mbl-cards">
        {recipes.length === 0 ? (
          <div className="mbl-empty">
            <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.2 }}>📋</div>
            <h2>{recipeListMode === "archived" ? "No archived recipes yet" : "No saved recipes yet"}</h2>
            <p>{recipeListMode === "archived" ? "Archived recipes will show up here" : "Hit \"+ New Recipe\" to save a reusable brew recipe"}</p>
          </div>
        ) : (
          recipes.map((recipe) => (
            <article key={recipe.id} className={`mbl-card mbl-card--static mbl-recipe-card${recipe.archived ? " mbl-card--archived" : ""}`} style={{ "--mbl-accent": "var(--mbl-section)" }}>
              <div className="mbl-card-head mbl-recipe-card-head">
                <h2 className="mbl-card-name">{recipe.name}</h2>
                <div className="mbl-card-actions">
                  <button className="mbl-link" onClick={() => onToggleArchive?.(recipe)} aria-label={recipe.archived ? "Move recipe back to active" : "Archive recipe"}>{recipe.archived ? "Unarchive" : "Archive"}</button>
                  <button className="mbl-link" onClick={() => onEditRecipe(recipe)} aria-label={`Edit ${recipe.name}`}>Edit</button>
                  <button className="mbl-link" onClick={() => deleteRecipe(recipe.id)} aria-label={`Delete ${recipe.name}`}>Delete</button>
                </div>
              </div>
              <div className="mbl-recipe-content">
                <BrewLogCardContent
                  entry={recipe}
                  calcRatio={calcRatio}
                  bloomRatio={bloomRatio}
                  getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
                  recipeOverview
                  showRecipeSource={false}
                  showTastingNotes={false}
                />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
