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
  greenBeans = [],
  roastedBeans = [],
  onGoToSourceRoast,
}) {
  const linkedRoast = !isGreenBeanSheet && liveBean.sourceRoastId
    ? greenBeans.flatMap((greenBean) => greenBean.roasts || []).find((roast) => roast.id === liveBean.sourceRoastId)
    : null;
  const editDeleteActions = (
    <div className="mbl-card-actions">
      <button className="mbl-link" onClick={() => { setEditBean({ ...liveBean }); setView("beanForm"); }} aria-label={`Edit ${liveBean.name}`}>Edit</button>
      <button className="mbl-link" onClick={() => deleteBean(liveBean.id)} aria-label={`Delete ${liveBean.name}`}>Delete</button>
    </div>
  );

  return (
    <div className="mbl-bean-detail">
      <div className="mbl-view-heading">
        <div className="mbl-detail-heading">
          <h1 className="mbl-title">{liveBean.name}</h1>
            {liveBean.archived && (
              <span className="mbl-tag">
                Archived
              </span>
            )}
        </div>
        {!isGreenBeanSheet && linkedRoast && (linkedRoast.roastProfileName || linkedRoast.roastLevel) && (
          <div className="mbl-card-profile">
            {[linkedRoast.roastProfileName, linkedRoast.roastLevel].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>

      <div className="mbl-detail-actions">
          {!isGreenBeanSheet && (
            <button className="mbl-btn mbl-btn--primary" onClick={onLogBrew}>
              + Log Brew
            </button>
          )}
          {isGreenBeanSheet && (
            <button className="mbl-btn mbl-btn--primary" onClick={onLogRoast}>
              + Log Roast
            </button>
          )}
          <button
            className="mbl-link mbl-detail-archive-action"
            onClick={() => onToggleArchive?.(liveBean)}
            aria-label={liveBean.archived ? `Move ${liveBean.name} back to active` : `Archive ${liveBean.name}`}
          >
            {liveBean.archived ? "Unarchive" : "Archive"}
          </button>
          {!isGreenBeanSheet && liveBean.sourceRoastId && onGoToSourceRoast && (
            <button
              onClick={() => onGoToSourceRoast(liveBean)}
              className="mbl-btn mbl-btn--quiet"
            >
              View Roast Log
            </button>
          )}
          {editDeleteActions}
      </div>

      <section className="mbl-detail-info" aria-label="Bean information">
        <div className="mbl-card-sub">{[liveBean.roaster, liveBean.producer, liveBean.origin, liveBean.region].filter(Boolean).join(" · ")}</div>
        <div className="mbl-card-tags">
        {!isGreenBeanSheet && <Tag>{liveBean.sourceRoastId ? "Self-roast" : "Commercial Roast"}</Tag>}
        {liveBean.type && <Tag>{liveBean.type}</Tag>}
        {!isGreenBeanSheet && !liveBean.sourceRoastId && liveBean.roastLevel && <Tag>{liveBean.roastLevel}</Tag>}
        {liveBean.process && <Tag>{liveBean.process}</Tag>}
        {liveBean.varietal && <Tag>{liveBean.varietal}</Tag>}
        {liveBean.altitude && <Tag>{liveBean.altitude}</Tag>}
        {liveBean.roastDate && <Tag>{`Roasted ${formatDateValue(liveBean.roastDate)}`}</Tag>}
        </div>

        {liveBean.notes && <p className="mbl-detail-notes">{liveBean.notes}</p>}
      </section>

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
