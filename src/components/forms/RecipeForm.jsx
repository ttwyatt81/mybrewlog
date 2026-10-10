import { normalizePourSteps } from "../../features/brews/model";
import MethodFormSections from "./MethodFormSections";

export default function RecipeForm({
  editRecipe,
  setEditRecipe,
  method,
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
    <div className="mbl-editor-sections">
      <section>
        <SectionHead>Description</SectionHead>
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
        <div className="mbl-empty mbl-recipe-placeholder">
          <p>{method} recipe fields coming soon</p>
        </div>
      )}
    </div>
  );
}
