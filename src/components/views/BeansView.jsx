import BeanCard from "../BeanCard";
import { defaultBean } from "../../lib/constants";

function splitErrorMessage(errorText) {
  const text = String(errorText || "").trim();
  if (!text) return { friendly: "", technical: "" };

  const httpMatch = text.match(/\[HTTP\s+\d+\]/i);
  if (!httpMatch || typeof httpMatch.index !== "number") {
    return { friendly: text, technical: "" };
  }

  const httpIndex = httpMatch.index;
  const beforeHttp = text.slice(0, httpIndex).trim();
  const httpDetail = text.slice(httpIndex).trim();
  const lastSentenceBreak = beforeHttp.lastIndexOf(". ");

  if (lastSentenceBreak < 0) {
    return { friendly: beforeHttp || text, technical: httpDetail };
  }

  const friendly = beforeHttp.slice(0, lastSentenceBreak + 1).trim();
  const technicalBody = beforeHttp.slice(lastSentenceBreak + 2).trim();
  const technical = [technicalBody, httpDetail].filter(Boolean).join(" ").trim();

  return { friendly: friendly || text, technical };
}

export default function BeansView({
  title = "Bean & Brew",
  subtitle = "Bean and Roast Journal",
  isGreenBeanSheet = false,
  saveError,
  setSaveError,
  setShowTransfer,
  showTransferActions = true,
  filter,
  setFilter,
  filterOrigin,
  setFilterOrigin,
  setFilterType,
  filterRoaster,
  setFilterRoaster,
  allOrigins,
  allRoasters,
  activeFilterCount,
  setEditBean,
  setView,
  bestBrew,
  setActiveBean,
  Tag,
  filtered,
  beanListMode,
  setBeanListMode,
  beansCount,
  onToggleArchive,
  onEditBean,
  onDeleteBean,
  greenBeans,
}) {
  const errorParts = splitErrorMessage(saveError);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 className="mbl-title">{title}</h1>
        <div className="mbl-label">{subtitle}</div>
      </div>

      {saveError && (
        <div className="mbl-alert" role="alert" style={{ marginBottom: "16px" }}>
          <div style={{ minWidth: 0 }}>
            <strong>{errorParts.friendly || saveError}</strong>
            {errorParts.technical && <pre>{errorParts.technical}</pre>}
          </div>
          <button className="mbl-link" onClick={() => setSaveError("")} aria-label="Dismiss error">✕</button>
        </div>
      )}

      <div className="mbl-row" style={{ marginBottom: "11px" }}>
        <button className="mbl-btn mbl-btn--primary" onClick={() => { setEditBean({ ...defaultBean }); setView("beanForm"); }}>+ New Bean</button>
        <div className="mbl-segment" role="group" aria-label="Bean list">
          {[
            { id: "active", label: "Active" },
            { id: "archived", label: "Archived" }
          ].map((option) => (
            <button key={option.id} onClick={() => setBeanListMode(option.id)} aria-pressed={beanListMode === option.id}>
              {option.label}
            </button>
          ))}
        </div>
        {showTransferActions && (
          <>
            <button className="mbl-btn mbl-btn--quiet" onClick={() => setShowTransfer("export")}>↑ Export</button>
            <button className="mbl-btn mbl-btn--quiet" onClick={() => setShowTransfer("import")}>↓ Import</button>
          </>
        )}
      </div>

      {beansCount === 0 ? (
        <div className="mbl-empty">
          <h2>{beanListMode === "archived" ? "No archived beans yet" : "No beans yet"}</h2>
          <p>{beanListMode === "archived" ? "Archived beans will show up here" : "Add your first bean to start dialling in"}</p>
        </div>
      ) : (
        <div>
          <div className="mbl-row mbl-filter-row" style={{ marginBottom: "16px" }}>
            <input className="mbl-field mbl-field--search" type="search" aria-label="Search beans" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search beans…" />

            {allOrigins.length > 0 && (
              <select className="mbl-field mbl-field--select" aria-label="Filter by origin" value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)} aria-current={filterOrigin ? "true" : undefined}>
                <option value="">All Origins</option>
                {allOrigins.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}

            {allRoasters.length > 1 && (
              <select className="mbl-field mbl-field--select" aria-label="Filter by roaster" value={filterRoaster} onChange={(e) => setFilterRoaster(e.target.value)} aria-current={filterRoaster ? "true" : undefined}>
                <option value="">All Roasters</option>
                {allRoasters.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}

            {activeFilterCount > 0 && (
              <button className="mbl-btn mbl-btn--quiet" onClick={() => { setFilterOrigin(""); setFilterType(""); setFilterRoaster(""); }}>
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} ✕
              </button>
            )}
          </div>

          <div className="mbl-label" style={{ marginBottom: "8px" }} aria-live="polite">
            {filtered.length} bean{filtered.length !== 1 ? "s" : ""}{activeFilterCount > 0 ? " matching filters" : ""} · {beanListMode === "archived" ? "Archived" : "Active"}
          </div>
          <div className="mbl-cards">
            {filtered.map((bean) => (
              <BeanCard
                key={bean.id}
                bean={bean}
                bestBrew={bestBrew}
                setActiveBean={setActiveBean}
                setView={setView}
                isGreenBeanSheet={isGreenBeanSheet}
                Tag={Tag}
                onToggleArchive={onToggleArchive}
                onEditBean={onEditBean}
                onDeleteBean={onDeleteBean}
                greenBeans={greenBeans}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
