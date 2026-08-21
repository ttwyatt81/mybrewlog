import BrewLogCardContent from "../BrewLogCardContent";

const formatDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function BrewLogSection({
  brews,
  liveBean,
  StarRating,
  editBrew,
  copyBrewToRecipe,
  deleteBrew,
  calcRatio,
  bloomRatio,
  getTechniqueLinesFromBrew,
}) {
  return (
    <>
      <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#d4bca0", textTransform: "uppercase", marginBottom: "12px" }}>
        Brew Log · {brews.length} session{brews.length !== 1 ? "s" : ""}
      </div>

      {brews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "36px 0", color: "#3a2a1a", fontSize: "13px" }}>No brews yet — hit "+ Log Brew" to start dialling in</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {brews.map((brew, i) => (
            <div key={brew.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "11px", padding: "15px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", color: "#c8893a" }}>#{brews.length - i}</span>
                  <StarRating value={brew.rating} size={13} />
                  <span style={{ fontSize: "11px", color: "#c1a88c" }}>{formatDateValue(brew.date)}</span>
                </div>
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <button onClick={() => copyBrewToRecipe(brew)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#d4bca0", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>→ Recipe</button>
                  <button
                    onClick={() => editBrew(brew, liveBean)}
                    style={{ background: "none", border: "none", color: "#3a2a1a", cursor: "pointer", fontSize: "14px", padding: "0 2px", display: "inline-flex", alignItems: "center", gap: "0px", overflow: "hidden", minWidth: "46px", justifyContent: "flex-start", transition: "color 0.15s ease" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#c8893a";
                      const icon = e.currentTarget.querySelector('[data-role="edit-icon"]');
                      const label = e.currentTarget.querySelector('[data-role="edit-label"]');
                      if (icon) icon.style.transform = "translateX(1px)";
                      if (label) label.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#3a2a1a";
                      const icon = e.currentTarget.querySelector('[data-role="edit-icon"]');
                      const label = e.currentTarget.querySelector('[data-role="edit-label"]');
                      if (icon) icon.style.transform = "translateX(0)";
                      if (label) label.style.opacity = "0";
                    }}
                    aria-label={`Edit brew ${brew.id}`}
                  >
                    <span data-role="edit-label" style={{ fontSize: "11px", color: "#d4bca0", opacity: 0, width: "40px", overflow: "hidden", whiteSpace: "nowrap", transition: "opacity 0.15s ease" }}>Edit</span>
                    <span data-role="edit-icon" style={{ fontSize: "14px", lineHeight: "1", display: "inline-block", transition: "transform 0.15s ease" }}>✎</span>
                  </button>
                  <button onClick={() => deleteBrew(brew.id)} style={{ background: "none", border: "none", color: "#3a2a1a", cursor: "pointer", fontSize: "14px", padding: "0 4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#3a2a1a")}>✕</button>
                </div>
              </div>
              <BrewLogCardContent
                entry={brew}
                calcRatio={calcRatio}
                bloomRatio={bloomRatio}
                getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
