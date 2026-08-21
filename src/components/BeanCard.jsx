const formatDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function BeanCard({
  bean,
  bestBrew,
  setActiveBean,
  setView,
  isGreenBeanSheet = false,
  Tag,
  onToggleArchive,
  onEditBean,
  onDeleteBean,
}) {
  const best = Array.isArray(bean.brews) ? bestBrew(bean) : null;
  const brewCount = Array.isArray(bean.brews) ? bean.brews.length : 0;
  const price = parseFloat(bean.price);
  const weightKg = parseFloat(bean.weightKg);
  const hasValidPricePerKg = Number.isFinite(price) && Number.isFinite(weightKg) && weightKg > 0;
  const pricePerKg = hasValidPricePerKg ? (price / weightKg) : null;

  return (
    <div
      onClick={() => {
        setActiveBean(bean);
        setView("beanDetail");
      }}
      style={{
        background: bean.archived ? "rgba(200,137,58,0.05)" : "rgba(255,255,255,0.02)",
        border: bean.archived ? "1px solid rgba(200,137,58,0.34)" : "1px solid rgba(200,137,58,0.18)",
        borderRadius: "12px",
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.18s",
        position: "relative"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = bean.archived ? "rgba(200,137,58,0.08)" : "rgba(200,137,58,0.06)";
        e.currentTarget.style.borderColor = bean.archived ? "rgba(200,137,58,0.55)" : "rgba(200,137,58,0.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = bean.archived ? "rgba(200,137,58,0.05)" : "rgba(255,255,255,0.02)";
        e.currentTarget.style.borderColor = bean.archived ? "rgba(200,137,58,0.34)" : "rgba(200,137,58,0.18)";
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "8px"
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "16px",
            marginBottom: "2px",
            lineHeight: 1.2
          }}>
            {bean.name}
          </div>

          <div style={{
            fontSize: "11px",
            color: "#d0b69a",
            lineHeight: 1.3
          }}>
            {[(isGreenBeanSheet ? null : bean.roaster), bean.producer, bean.origin, bean.region]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        <div style={{
          textAlign: "right",
          flexShrink: 0,
          marginLeft: "0px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "3px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
            {!isGreenBeanSheet && best?.rating > 0 && (
              <div style={{
                fontSize: "11px",
                color: "#c8893a",
                lineHeight: 1
              }}>
                {"★".repeat(best.rating)}
              </div>
            )}

            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleArchive?.(bean);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(200,137,58,0.2)",
                borderRadius: "999px",
                color: "#d9b98a",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "9px",
                lineHeight: 1,
                height: "22px"
              }}
              aria-label={bean.archived ? "Move bean back to active" : "Archive bean"}
              title={bean.archived ? "Move back to active" : "Archive bean"}
            >
              <span>{bean.archived ? "Archived" : "Active"}</span>
              <span style={{
                display: "inline-block",
                width: "26px",
                height: "14px",
                borderRadius: "999px",
                background: bean.archived ? "linear-gradient(135deg, rgba(200,137,58,0.7), rgba(160,104,40,0.9))" : "rgba(255,255,255,0.12)",
                position: "relative",
                boxShadow: bean.archived ? "0 0 0 1px rgba(200,137,58,0.4), 0 4px 10px rgba(160,104,40,0.25)" : "inset 0 0 0 1px rgba(255,255,255,0.06)"
              }}>
                <span style={{
                  position: "absolute",
                  top: "2px",
                  left: bean.archived ? "14px" : "2px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#f5f0e7",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.28)"
                }} />
              </span>
            </button>

            {!isGreenBeanSheet && (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditBean?.(bean);
                  }}
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
                  aria-label={`Edit ${bean.name}`}
                >
                  <span data-role="edit-label" style={{ fontSize: "11px", color: "#d4bca0", opacity: 0, width: "40px", overflow: "hidden", whiteSpace: "nowrap", transition: "opacity 0.15s ease" }}>Edit</span>
                  <span data-role="edit-icon" style={{ fontSize: "14px", lineHeight: "1", display: "inline-block", transition: "transform 0.15s ease" }}>✎</span>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteBean?.(bean.id);
                  }}
                  style={{ background: "none", border: "none", color: "#3a2a1a", cursor: "pointer", fontSize: "14px", padding: "0 4px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#3a2a1a")}
                  aria-label={`Delete ${bean.name}`}
                >
                  ✕
                </button>
              </>
            )}

            {isGreenBeanSheet && (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditBean?.(bean);
                  }}
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
                  aria-label={`Edit ${bean.name}`}
                >
                  <span data-role="edit-label" style={{ fontSize: "11px", color: "#d4bca0", opacity: 0, width: "40px", overflow: "hidden", whiteSpace: "nowrap", transition: "opacity 0.15s ease" }}>Edit</span>
                  <span data-role="edit-icon" style={{ fontSize: "14px", lineHeight: "1", display: "inline-block", transition: "transform 0.15s ease" }}>✎</span>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteBean?.(bean.id);
                  }}
                  style={{ background: "none", border: "none", color: "#3a2a1a", cursor: "pointer", fontSize: "14px", padding: "0 4px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#3a2a1a")}
                >
                  ✕
                </button>
              </>
            )}
          </div>

          <div style={{
            fontSize: "10px",
            color: "#c1a88c",
            marginTop: "0px",
            lineHeight: 1.2
          }}>
            {isGreenBeanSheet
              ? (pricePerKg !== null ? `${pricePerKg.toFixed(2)} / kg` : "Add price + weight")
              : `${brewCount} brew${brewCount !== 1 ? "s" : ""}`}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: "10px",
        display: "flex",
        gap: "7px",
        flexWrap: "wrap"
      }}>
        {!isGreenBeanSheet && bean.type && <Tag>{bean.type}</Tag>}
        {!isGreenBeanSheet && bean.roastLevel && <Tag>{bean.roastLevel}</Tag>}
        {bean.process && <Tag>{bean.process}</Tag>}
        {bean.varietal && <Tag>{bean.varietal}</Tag>}
        {bean.altitude && <Tag>{bean.altitude}</Tag>}
        {!isGreenBeanSheet && bean.roastDate && (
          <Tag>
            Roasted {formatDateValue(bean.roastDate)}
          </Tag>
        )}
      </div>
    </div>
  );
}
