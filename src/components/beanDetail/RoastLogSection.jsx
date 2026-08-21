export default function RoastLogSection({
  roasts,
  onEditRoast,
  onDeleteRoast,
}) {
  const roastCount = roasts?.length || 0;

  return (
    <>
      <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#d4bca0", textTransform: "uppercase", marginBottom: "12px" }}>
        Roast Log · {roastCount} roast{roastCount !== 1 ? "s" : ""}
      </div>

      {roastCount === 0 ? (
        <div style={{ textAlign: "center", padding: "36px 0", color: "#3a2a1a", fontSize: "13px" }}>No roasts yet — hit "+ Roast" to log the first roast</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {roasts.map((roast, i) => (
            <div key={roast.id || `${roast.date}-${i}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "11px", padding: "15px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", color: "#c8893a" }}>#{roastCount - i}</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", color: "#e4cfb1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {roast.profile || "Untitled Profile"}
                  </span>
                  <span style={{ fontSize: "11px", color: "#c1a88c" }}>{roast.date || "No date"}</span>
                </div>
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <button onClick={() => onEditRoast?.(roast)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#d4bca0", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>Edit</button>
                  <button onClick={() => onDeleteRoast?.(roast.id)} style={{ background: "none", border: "none", color: "#3a2a1a", cursor: "pointer", fontSize: "14px", padding: "0 4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#3a2a1a")}>✕</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: roast.startWeight || roast.endWeight || roast.reductionPercent || roast.notes ? "10px" : "0" }}>
                {roast.roastLevel && <span style={{ display: "inline-block", border: "1px solid rgba(200,137,58,0.18)", borderRadius: "999px", background: "rgba(200,137,58,0.07)", color: "#d8b98c", padding: "4px 8px", fontSize: "10px" }}>{roast.roastLevel}</span>}
              </div>
              {(roast.startWeight || roast.endWeight || roast.reductionPercent) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: roast.notes ? "10px" : "0" }}>
                  {roast.startWeight && (
                    <div style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{roast.startWeight}g</div>
                      <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Start</div>
                    </div>
                  )}
                  {roast.endWeight && (
                    <div style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{roast.endWeight}g</div>
                      <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>End</div>
                    </div>
                  )}
                  {roast.reductionPercent && (
                    <div style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{roast.reductionPercent}%</div>
                      <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Reduction</div>
                    </div>
                  )}
                </div>
              )}
              {roast.notes && <div style={{ fontSize: "12px", color: "#ccb294", fontStyle: "italic", lineHeight: 1.6 }}>{`"${roast.notes}"`}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
