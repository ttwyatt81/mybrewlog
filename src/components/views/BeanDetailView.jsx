import Tag from "../ui/Tag";
import BrewLogCardContent from "../BrewLogCardContent";

export default function BeanDetailView({
  liveBean,
  setEditBean,
  setView,
  deleteBean,
  editBrew,
  copyBrewToRecipe,
  deleteBrew,
  calcRatio,
  bloomRatio,
  getTechniqueLinesFromBrew,
  StarRating,
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <button onClick={() => setView("beans")} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", padding: 0 }}>← All Beans</button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { setEditBean({ ...liveBean }); setView("beanForm"); }} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}>Edit</button>
          <button onClick={() => deleteBean(liveBean.id)} style={{ background: "none", border: "1px solid rgba(200,50,50,0.2)", borderRadius: "7px", color: "#8a4a4a", cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}>Delete</button>
        </div>
      </div>

      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", marginBottom: "4px" }}>{liveBean.name}</div>
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
    </div>
  );
}
