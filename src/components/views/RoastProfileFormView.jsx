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
  StarRating,
}) {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", marginBottom: "4px" }}>{roastProfileForm.id ? "Edit Profile" : "New Profile"}</div>
          <div style={{ fontSize: "13px", color: "#6a5040", marginBottom: "24px" }}>Save a roast profile name preset</div>
        </div>

        <section>
          <SectionHead>Identity</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
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
            <Field label="Rating">
              <StarRating value={Number(roastProfileForm.rating) || 0} onChange={(v) => setRoastProfileForm((current) => ({ ...current, rating: v }))} />
            </Field>
          </div>
          <div style={{ marginTop: "11px" }}>
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

        <div style={{ display: "flex", gap: "10px", paddingBottom: "40px" }}>
          <button
            onClick={saveRoastProfile}
            style={{ flex: 1, background: roastProfileForm.name.trim() ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.15)", border: "none", borderRadius: "9px", color: roastProfileForm.name.trim() ? "#fff" : "#4a3020", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: roastProfileForm.name.trim() ? "pointer" : "not-allowed" }}
            disabled={!roastProfileForm.name.trim()}
          >
            {roastProfileForm.id ? "Save Profile" : "Create Profile"}
          </button>
          <button
            onClick={() => {
              setRoastProfileForm({ id: null, name: "", machine: "", description: "", lastUsed: "", rating: 0, archived: false });
              setView("beans");
            }}
            style={{ padding: "13px 20px", background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "9px", color: "#6a5040", cursor: "pointer", fontSize: "14px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
