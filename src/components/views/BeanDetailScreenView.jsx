import Tag from "../ui/Tag";
import RoastLogSection from "../beanDetail/RoastLogSection";
import BrewLogSection from "../beanDetail/BrewLogSection";

const formatDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function BeanDetailScreenView({
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
        {liveBean.roastDate && <Tag>{`Roasted ${formatDateValue(liveBean.roastDate)}`}</Tag>}
      </div>

      {liveBean.notes && (
        <div style={{ marginBottom: "20px", fontSize: "13px", color: "#d0b69a", fontStyle: "italic", lineHeight: 1.6, borderLeft: "2px solid rgba(200,137,58,0.22)", paddingLeft: "12px" }}>{liveBean.notes}</div>
      )}

      {isGreenBeanSheet ? (
        <RoastLogSection
          roasts={liveBean.roasts || []}
          onEditRoast={onEditRoast}
          onDeleteRoast={onDeleteRoast}
        />
      ) : (
        <BrewLogSection
          brews={liveBean.brews}
          liveBean={liveBean}
          StarRating={StarRating}
          editBrew={editBrew}
          copyBrewToRecipe={copyBrewToRecipe}
          deleteBrew={deleteBrew}
          calcRatio={calcRatio}
          bloomRatio={bloomRatio}
          getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
        />
      )}
    </div>
  );
}
