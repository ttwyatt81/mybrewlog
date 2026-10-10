import BrewLogCardContent from "../BrewLogCardContent";

const formatDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function BrewLogSection({
  brews,
  liveBean,
  StarRating,
  editBrew,
  copyBrewToRecipe,
  deleteBrew,
  calcRatio,
  bloomRatio,
  getTechniqueLinesFromBrew,
}) {
  return (
    <section className="mbl-log-section mbl-brew-log-section">
      <div className="mbl-log-heading">
        Brew Log · {brews.length} session{brews.length !== 1 ? "s" : ""}
      </div>

      {brews.length === 0 ? (
        <div className="mbl-empty"><p>No brews yet — hit "+ Log Brew" to start dialling in</p></div>
      ) : (
        <div className="mbl-log-list">
          {brews.map((brew, i) => (
            <article className="mbl-log-card" key={brew.id}>
              <div className="mbl-log-card-head">
                <div className="mbl-log-card-identity">
                  <span className="mbl-log-number">#{brews.length - i}</span>
                  <StarRating value={brew.rating} size={13} />
                  <span className="mbl-log-meta">{formatDateValue(brew.date)}</span>
                </div>
                <div className="mbl-log-card-actions">
                  <button className="mbl-btn mbl-btn--quiet" onClick={() => copyBrewToRecipe(brew)}>→ Recipe</button>
                  <button className="mbl-link" onClick={() => editBrew(brew, liveBean)} aria-label={`Edit brew ${brew.id}`}>Edit</button>
                  <button className="mbl-link" onClick={() => deleteBrew(brew.id)} aria-label={`Delete brew ${brew.id}`}>Delete</button>
                </div>
              </div>
              <BrewLogCardContent
                entry={brew}
                calcRatio={calcRatio}
                bloomRatio={bloomRatio}
                getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
                recipeOverview
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
