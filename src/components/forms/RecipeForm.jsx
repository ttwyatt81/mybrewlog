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
    </div>
  );
}
