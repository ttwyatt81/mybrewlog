import { useState } from "react";

export default function RoastProfilesView({
  startNewRoastProfile,
  roastProfileListMode,
  setRoastProfileListMode,
  roastProfileSearch,
  setRoastProfileSearch,
  visibleRoastProfiles,
  greenBeans,
  roastedBeans,
  toggleArchiveRoastProfile,
  editRoastProfile,
  deleteRoastProfile,
}) {
  const [selectedProfile, setSelectedProfile] = useState(null);

  if (selectedProfile) {
    const profileName = (selectedProfile.name || "").trim().toLowerCase();
    const profileRoasts = (greenBeans || []).flatMap((greenBean) => (
      greenBean.roasts || []
    ).filter((roast) => (roast.profile || "").trim().toLowerCase() === profileName).map((roast) => {
      const roastedBean = (roastedBeans || []).find((bean) => bean.sourceRoastId === roast.id);
      const brews = roastedBean?.brews || [];
      const ratedBrews = brews.filter((brew) => Number(brew.rating) > 0);
      const averageRating = ratedBrews.length
        ? ratedBrews.reduce((total, brew) => total + Number(brew.rating), 0) / ratedBrews.length
        : null;

      return { greenBean, roast, brewCount: brews.length, averageRating };
    }));

    return (
      <div>
        <button onClick={() => setSelectedProfile(null)} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", marginBottom: "18px", padding: 0 }}>← Roast Profiles</button>
        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", letterSpacing: "0.02em", marginBottom: "4px" }}>{selectedProfile.name}</div>
          <div style={{ fontSize: "10px", color: "#c3aa90", letterSpacing: "0.18em", textTransform: "uppercase" }}>Roast overview</div>
        </div>

        {profileRoasts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#3a2a1a", fontSize: "13px" }}>No roasts logged with this profile yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(200,137,58,0.25)" }}>
                  {['The Green Bean', 'Roast duration level', 'Number of brews', 'Average rating'].map((heading) => (
                    <th key={heading} style={{ textAlign: "left", padding: "0 12px 10px 0", color: "#9a7a5a", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profileRoasts.map(({ greenBean, roast, brewCount, averageRating }) => (
                  <tr key={roast.id} style={{ borderBottom: "1px solid rgba(200,137,58,0.12)" }}>
                    <td style={{ padding: "13px 12px 13px 0", color: "#e0c9a8", fontSize: "13px" }}>{greenBean.name}</td>
                    <td style={{ padding: "13px 12px 13px 0", color: "#c9b094", fontSize: "13px" }}>{roast.roastLevel || "Not set"}</td>
                    <td style={{ padding: "13px 12px 13px 0", color: "#c9b094", fontSize: "13px" }}>{brewCount}</td>
                    <td style={{ padding: "13px 12px 13px 0", color: "#c9b094", fontSize: "13px" }}>{averageRating === null ? "Not rated" : averageRating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

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
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = profile.archived ? "rgba(200,137,58,0.08)" : "rgba(200,137,58,0.06)";
                e.currentTarget.style.borderColor = profile.archived ? "rgba(200,137,58,0.55)" : "rgba(200,137,58,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = profile.archived ? "rgba(200,137,58,0.05)" : "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = profile.archived ? "rgba(200,137,58,0.34)" : "rgba(200,137,58,0.18)";
              }}
              onClick={() => setSelectedProfile(profile)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", marginBottom: "2px", lineHeight: 1.2 }}>{profile.name}</div>
                  <div style={{ fontSize: "11px", color: "#d0b69a", lineHeight: 1.3 }}>{profile.machine || "No machine set"}</div>
                  <div style={{ fontSize: "10px", color: "#c1a88c", lineHeight: 1.2, marginTop: "4px" }}>
                    {profile.usageCount} roast{profile.usageCount !== 1 ? "s" : ""}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", position: "absolute", top: "16px", right: "18px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "6px", rowGap: "8px" }}>
                    <button
                      onClick={(event) => { event.stopPropagation(); toggleArchiveRoastProfile(profile); }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "none",
                        border: "none",
                        borderRadius: 0,
                        color: "#c1a88c",
                        padding: "0 2px",
                        cursor: "pointer",
                        fontSize: "10px",
                        lineHeight: 1,
                        height: "auto",
                        order: 3,
                        flexBasis: "100%",
                        justifyContent: "flex-end"
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
                  <button
                    onClick={(event) => { event.stopPropagation(); editRoastProfile(profile); }}
                    style={{ background: "none", border: "none", color: "#c9b094", cursor: "pointer", fontSize: "14px", padding: "0 2px", display: "inline-flex", alignItems: "center", gap: "0px", overflow: "hidden", minWidth: "46px", justifyContent: "flex-start", transition: "color 0.15s ease", order: 1 }}
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
                    aria-label={`Edit ${profile.name}`}
                  >
                    <span data-role="edit-label" style={{ fontSize: "11px", opacity: 0, width: "40px", overflow: "hidden", whiteSpace: "nowrap", transition: "opacity 0.15s ease" }}>Edit</span>
                    <span data-role="edit-icon" style={{ fontSize: "14px", lineHeight: "1", display: "inline-block", transition: "transform 0.15s ease" }}>✎</span>
                  </button>
                  <button onClick={(event) => { event.stopPropagation(); deleteRoastProfile(profile.id); }} style={{ background: "none", border: "none", color: "#c9b094", cursor: "pointer", fontSize: "14px", padding: "0 4px", order: 2 }} onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#c9b094")}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
