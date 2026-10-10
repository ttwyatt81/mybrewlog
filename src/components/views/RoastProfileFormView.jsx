const formatDateForInput = (value) => {
  if (!value) return "";
  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}-${month}-${year}`;
  }

  const inputMatch = String(value).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (inputMatch) {
    const [, day, month, year] = inputMatch;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  }

  return String(value);
};

export default function RoastProfileFormView({
  setView,
  setRoastProfileForm,
  roastProfileForm,
  saveRoastProfile,
  Field,
  SectionHead,
  inp,
  onFoc,
  onBlr,
}) {
  return (
    <div className="mbl-editor-form mbl-roast-profile-form">
      <header className="mbl-editor-heading-row">
        <h1 className="mbl-title">{roastProfileForm.id ? "Edit Profile" : "New Profile"}</h1>
      </header>
      <p className="mbl-form-context">Save a roast profile name preset</p>

      <div className="mbl-editor-sections">
        <section>
          <SectionHead>Identity</SectionHead>
          <div className="mbl-editor-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
            <Field label="Profile Name">
              <input
                style={inp()}
                type="text"
                value={roastProfileForm.name}
                onChange={(e) => setRoastProfileForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="e.g. Nordic Light"
                onFocus={onFoc}
                onBlur={onBlr}
              />
            </Field>
            <Field label="Roasting Machine">
              <input
                style={inp()}
                type="text"
                value={roastProfileForm.machine}
                onChange={(e) => setRoastProfileForm((current) => ({ ...current, machine: e.target.value }))}
                placeholder="e.g. Aillio Bullet R1"
                onFocus={onFoc}
                onBlur={onBlr}
              />
            </Field>
            <Field label="Last Used">
              <input
                style={inp({ color: "#8f755a", cursor: "default" })}
                type="text"
                value={formatDateForInput(roastProfileForm.lastUsed || "")}
                readOnly
                disabled
                placeholder="DD-MM-YYYY"
              />
            </Field>
          </div>
          <div className="mbl-roast-profile-description">
            <Field label="Description">
              <textarea
                style={inp({ resize: "vertical", minHeight: "80px", lineHeight: 1.6 })}
                value={roastProfileForm.description}
                onChange={(e) => setRoastProfileForm((current) => ({ ...current, description: e.target.value }))}
                placeholder="Describe roast goals, milestones, and notes for this profile"
                onFocus={onFoc}
                onBlur={onBlr}
              />
            </Field>
          </div>
        </section>

        <div className="mbl-editor-actions">
          <button
            onClick={saveRoastProfile}
            className="mbl-editor-button mbl-editor-button--primary"
            disabled={!roastProfileForm.name.trim()}
          >
            {roastProfileForm.id ? "Save Profile" : "Create Profile"}
          </button>
          <button
            onClick={() => {
              setRoastProfileForm({ id: null, name: "", machine: "", description: "", lastUsed: "", archived: false });
              setView("beans");
            }}
            className="mbl-editor-button mbl-editor-button--quiet"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
