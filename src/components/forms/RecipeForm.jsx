export default function RecipeForm({
  editRecipe,
  setEditRecipe,
  saveRecipe,
  brewMethods,
  pourOverBrewers,
  filterPapers,
  calcRatio,
  Field,
  SectionHead,
  inp,
  onFoc,
  onBlr,
}) {
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

        {editRecipe.method === "Pour Over" && (<>
          <section>
            <SectionHead>Equipment</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
              <Field label="Brewer">
                <select style={inp({ cursor: "pointer" })} value={editRecipe.brewer} onChange={e => setEditRecipe(r => ({ ...r, brewer: e.target.value }))} onFocus={onFoc} onBlur={onBlr}>
                  <option value="">Select…</option>
                  {pourOverBrewers.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Filter Paper">
                <select style={inp({ cursor: "pointer" })} value={editRecipe.filterPaper} onChange={e => setEditRecipe(r => ({ ...r, filterPaper: e.target.value }))} onFocus={onFoc} onBlur={onBlr}>
                  <option value="">Select…</option>
                  {filterPapers.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
            </div>
          </section>
          <section>
            <SectionHead>Recipe Parameters</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
              <Field label="Dose (g)"><input style={inp()} type="number" value={editRecipe.dose} onChange={e => setEditRecipe(r => ({ ...r, dose: e.target.value }))} placeholder="e.g. 15" onFocus={onFoc} onBlur={onBlr} /></Field>
              <Field label="Water (g)"><input style={inp()} type="number" value={editRecipe.water} onChange={e => setEditRecipe(r => ({ ...r, water: e.target.value }))} placeholder="e.g. 250" onFocus={onFoc} onBlur={onBlr} /></Field>
              <Field label="Temperature (°C)"><input style={inp()} type="number" value={editRecipe.temperature} onChange={e => setEditRecipe(r => ({ ...r, temperature: e.target.value }))} placeholder="e.g. 96" onFocus={onFoc} onBlur={onBlr} /></Field>
              <Field label="Grind Size"><input style={inp()} value={editRecipe.grindSize} onChange={e => setEditRecipe(r => ({ ...r, grindSize: e.target.value }))} placeholder="e.g. 3.2" onFocus={onFoc} onBlur={onBlr} /></Field>
              <Field label="Bloom Water (g)"><input style={inp()} type="number" value={editRecipe.bloomWater} onChange={e => setEditRecipe(r => ({ ...r, bloomWater: e.target.value }))} placeholder="e.g. 45" onFocus={onFoc} onBlur={onBlr} /></Field>
              <Field label="Bloom Time (s)"><input style={inp()} type="number" value={editRecipe.bloomTime} onChange={e => setEditRecipe(r => ({ ...r, bloomTime: e.target.value }))} placeholder="e.g. 45" onFocus={onFoc} onBlur={onBlr} /></Field>
              <Field label="Number of Pours"><input style={inp()} type="number" value={editRecipe.numPours} onChange={e => setEditRecipe(r => ({ ...r, numPours: e.target.value }))} placeholder="e.g. 3" onFocus={onFoc} onBlur={onBlr} /></Field>
              <Field label="Total Time (mm:ss)"><input style={inp()} value={editRecipe.totalTime} onChange={e => setEditRecipe(r => ({ ...r, totalTime: e.target.value }))} placeholder="e.g. 2:30" onFocus={onFoc} onBlur={onBlr} /></Field>
            </div>
            {editRecipe.dose && editRecipe.water && (
              <div style={{ marginTop: "9px", padding: "9px 13px", background: "rgba(200,137,58,0.07)", borderRadius: "7px", fontSize: "13px", color: "#c8893a" }}>
                Brew ratio: 1:{calcRatio(editRecipe.dose, editRecipe.water)}
              </div>
            )}
            <div style={{ marginTop: "11px" }}>
              <Field label="Pour Structure">
                <textarea style={inp({ resize: "vertical", minHeight: "68px", lineHeight: 1.6 })} value={editRecipe.pourStructure} onChange={e => setEditRecipe(r => ({ ...r, pourStructure: e.target.value }))} placeholder="e.g. Bloom 45g → 150g at 0:45 → 250g at 1:30" onFocus={onFoc} onBlur={onBlr} />
              </Field>
            </div>
          </section>
        </>)}

        {editRecipe.method !== "Pour Over" && (
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
