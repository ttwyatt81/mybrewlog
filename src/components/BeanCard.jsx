export default function BeanCard({
  bean,
  bestBrew,
  setActiveBean,
  setView,
  Tag,
  onToggleArchive,
}) {
  const best = Array.isArray(bean.brews) ? bestBrew(bean) : null;
  const brewCount = Array.isArray(bean.brews) ? bean.brews.length : 0;

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
      {bean.archived && (
        <div style={{
          position: "absolute",
          top: "10px",
          right: "12px",
          padding: "3px 8px",
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
        </div>
      )}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start"
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "17px",
            marginBottom: "3px"
          }}>
            {bean.name}
          </div>

          <div style={{
            fontSize: "12px",
            color: "#d0b69a"
          }}>
            {[bean.roaster, bean.producer, bean.origin, bean.region]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        <div style={{
          textAlign: "right",
          flexShrink: 0,
          marginLeft: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {best?.rating > 0 && (
              <div style={{
                fontSize: "12px",
                color: "#c8893a"
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
                position: "relative",
                width: "42px",
                height: "24px",
                borderRadius: "999px",
                border: "none",
                background: bean.archived ? "linear-gradient(135deg, rgba(200,137,58,0.7), rgba(160,104,40,0.9))" : "rgba(255,255,255,0.1)",
                cursor: "pointer",
                padding: 0,
                boxShadow: bean.archived ? "0 0 0 1px rgba(200,137,58,0.4), 0 4px 10px rgba(160,104,40,0.25)" : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                transition: "all 0.2s ease"
              }}
              aria-label={bean.archived ? "Move bean back to active" : "Archive bean"}
              title={bean.archived ? "Move back to active" : "Archive bean"}
            >
              <span style={{
                position: "absolute",
                top: "3px",
                left: bean.archived ? "22px" : "3px",
                width: "17px",
                height: "17px",
                borderRadius: "50%",
                background: "#f8f0e5",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.28)"
              }} />
            </button>
          </div>

          <div style={{
            fontSize: "11px",
            color: "#c1a88c",
            marginTop: "3px"
          }}>
            {brewCount} brew{brewCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: "10px",
        display: "flex",
        gap: "7px",
        flexWrap: "wrap"
      }}>
        {bean.type && <Tag>{bean.type}</Tag>}
        {bean.roastLevel && <Tag>{bean.roastLevel}</Tag>}
        {bean.process && <Tag>{bean.process}</Tag>}
        {bean.varietal && <Tag>{bean.varietal}</Tag>}
        {bean.altitude && <Tag>{bean.altitude}</Tag>}
        {bean.roastDate && (
          <Tag>
            Roasted {new Date(bean.roastDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })}
          </Tag>
        )}
      </div>
    </div>
  );
}
