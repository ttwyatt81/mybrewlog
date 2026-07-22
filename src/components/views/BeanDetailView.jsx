import Tag from "../ui/Tag";

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
  const filteredTechniqueLines = (brew) =>
    getTechniqueLinesFromBrew(brew).filter((line, index) => {
      if (index !== 0) return true;
      return !String(line?.text || "").includes(" pours · ");
    });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <button onClick={() => setView("beans")} style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", padding: 0 }}>← All Beans</button>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { setEditBean({ ...liveBean }); setView("beanForm"); }} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#9a7a5a", cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}>Edit</button>
          <button onClick={() => deleteBean(liveBean.id)} style={{ background: "none", border: "1px solid rgba(200,50,50,0.2)", borderRadius: "7px", color: "#8a4a4a", cursor: "pointer", padding: "6px 12px", fontSize: "12px" }}>Delete</button>
        </div>
      </div>

      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", marginBottom: "4px" }}>{liveBean.name}</div>
      <div style={{ fontSize: "13px", color: "#7a6050", marginBottom: "10px" }}>{[liveBean.roaster, liveBean.origin, liveBean.region].filter(Boolean).join(" · ")}</div>
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
        {liveBean.type && <Tag>{liveBean.type}</Tag>}
        {liveBean.roastLevel && <Tag>{liveBean.roastLevel}</Tag>}
        {liveBean.process && <Tag>{liveBean.process}</Tag>}
        {liveBean.varietal && <Tag>{liveBean.varietal}</Tag>}
        {liveBean.altitude && <Tag>{liveBean.altitude}</Tag>}
        {liveBean.roastDate && <span style={{ fontSize: "11px", color: "#6a5040" }}>Roasted {new Date(liveBean.roastDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
      </div>

      {liveBean.notes && (
        <div style={{ marginBottom: "20px", fontSize: "13px", color: "#7a6050", fontStyle: "italic", lineHeight: 1.6, borderLeft: "2px solid rgba(200,137,58,0.22)", paddingLeft: "12px" }}>{liveBean.notes}</div>
      )}

      <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#9a7a5a", textTransform: "uppercase", marginBottom: "12px" }}>
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
                  <span style={{ fontSize: "11px", color: "#4a3a2a" }}>{brew.date}</span>
                </div>
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <button onClick={() => editBrew(brew, liveBean)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#9a7a5a", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>Edit</button>
                  <button onClick={() => copyBrewToRecipe(brew)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#9a7a5a", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>→ Recipe</button>
                  <button onClick={() => deleteBrew(brew.id)} style={{ background: "none", border: "none", color: "#3a2a1a", cursor: "pointer", fontSize: "14px", padding: "0 4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#3a2a1a")}>✕</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                {brew.method && <Tag>{brew.method}</Tag>}
                {brew.brewer && <Tag>{brew.brewer}</Tag>}
                {brew.filterPaper && <Tag>{brew.filterPaper}</Tag>}
                {brew.recipeSource && brew.recipeSource !== "Manual" && (
                  <span style={{ fontSize: "11px", color: "#7a9a7a", background: "rgba(100,160,100,0.08)", padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.03em" }}>
                    {brew.recipeSource}{brew.recipeName ? `: ${brew.recipeName}` : ""}
                  </span>
                )}
              </div>

              {(brew.method === "Pour Over" || brew.method === "Espresso") && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" }}>
                  {(brew.method === "Pour Over" ? [
                    { l: "Dose", v: brew.dose ? `${brew.dose}g` : null },
                    { l: "Water", v: brew.water ? `${brew.water}g` : null },
                    { l: "Ratio", v: calcRatio(brew.dose, brew.water) ? `1:${calcRatio(brew.dose, brew.water)}` : null },
                    { l: "Temp", v: brew.temperature ? `${brew.temperature}°C` : null },
                    { l: "Grind", v: brew.grindSize || null },
                    { l: "Time", v: brew.totalTime || null },
                    { l: "Bloom", v: brew.bloomWater ? `${brew.bloomWater}g` : null },
                    { l: "Bloom ×", v: bloomRatio(brew.bloomWater, brew.dose) ? `×${bloomRatio(brew.bloomWater, brew.dose)}` : null },
                    { l: "# Pours", v: brew.numPours || null },
                  ] : [
                    ...(brew.shotYield || brew.water ? [{ l: "Shot Yield", v: `${brew.shotYield || brew.water}g` }] : []),
                    { l: "Dose", v: brew.dose ? `${brew.dose}g` : null },
                    { l: "Ratio", v: calcRatio(brew.dose, brew.shotYield || brew.water) ? `1:${calcRatio(brew.dose, brew.shotYield || brew.water)}` : null },
                    { l: "Temp", v: brew.temperature ? `${brew.temperature}°C` : null },
                    { l: "Grind", v: brew.grindSize || null },
                    { l: "Pre-Infusion", v: brew.preInfusionTime ? `${brew.preInfusionTime}s` : null },
                    { l: "Pre-Infusion Bar", v: brew.preInfusionBar ? `${brew.preInfusionBar} bar` : null },
                    { l: "Max Pressure", v: brew.maxPressureBar ? `${brew.maxPressureBar} bar` : null },
                    { l: "Max Pressure Until", v: brew.maxPressureUntilG ? `${brew.maxPressureUntilG}g` : null },
                    { l: "Finish Pressure", v: brew.finishPressureBar ? `${brew.finishPressureBar} bar` : null },
                    { l: "Time", v: brew.brewTime ? `${brew.brewTime}s` : null },
                    { l: "Machine", v: brew.machine || null },
                    { l: "Grinder", v: brew.grinder || null },
                    { l: "Pre-heat", v: brew.preHeat || null },
                  ]).filter((x) => x.v).map((x) => (
                    <div key={x.l} style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{x.v}</div>
                      <div style={{ fontSize: "9px", color: "#5a4030", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              )}

              {filteredTechniqueLines(brew).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#8a7050", lineHeight: 1.6, marginBottom: "7px", borderLeft: "2px solid rgba(200,137,58,0.2)", paddingLeft: "10px" }}>
                  {filteredTechniqueLines(brew).map((line, idx) => (
                    <div key={`${line.text}-${idx}`}>{line.text}</div>
                  ))}
                </div>
              )}
              {brew.tastingNotes && (
                <div style={{ fontSize: "12px", color: "#6a5a40", fontStyle: "italic", lineHeight: 1.6 }}>{`"${brew.tastingNotes}"`}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
