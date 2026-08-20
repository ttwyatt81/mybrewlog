import Tag from "../ui/Tag";
import BrewLogCardContent from "../BrewLogCardContent";

export default function BeanDetailView({
  liveBean,
  setEditBean,
  setView,
  isGreenBeanSheet = false,
  deleteBean,
  editBrew,
  copyBrewToRecipe,
  deleteBrew,
  calcRatio,
  bloomRatio,
  getTechniqueLinesFromBrew,
  StarRating,
  onToggleArchive,
  onLogRoast,
  onEditRoast,
  onDeleteRoast,
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <button onClick={() => setView("beans")} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", padding: 0 }}>← {isGreenBeanSheet ? "All Green Beans" : "All Roasted Beans"}</button>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {isGreenBeanSheet && (
            <button onClick={onLogRoast} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}>+ Roast</button>
          )}
          <button onClick={() => { setEditBean({ ...liveBean }); setView("beanForm"); }} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}>Edit</button>
          <button onClick={() => deleteBean(liveBean.id)} style={{ background: "none", border: "1px solid rgba(200,50,50,0.2)", borderRadius: "7px", color: "#8a4a4a", cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}>Delete</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{liveBean.name}</span>
          {liveBean.archived && (
            <span style={{
              padding: "4px 8px",
              borderRadius: "999px",
              background: "rgba(200,137,58,0.18)",
              border: "1px solid rgba(200,137,58,0.28)",
              color: "#d8b98c",
              fontSize: "9px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600
            }}>
              Archived
            </span>
          )}
        </div>
        <button
          onClick={() => onToggleArchive?.(liveBean)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(200,137,58,0.2)",
            borderRadius: "999px",
            color: "#d9b98a",
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: "11px"
          }}
        >
          <span>{liveBean.archived ? "Archived" : "Active"}</span>
          <span style={{
            display: "inline-block",
            width: "28px",
            height: "16px",
            borderRadius: "999px",
            background: liveBean.archived ? "linear-gradient(135deg, rgba(200,137,58,0.7), rgba(160,104,40,0.9))" : "rgba(255,255,255,0.12)",
            position: "relative",
            boxShadow: liveBean.archived ? "0 0 0 1px rgba(200,137,58,0.4), 0 4px 10px rgba(160,104,40,0.25)" : "inset 0 0 0 1px rgba(255,255,255,0.06)"
          }}>
            <span style={{
              position: "absolute",
              top: "2px",
              left: liveBean.archived ? "15px" : "2px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#f5f0e7",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.28)"
            }} />
          </span>
        </button>
      </div>
      <div style={{ fontSize: "13px", color: "#d0b69a", marginBottom: "10px" }}>{[liveBean.roaster, liveBean.producer, liveBean.origin, liveBean.region].filter(Boolean).join(" · ")}</div>
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
        {liveBean.type && <Tag>{liveBean.type}</Tag>}
        {liveBean.roastLevel && <Tag>{liveBean.roastLevel}</Tag>}
        {liveBean.process && <Tag>{liveBean.process}</Tag>}
        {liveBean.varietal && <Tag>{liveBean.varietal}</Tag>}
        {liveBean.altitude && <Tag>{liveBean.altitude}</Tag>}
        {liveBean.roastDate && <Tag>{`Roasted ${new Date(liveBean.roastDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}</Tag>}
      </div>

      {liveBean.notes && (
        <div style={{ marginBottom: "20px", fontSize: "13px", color: "#d0b69a", fontStyle: "italic", lineHeight: 1.6, borderLeft: "2px solid rgba(200,137,58,0.22)", paddingLeft: "12px" }}>{liveBean.notes}</div>
      )}

      {isGreenBeanSheet ? (
        <>
          <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#d4bca0", textTransform: "uppercase", marginBottom: "12px" }}>
            Roast Log · {liveBean.roasts?.length || 0} roast{(liveBean.roasts?.length || 0) !== 1 ? "s" : ""}
          </div>

          {(liveBean.roasts?.length || 0) === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: "#3a2a1a", fontSize: "13px" }}>No roasts yet — hit "+ Roast" to log the first roast</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {liveBean.roasts.map((roast, i) => (
                <div key={roast.id || `${roast.date}-${i}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "11px", padding: "15px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", color: "#c8893a" }}>#{(liveBean.roasts?.length || 0) - i}</span>
                      <span style={{ fontSize: "11px", color: "#c1a88c" }}>{roast.date || "No date"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <button onClick={() => onEditRoast?.(roast)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#d4bca0", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>Edit</button>
                      <button onClick={() => onDeleteRoast?.(roast.id)} style={{ background: "none", border: "none", color: "#3a2a1a", cursor: "pointer", fontSize: "14px", padding: "0 4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#3a2a1a")}>✕</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {roast.profile && <span style={{ display: "inline-block", border: "1px solid rgba(200,137,58,0.18)", borderRadius: "999px", background: "rgba(255,255,255,0.02)", color: "#d0b69a", padding: "4px 8px", fontSize: "10px" }}>{roast.profile}</span>}
                    {roast.roastLevel && <span style={{ display: "inline-block", border: "1px solid rgba(200,137,58,0.18)", borderRadius: "999px", background: "rgba(200,137,58,0.07)", color: "#d8b98c", padding: "4px 8px", fontSize: "10px" }}>{roast.roastLevel}</span>}
                  </div>
                  {(roast.startWeight || roast.endWeight || roast.reductionPercent) && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px", fontSize: "11px", color: "#d0b69a" }}>
                      {roast.startWeight && <span>Start: {roast.startWeight}g</span>}
                      {roast.endWeight && <span>End: {roast.endWeight}g</span>}
                      {roast.reductionPercent && <span>Reduction: {roast.reductionPercent}%</span>}
                    </div>
                  )}
                  {roast.notes && <div style={{ fontSize: "12px", color: "#d0b69a", lineHeight: 1.6 }}>{roast.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#d4bca0", textTransform: "uppercase", marginBottom: "12px" }}>
            Brew Log · {liveBean.brews.length} session{liveBean.brews.length !== 1 ? "s" : ""}
          </div>

          {liveBean.brews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: "#3a2a1a", fontSize: "13px" }}>No brews yet — hit "+ Log Brew" to start dialling in</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {liveBean.brews.map((brew, i) => (
                <div key={brew.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "11px", padding: "15px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", color: "#c8893a" }}>#{liveBean.brews.length - i}</span>
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
      )}
    </div>
  );
}
