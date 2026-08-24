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
  onLogBrew,
  onLogRoast,
  onEditRoast,
  onDeleteRoast,
  onExportRoast,
  roastedBeans = [],
  onGoToSourceRoast,
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <button onClick={() => setView("beans")} style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", padding: 0 }}>← {isGreenBeanSheet ? "All Green Beans" : "All Roasted Beans"}</button>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {liveBean.sourceRoastId && onGoToSourceRoast && (
            <button
              onClick={() => onGoToSourceRoast(liveBean)}
              style={{ background: "rgba(200,137,58,0.08)", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "999px", color: "#d8b98c", cursor: "pointer", fontSize: "11px", padding: "6px 10px", whiteSpace: "nowrap" }}
            >
              View Roast Log
            </button>
          )}
          <button
            onClick={() => { setEditBean({ ...liveBean }); setView("beanForm"); }}
            style={{ background: "none", border: "none", color: "#c9b094", cursor: "pointer", fontSize: "14px", padding: "0 2px", display: "inline-flex", alignItems: "center", gap: "0px", overflow: "hidden", minWidth: "46px", justifyContent: "flex-start", transition: "color 0.15s ease" }}
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
            aria-label={`Edit ${liveBean.name}`}
          >
            <span data-role="edit-label" style={{ fontSize: "11px", opacity: 0, width: "40px", overflow: "hidden", whiteSpace: "nowrap", transition: "opacity 0.15s ease" }}>Edit</span>
            <span data-role="edit-icon" style={{ fontSize: "14px", lineHeight: "1", display: "inline-block", transition: "transform 0.15s ease" }}>✎</span>
          </button>
          <button onClick={() => deleteBean(liveBean.id)} style={{ background: "none", border: "none", color: "#c9b094", cursor: "pointer", fontSize: "14px", padding: "0 4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#c9b094")}>✕</button>
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isGreenBeanSheet && (
            <button onClick={onLogBrew} style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "7px 13px", fontSize: "12px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
              + Log Brew
            </button>
          )}
          {isGreenBeanSheet && (
            <button onClick={onLogRoast} style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "7px 13px", fontSize: "12px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
              + Log Roast
            </button>
          )}
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
      </div>

      <div style={{ fontSize: "13px", color: "#d0b69a", marginBottom: "10px" }}>{[liveBean.roaster, liveBean.producer, liveBean.origin, liveBean.region].filter(Boolean).join(" · ")}</div>
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
        {!isGreenBeanSheet && <Tag>{liveBean.sourceRoastId ? "Self-roast" : "Commercial Roast"}</Tag>}
        {liveBean.type && <Tag>{liveBean.type}</Tag>}
        {!isGreenBeanSheet && !liveBean.sourceRoastId && liveBean.roastLevel && <Tag>{liveBean.roastLevel}</Tag>}
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
          roastedBeans={roastedBeans}
          onEditRoast={onEditRoast}
          onDeleteRoast={onDeleteRoast}
          onExportRoast={onExportRoast}
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
