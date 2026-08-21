export default function GreenBeanRoastFormView({
  liveBean,
  setView,
  setEditingGreenBeanRoastId,
  setGreenBeanRoastForm,
  defaultGreenBeanRoast,
  editingGreenBeanRoastId,
  greenBeanRoastForm,
  roastProfiles,
  setTab,
  Field,
  inp,
  onFoc,
  onBlr,
  saveGreenBeanRoast,
}) {
  return (
    <div>
      <button onClick={() => { setView("beanDetail"); setEditingGreenBeanRoastId(null); setGreenBeanRoastForm(defaultGreenBeanRoast); }} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← {liveBean.name}</button>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>{editingGreenBeanRoastId ? "Edit Roast" : "Log Roast"}</div>
          <div style={{ fontSize: "13px", color: "#c9b094", marginBottom: "18px" }}>{liveBean.name}</div>
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          <Field label="Roast Profile">
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                list="roast-profile-suggestions"
                style={{ ...inp(), flex: 1 }}
                value={greenBeanRoastForm.profile}
                onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, profile: e.target.value }))}
                placeholder="e.g. 12g charge, 1st crack at 1:20"
                onFocus={onFoc}
                onBlur={onBlr}
              />
              <datalist id="roast-profile-suggestions">
                {roastProfiles.map((profile) => (
                  <option key={profile.id} value={profile.name} />
                ))}
              </datalist>
              <button onClick={() => { setTab("roastProfiles"); setView("beans"); }} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", padding: "7px 10px", fontSize: "12px", whiteSpace: "nowrap" }}>Profiles</button>
            </div>
          </Field>

          <Field label="Roast Date">
            <input style={inp()} type="date" value={greenBeanRoastForm.date} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, date: e.target.value }))} onFocus={onFoc} onBlur={onBlr} />
          </Field>

          <Field label="Roast Level">
            <input
              style={inp()}
              type="text"
              value={greenBeanRoastForm.roastLevel}
              onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, roastLevel: e.target.value }))}
              placeholder="e.g. 2.5"
              onFocus={onFoc}
              onBlur={onBlr}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Ideal Resting Time (From days)">
              <input
                style={inp()}
                type="number"
                min="0"
                step="1"
                value={greenBeanRoastForm.restingFromDays}
                onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, restingFromDays: e.target.value }))}
                placeholder="e.g. 7"
                onFocus={onFoc}
                onBlur={onBlr}
              />
            </Field>
            <Field label="Ideal Resting Time (To days)">
              <input
                style={inp()}
                type="number"
                min="0"
                step="1"
                value={greenBeanRoastForm.restingToDays}
                onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, restingToDays: e.target.value }))}
                placeholder="e.g. 14"
                onFocus={onFoc}
                onBlur={onBlr}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="First Crack">
              <input
                style={inp()}
                type="text"
                value={greenBeanRoastForm.firstCrack}
                onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, firstCrack: e.target.value }))}
                placeholder="e.g. 8:30"
                onFocus={onFoc}
                onBlur={onBlr}
              />
            </Field>
            <Field label="Total Roast">
              <input
                style={inp()}
                type="text"
                value={greenBeanRoastForm.totalRoast}
                onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, totalRoast: e.target.value }))}
                placeholder="e.g. 11:45"
                onFocus={onFoc}
                onBlur={onBlr}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Start Weight (g)">
              <input style={inp()} type="number" min="0" step="0.1" value={greenBeanRoastForm.startWeight} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, startWeight: e.target.value }))} onFocus={onFoc} onBlur={onBlr} />
            </Field>
            <Field label="End Weight (g)">
              <input style={inp()} type="number" min="0" step="0.1" value={greenBeanRoastForm.endWeight} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, endWeight: e.target.value }))} onFocus={onFoc} onBlur={onBlr} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea style={inp({ resize: "vertical", minHeight: "90px", lineHeight: 1.6 })} value={greenBeanRoastForm.notes} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, notes: e.target.value }))} placeholder="What stood out in the roast?" onFocus={onFoc} onBlur={onBlr} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
          <button onClick={saveGreenBeanRoast} style={{ flex: 1, background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "9px", color: "#fff", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: "pointer" }}>
            {editingGreenBeanRoastId ? "Update Roast" : "Save Roast"}
          </button>
          <button onClick={() => { setView("beanDetail"); setEditingGreenBeanRoastId(null); setGreenBeanRoastForm(defaultGreenBeanRoast); }} style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#c9b094", cursor: "pointer", fontSize: "14px" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
