import BeanCard from "../BeanCard";
import { defaultBean } from "../../lib/constants";

export default function BeansView({
  title = "Bean & Brew",
  isGreenBeanSheet = false,
  beans,
  saveError,
  setSaveError,
  setShowTransfer,
  showTransferActions = true,
  filter,
  setFilter,
  filterOrigin,
  setFilterOrigin,
  filterType,
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
}) {
  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", letterSpacing: "0.02em", marginBottom: "4px" }}>{title}</div>
        <div style={{ fontSize: "10px", color: "#c3aa90", letterSpacing: "0.18em", textTransform: "uppercase" }}>Coffee Journal</div>
      </div>

      {saveError && (
        <div style={{ background: "rgba(200,96,96,0.15)", border: "1px solid rgba(200,96,96,0.3)", borderRadius: "7px", color: "#d89090", fontSize: "13px", padding: "10px 12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{saveError}</span>
          <button onClick={() => setSaveError("")} style={{ background: "none", border: "none", color: "#d89090", cursor: "pointer", fontSize: "16px", padding: "0" }}>✕</button>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        {showTransferActions && (
          <>
            <button onClick={() => setShowTransfer("export")} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#c9b094", cursor: "pointer", padding: "7px 12px", fontSize: "12px" }}>↑ Export</button>
            <button onClick={() => setShowTransfer("import")} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#c9b094", cursor: "pointer", padding: "7px 12px", fontSize: "12px" }}>↓ Import</button>
          </>
        )}
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search beans…" style={{ flex: 1, minWidth: "120px", fontSize: "13px", padding: "7px 11px" }} />
        <button onClick={() => { setEditBean({ ...defaultBean }); setView("beanForm"); }} style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>+ New Bean</button>
      </div>

      <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "999px", padding: "4px", marginBottom: "18px" }}>
        {[
          { id: "active", label: "Active" },
          { id: "archived", label: "Archived" }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setBeanListMode(option.id)}
            style={{
              padding: "7px 16px",
              borderRadius: "999px",
              border: "none",
              background: beanListMode === option.id ? "rgba(200,137,58,0.18)" : "transparent",
              color: beanListMode === option.id ? "#e4bf82" : "#bca385",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: beanListMode === option.id ? 600 : 400,
              transition: "all 0.15s"
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {beansCount === 0 ? (
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.2 }}>☕</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#5a4030", marginBottom: "8px" }}>{beanListMode === "archived" ? "No archived beans yet" : "No beans yet"}</div>
          <div style={{ fontSize: "13px", color: "#3a2a1a" }}>{beanListMode === "archived" ? "Archived beans will show up here" : "Add your first bean to start dialling in"}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {['Filter', 'Espresso'].map((t) => (
                  <button key={t} onClick={() => setFilterType(filterType === t ? "" : t)} style={{ padding: "5px 12px", borderRadius: "20px", border: `1px solid ${filterType === t ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`, background: filterType === t ? "rgba(200,137,58,0.18)" : "transparent", color: filterType === t ? "#c8a060" : "#c4ab90", cursor: "pointer", fontSize: "12px", transition: "all 0.15s" }}>
                    {t}
                  </button>
                ))}
              </div>

              {allOrigins.length > 0 && (
                <select value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)} style={{ width: "auto", fontSize: "12px", padding: "5px 10px", cursor: "pointer", borderColor: filterOrigin ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)", color: filterOrigin ? "#c8a060" : "#c4ab90" }}>
                  <option value="">All Origins</option>
                  {allOrigins.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {allRoasters.length > 1 && (
                <select value={filterRoaster} onChange={(e) => setFilterRoaster(e.target.value)} style={{ width: "auto", fontSize: "12px", padding: "5px 10px", cursor: "pointer", borderColor: filterRoaster ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)", color: filterRoaster ? "#c8a060" : "#c4ab90" }}>
                  <option value="">All Roasters</option>
                  {allRoasters.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              )}

              {activeFilterCount > 0 && (
                <button onClick={() => { setFilterOrigin(""); setFilterType(""); setFilterRoaster(""); }} style={{ padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(200,80,80,0.3)", background: "transparent", color: "#8a5050", cursor: "pointer", fontSize: "12px" }}>
                  Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ fontSize: "11px", color: "#c1a88c", letterSpacing: "0.04em" }}>{filtered.length} bean{filtered.length !== 1 ? "s" : ""}{activeFilterCount > 0 ? " matching filters" : ""}</div>
            <div style={{ fontSize: "10px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase" }}>{beanListMode === "archived" ? "Archived" : "Active"} view</div>
          </div>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
