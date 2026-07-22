export default function BeanCard({
  bean,
  bestBrew,
  setActiveBean,
  setView,
  Tag
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
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(200,137,58,0.18)",
        borderRadius: "12px",
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.18s"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "rgba(200,137,58,0.06)";
        e.currentTarget.style.borderColor = "rgba(200,137,58,0.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
        e.currentTarget.style.borderColor = "rgba(200,137,58,0.18)";
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start"
      }}>
        <div>
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
            {[bean.roaster, bean.origin, bean.producer, bean.region]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        <div style={{
          textAlign: "right",
          flexShrink: 0,
          marginLeft: "12px"
        }}>
          {best?.rating > 0 && (
            <div style={{
              fontSize: "12px",
              color: "#c8893a"
            }}>
              {"★".repeat(best.rating)}
            </div>
          )}

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
          <span style={{
            fontSize: "11px",
            color: "#c9b094",
            marginLeft: "2px"
          }}>
            Roasted{" "}
            {new Date(bean.roastDate).toLocaleDateString(
              "en-GB",
              {
                day: "numeric",
                month: "short",
                year: "numeric"
              }
            )}
          </span>
        )}
      </div>
    </div>
  );
}
