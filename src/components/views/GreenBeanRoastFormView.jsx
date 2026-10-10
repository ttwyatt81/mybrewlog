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
  SectionHead,
  inp,
  onFoc,
  onBlr,
  saveGreenBeanRoast,
}) {
  return (
    <div className="mbl-editor-form mbl-green-roast-form">
      <button className="mbl-editor-text-button" onClick={() => { setView("beanDetail"); setEditingGreenBeanRoastId(null); setGreenBeanRoastForm(defaultGreenBeanRoast); }}>← {liveBean.name}</button>
      <header className="mbl-editor-heading-row">
        <h1 className="mbl-title">{editingGreenBeanRoastId ? "Edit Roast" : "Log Roast"}</h1>
      </header>
      <p className="mbl-form-context">{liveBean.name}</p>

      <div className="mbl-editor-sections">
        <section>
          <SectionHead>Profile &amp; Timing</SectionHead>
          <div className="mbl-roast-form-fields">
            <Field label="Roast Profile">
              <div className="mbl-roast-profile-select">
                <select
                  style={{ ...inp({ cursor: "pointer" }), flex: 1 }}
                  value={greenBeanRoastForm.roastProfileId || ""}
                  onChange={(e) => {
                    const selectedProfile = roastProfiles.find((profile) => profile.id === e.target.value);
                    setGreenBeanRoastForm((f) => ({
                      ...f,
                      roastProfileId: e.target.value,
                      profile: selectedProfile?.name || "",
                    }));
                  }}
                  onFocus={onFoc}
                  onBlur={onBlr}
                >
                  <option value="">Select...</option>
                  {roastProfiles
                    .filter((profile) => !profile.archived || profile.id === greenBeanRoastForm.roastProfileId)
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>{profile.archived ? `${profile.name} (archived)` : profile.name}</option>
                    ))}
                </select>
                <button className="mbl-editor-option" onClick={() => { setTab("roastProfiles"); setView("beans"); }}>Profiles</button>
              </div>
            </Field>

            <div className="mbl-editor-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="Roast Date">
                <input
                  style={inp()}
                  type="date"
                  value={greenBeanRoastForm.date || ""}
                  onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, date: e.target.value }))}
                  onFocus={onFoc}
                  onBlur={onBlr}
                />
              </Field>
              <Field label="Roast Time">
                <input
                  style={inp()}
                  type="time"
                  value={greenBeanRoastForm.roastTime || ""}
                  onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, roastTime: e.target.value }))}
                  onFocus={onFoc}
                  onBlur={onBlr}
                />
              </Field>
            </div>

            <Field label="Roast duration level">
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
          </div>
        </section>

        <section>
          <SectionHead>Resting &amp; Development</SectionHead>
          <div className="mbl-roast-form-fields">
            <div className="mbl-editor-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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

            <div className="mbl-editor-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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

            <div className="mbl-editor-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="Start Weight (g)">
                <input style={inp()} type="number" min="0" step="0.1" value={greenBeanRoastForm.startWeight} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, startWeight: e.target.value }))} onFocus={onFoc} onBlur={onBlr} />
              </Field>
              <Field label="End Weight (g)">
                <input style={inp()} type="number" min="0" step="0.1" value={greenBeanRoastForm.endWeight} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, endWeight: e.target.value }))} onFocus={onFoc} onBlur={onBlr} />
              </Field>
            </div>
          </div>
        </section>

        <section className="mbl-roast-notes-section">
          <div className="mbl-roast-form-fields">
            <Field label="Notes">
              <textarea style={inp({ resize: "vertical", minHeight: "90px", lineHeight: 1.6 })} value={greenBeanRoastForm.notes} onChange={(e) => setGreenBeanRoastForm((f) => ({ ...f, notes: e.target.value }))} placeholder="What stood out in the roast?" onFocus={onFoc} onBlur={onBlr} />
            </Field>
          </div>
        </section>

        <div className="mbl-editor-actions">
          <button className="mbl-editor-button mbl-editor-button--primary" onClick={saveGreenBeanRoast}>
            {editingGreenBeanRoastId ? "Update Roast" : "Save Roast"}
          </button>
          <button className="mbl-editor-button mbl-editor-button--quiet" onClick={() => { setView("beanDetail"); setEditingGreenBeanRoastId(null); setGreenBeanRoastForm(defaultGreenBeanRoast); }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
