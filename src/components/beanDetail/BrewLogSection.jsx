import BrewLogCardContent from "../BrewLogCardContent";

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
                  <span style={{ fontSize: "11px", color: "#c1a88c" }}>{brew.date}</span>
                </div>
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <button onClick={() => editBrew(brew, liveBean)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#d4bca0", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>Edit</button>
                  <button onClick={() => copyBrewToRecipe(brew)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#d4bca0", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>→ Recipe</button>
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
