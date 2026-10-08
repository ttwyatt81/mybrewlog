import { coffeeAccent } from "../styles/theme";

const formatDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// "Various" is a placeholder, so the overview hides it; stored data is untouched.
const meaningful = (value) => {
  const text = String(value ?? "").trim();
  return text && text.toLowerCase() !== "various" ? text : "";
};

const formatRoastLevel = (value) => {
  const text = meaningful(value);
  return /^\d+(\.\d+)?$/.test(text) ? `L${text}` : text;
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
  greenBeans = [],
}) {
  const best = Array.isArray(bean.brews) ? bestBrew(bean) : null;
  const brewCount = Array.isArray(bean.brews) ? bean.brews.length : 0;
  const roastCount = Array.isArray(bean.roasts) ? bean.roasts.length : 0;
  const price = parseFloat(bean.purchasePrice);
  const weightKg = parseFloat(bean.purchaseWeightKg);
  const hasValidPricePerKg = Number.isFinite(price) && Number.isFinite(weightKg) && weightKg > 0;
  const pricePerKg = hasValidPricePerKg ? (price / weightKg) : null;
  const linkedRoast = !isGreenBeanSheet && bean.sourceRoastId
    ? greenBeans.flatMap((greenBean) => greenBean.roasts || []).find((roast) => roast.id === bean.sourceRoastId)
    : null;

  const profileName = meaningful(linkedRoast?.roastProfileName);
  const linkedLevel = formatRoastLevel(linkedRoast?.roastLevel);
  const originLine = [(isGreenBeanSheet ? null : bean.roaster), bean.producer, bean.origin, bean.region]
    .map(meaningful).filter(Boolean).join(" · ");
  const roastDate = formatDateValue(bean.roastDate);

  const openBean = () => {
    setActiveBean(bean);
    setView("beanDetail");
  };
  const act = (handler) => (event) => {
    event.stopPropagation();
    handler?.();
  };

  return (
    <article
      className={`mbl-card${bean.archived ? " mbl-card--archived" : ""}`}
      style={{ "--mbl-accent": coffeeAccent(bean.id ?? bean.name) }}
      onClick={openBean}
    >
      <div className="mbl-card-head">
        <h2 className="mbl-card-name"><button className="mbl-card-open">{bean.name}</button></h2>
        <div className="mbl-card-actions">
          <button className="mbl-link" onClick={act(() => onToggleArchive?.(bean))} aria-label={bean.archived ? `Move ${bean.name} back to active` : `Archive ${bean.name}`}>
            {bean.archived ? "Unarchive" : "Archive"}
          </button>
          <button className="mbl-link" onClick={act(() => onEditBean?.(bean))} aria-label={`Edit ${bean.name}`}>Edit</button>
          <button className="mbl-link" onClick={act(() => onDeleteBean?.(bean.id))} aria-label={`Delete ${bean.name}`}>Delete</button>
        </div>
      </div>

      {(profileName || linkedLevel) && (
        <div className="mbl-card-profile">
          {profileName}
          {profileName && linkedLevel && " · "}
          {linkedLevel && <strong>{linkedLevel}</strong>}
        </div>
      )}
      {originLine && <div className="mbl-card-sub">{originLine}</div>}

      <div className="mbl-card-tags">
        {!isGreenBeanSheet && <Tag>{bean.sourceRoastId ? "Self-roasted" : "Commercially roasted"}</Tag>}
        {!isGreenBeanSheet && meaningful(bean.type) && <Tag>{meaningful(bean.type)}</Tag>}
        {!isGreenBeanSheet && !bean.sourceRoastId && formatRoastLevel(bean.roastLevel) && <Tag>{formatRoastLevel(bean.roastLevel)}</Tag>}
        {meaningful(bean.process) && <Tag>{meaningful(bean.process)}</Tag>}
        {meaningful(bean.varietal) && <Tag>{meaningful(bean.varietal)}</Tag>}
        {meaningful(bean.altitude) && <Tag>{meaningful(bean.altitude)}</Tag>}
        {isGreenBeanSheet && <Tag>{pricePerKg !== null ? `${pricePerKg.toFixed(2)} / kg` : "Add price + weight"}</Tag>}
      </div>

      {isGreenBeanSheet ? (
        <div className="mbl-card-meta">{roastCount} roast{roastCount !== 1 ? "s" : ""}</div>
      ) : (
        <>
          <div className="mbl-card-meta">
            {brewCount} brew{brewCount !== 1 ? "s" : ""}
            {best?.rating > 0 && <span aria-label={`${best.rating} stars`} style={{ marginLeft: "10px", color: "var(--mbl-ink)" }}>{"★".repeat(best.rating)}</span>}
          </div>
          {roastDate && <div className="mbl-card-date">Roasted {roastDate}</div>}
        </>
      )}
    </article>
  );
}
