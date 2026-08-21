export default function RoastProfilesView({
  startNewRoastProfile,
  roastProfileListMode,
  setRoastProfileListMode,
  roastProfileSearch,
  setRoastProfileSearch,
  visibleRoastProfiles,
  toggleArchiveRoastProfile,
  editRoastProfile,
  deleteRoastProfile,
}) {
  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", letterSpacing: "0.02em", marginBottom: "4px" }}>Roast Profiles</div>
        <div style={{ fontSize: "10px", color: "#c3aa90", letterSpacing: "0.18em", textTransform: "uppercase" }}>Saved roast name presets</div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        <button onClick={startNewRoastProfile} style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>+ New Profile</button>
        <input
          value={roastProfileSearch}
          onChange={(e) => setRoastProfileSearch(e.target.value)}
          placeholder="Search profiles…"
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
            onClick={() => setRoastProfileListMode(option.id)}
            style={{
              padding: "7px 16px",
              borderRadius: "999px",
              border: "none",
              background: roastProfileListMode === option.id ? "rgba(200,137,58,0.18)" : "transparent",
              color: roastProfileListMode === option.id ? "#e4bf82" : "#bca385",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: roastProfileListMode === option.id ? 600 : 400,
              transition: "all 0.15s"
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {visibleRoastProfiles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#3a2a1a", fontSize: "13px" }}>
            {roastProfileListMode === "archived" ? "No archived roast presets yet." : "No active roast presets yet."}
          </div>
        ) : (
          visibleRoastProfiles.map((profile) => (
            <div
              key={profile.id}
              style={{
                background: profile.archived ? "rgba(200,137,58,0.05)" : "rgba(255,255,255,0.02)",
                border: profile.archived ? "1px solid rgba(200,137,58,0.34)" : "1px solid rgba(200,137,58,0.18)",
                borderRadius: "12px",
                padding: "16px 18px",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = profile.archived ? "rgba(200,137,58,0.08)" : "rgba(200,137,58,0.06)";
                e.currentTarget.style.borderColor = profile.archived ? "rgba(200,137,58,0.55)" : "rgba(200,137,58,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = profile.archived ? "rgba(200,137,58,0.05)" : "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = profile.archived ? "rgba(200,137,58,0.34)" : "rgba(200,137,58,0.18)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", marginBottom: "2px", lineHeight: 1.2 }}>{profile.name}</div>
                  <div style={{ fontSize: "11px", color: "#d0b69a", lineHeight: 1.3 }}>{profile.machine || "No machine set"}</div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    onClick={() => toggleArchiveRoastProfile(profile)}
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
                    aria-label={profile.archived ? "Move profile back to active" : "Archive profile"}
                    title={profile.archived ? "Move back to active" : "Archive profile"}
                  >
                    <span>{profile.archived ? "Archived" : "Active"}</span>
                    <span style={{
                      display: "inline-block",
                      width: "26px",
                      height: "14px",
                      borderRadius: "999px",
                      background: profile.archived ? "linear-gradient(135deg, rgba(200,137,58,0.7), rgba(160,104,40,0.9))" : "rgba(255,255,255,0.12)",
                      position: "relative",
                      boxShadow: profile.archived ? "0 0 0 1px rgba(200,137,58,0.4), 0 4px 10px rgba(160,104,40,0.25)" : "inset 0 0 0 1px rgba(255,255,255,0.06)"
                    }}>
                      <span style={{
                        position: "absolute",
                        top: "2px",
                        left: profile.archived ? "14px" : "2px",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "#f5f0e7",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.28)"
                      }} />
                    </span>
                  </button>
                  <button onClick={() => editRoastProfile(profile)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", padding: "5px 10px", fontSize: "12px" }}>Edit</button>
                  <button onClick={() => deleteRoastProfile(profile.id)} style={{ background: "none", border: "1px solid rgba(200,50,50,0.2)", borderRadius: "7px", color: "#8a4a4a", cursor: "pointer", padding: "5px 10px", fontSize: "12px" }}>Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
