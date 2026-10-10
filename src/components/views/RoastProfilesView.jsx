export default function RoastProfilesView({
  startNewRoastProfile,
  roastProfileListMode,
  setRoastProfileListMode,
  roastProfileSearch,
  setRoastProfileSearch,
  visibleRoastProfiles,
  greenBeans,
  roastedBeans,
  selectedProfile,
  setSelectedProfile,
  toggleArchiveRoastProfile,
  editRoastProfile,
  deleteRoastProfile,
}) {
  if (selectedProfile) {
    const profileRoasts = (greenBeans || []).flatMap((greenBean) => (
      greenBean.roasts || []
    ).filter((roast) => roast.roastProfileId === selectedProfile.id).map((roast) => {
      const roastedBean = (roastedBeans || []).find((bean) => bean.sourceRoastId === roast.id);
      const brews = roastedBean?.brews || [];
      const ratedBrews = brews.filter((brew) => Number(brew.rating) > 0);
      const averageRating = ratedBrews.length
        ? ratedBrews.reduce((total, brew) => total + Number(brew.rating), 0) / ratedBrews.length
        : null;

      return { greenBean, roast, brewCount: brews.length, averageRating };
    }));

    return (
      <div className="mbl-roast-overview">
        <div className="mbl-view-heading">
          <h1 className="mbl-title">{selectedProfile.name}</h1>
          <div className="mbl-label">Roast overview</div>
        </div>

        {profileRoasts.length === 0 ? (
          <div className="mbl-empty">No roasts logged with this profile yet.</div>
        ) : (
          <div className="mbl-profile-table-scroll">
            <table className="mbl-profile-table">
              <thead>
                <tr>
                  {['The Green Bean', 'Roast duration level', 'Number of brews', 'Average rating'].map((heading) => (
                    <th key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profileRoasts.map(({ greenBean, roast, brewCount, averageRating }) => (
                  <tr key={roast.id}>
                    <td>{greenBean.name}</td>
                    <td>{roast.roastLevel || "Not set"}</td>
                    <td>{brewCount}</td>
                    <td>{averageRating === null ? "Not rated" : averageRating.toFixed(1)}</td>
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
      <div className="mbl-view-heading">
        <h1 className="mbl-title">Roast Profiles</h1>
        <div className="mbl-label">Saved roast profiles</div>
      </div>

      <div className="mbl-row mbl-actions-row">
        <button className="mbl-btn mbl-btn--primary" onClick={startNewRoastProfile}>+ New Profile</button>
        <div className="mbl-segment" role="group" aria-label="Roast profile list">
          {[
            { id: "active", label: "Active" },
            { id: "archived", label: "Archived" }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setRoastProfileListMode(option.id)}
              aria-pressed={roastProfileListMode === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mbl-row mbl-filter-row mbl-filter-row--single" style={{ marginBottom: "16px" }}>
        <input
          className="mbl-field mbl-field--search"
          value={roastProfileSearch}
          onChange={(e) => setRoastProfileSearch(e.target.value)}
          placeholder="Search profiles…"
          aria-label="Search roast profiles"
        />
      </div>

      <div className="mbl-cards">
        {visibleRoastProfiles.length === 0 ? (
          <div className="mbl-empty">
            {roastProfileListMode === "archived" ? "No archived roast presets yet." : "No active roast presets yet."}
          </div>
        ) : (
          visibleRoastProfiles.map((profile) => (
            <div
              key={profile.id}
              className={`mbl-card${profile.archived ? " mbl-card--archived" : ""}`}
              style={{ "--mbl-accent": "var(--mbl-section)" }}
              onClick={() => setSelectedProfile(profile)}
            >
              <div className="mbl-card-head">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 className="mbl-card-name"><button className="mbl-card-title-button">{profile.name}</button></h2>
                  <div className="mbl-card-sub">{profile.machine || "No machine set"}</div>
                  <div className="mbl-profile-usage">
                    {profile.usageCount} roast{profile.usageCount !== 1 ? "s" : ""}
                  </div>
                </div>

                <div className="mbl-card-actions">
                  <button className="mbl-link" onClick={(event) => { event.stopPropagation(); toggleArchiveRoastProfile(profile); }} aria-label={profile.archived ? "Move profile back to active" : "Archive profile"}>{profile.archived ? "Unarchive" : "Archive"}</button>
                  <button className="mbl-link" onClick={(event) => { event.stopPropagation(); editRoastProfile(profile); }} aria-label={`Edit ${profile.name}`}>Edit</button>
                  <button className="mbl-link" onClick={(event) => { event.stopPropagation(); deleteRoastProfile(profile.id); }} aria-label={`Delete ${profile.name}`}>Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
