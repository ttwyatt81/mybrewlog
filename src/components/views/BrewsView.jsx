import { compareBrewsNewestFirst } from "../../features/brews/model";

export default function BrewsView({
  beans,
  brewMethods,
  brewFilterMethod,
  setBrewFilterMethod,
  brewFilterBean,
  setBrewFilterBean,
  brewSort,
  setBrewSort,
  setSelectedBrew,
  BrewCard,
  IS,
}) {
  const allBrews = beans.flatMap((bean) => bean.brews.map((brew) => ({ brew, bean })));

  const filteredBrews = allBrews.filter(({ brew, bean }) => {
    if (brewFilterMethod && brew.method !== brewFilterMethod) return false;
    if (brewFilterBean && bean.id !== brewFilterBean) return false;
    return true;
  });

  const sortedBrews = [...filteredBrews].sort((a, b) => {
    if (brewSort === "date") return compareBrewsNewestFirst(a.brew, b.brew);
    if (brewSort === "rating") return (b.brew.rating || 0) - (a.brew.rating || 0);
    return 0;
  });

  const activeBrewFilters = [brewFilterMethod, brewFilterBean].filter(Boolean).length;

  return (
    <div>
      <div style={{ marginBottom: "22px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", marginBottom: "4px" }}>Brews</div>
        <div style={{ fontSize: "10px", color: "#5a4030", letterSpacing: "0.18em", textTransform: "uppercase" }}>All brew sessions</div>
      </div>

      {allBrews.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {brewMethods.map((m) => (
              <button
                key={m}
                onClick={() => setBrewFilterMethod(brewFilterMethod === m ? "" : m)}
                style={{
                  padding: "5px 11px",
                  borderRadius: "20px",
                  border: `1px solid ${brewFilterMethod === m ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)"}`,
                  background: brewFilterMethod === m ? "rgba(200,137,58,0.18)" : "transparent",
                  color: brewFilterMethod === m ? "#c8a060" : "#5a4a3a",
                  cursor: "pointer",
                  fontSize: "12px",
                  transition: "all 0.15s",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {beans.length > 1 && (
            <select
              value={brewFilterBean}
              onChange={(e) => setBrewFilterBean(e.target.value)}
              style={{
                ...IS,
                width: "auto",
                fontSize: "12px",
                padding: "5px 10px",
                cursor: "pointer",
                borderColor: brewFilterBean ? "rgba(200,137,58,0.8)" : "rgba(200,137,58,0.2)",
                color: brewFilterBean ? "#c8a060" : "#5a4a3a",
              }}
            >
              <option value="">All Beans</option>
              {beans.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={brewSort}
            onChange={(e) => setBrewSort(e.target.value)}
            style={{ ...IS, width: "auto", fontSize: "12px", padding: "5px 10px", cursor: "pointer", color: "#9a7a5a" }}
          >
            <option value="date">Latest first</option>
            <option value="rating">Highest rated</option>
          </select>

          {activeBrewFilters > 0 && (
            <button
              onClick={() => {
                setBrewFilterMethod("");
                setBrewFilterBean("");
              }}
              style={{
                padding: "5px 10px",
                borderRadius: "20px",
                border: "1px solid rgba(200,80,80,0.3)",
                background: "transparent",
                color: "#8a5050",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Clear {activeBrewFilters} ✕
            </button>
          )}
        </div>
      )}

      <div style={{ fontSize: "11px", color: "#4a3a2a", marginBottom: "12px", letterSpacing: "0.04em" }}>
        {sortedBrews.length} brew{sortedBrews.length !== 1 ? "s" : ""}
      </div>

      {allBrews.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <div style={{ fontSize: "44px", marginBottom: "14px", opacity: 0.2 }}>☕</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#5a4030", marginBottom: "8px" }}>No brews yet</div>
          <div style={{ fontSize: "13px", color: "#3a2a1a" }}>Add a bean and log your first brew</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {sortedBrews.map(({ brew, bean }) => (
            <BrewCard key={`${bean.id}-${brew.id}`} brew={brew} bean={bean} onClick={() => setSelectedBrew({ brew, bean })} />
          ))}
        </div>
      )}
    </div>
  );
}
