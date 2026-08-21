function CoffeeMugIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M22 36H100C112.15 36 122 45.85 122 58V103C122 124.539 104.539 142 83 142H39C17.461 142 0 124.539 0 103V58C0 45.85 9.85 36 22 36ZM22 53H100C102.761 53 105 55.239 105 58V103C105 112.389 97.389 120 88 120H34C24.611 120 17 112.389 17 103V58C17 55.239 19.239 53 22 53ZM124 62H143C156.255 62 167 72.745 167 86C167 99.255 156.255 110 143 110H124V62Z"
        fill={color}
      />
    </svg>
  );
}

const formatDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function RoastLogSection({
  roasts,
  onEditRoast,
  onDeleteRoast,
}) {
  const parseTimeToSeconds = (value) => {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    if (!raw.includes(":")) {
      const asNumber = Number(raw);
      return Number.isFinite(asNumber) && asNumber >= 0 ? asNumber : null;
    }

    const parts = raw.split(":").map((part) => part.trim());
    if (parts.some((part) => part === "" || Number.isNaN(Number(part)))) return null;
    const nums = parts.map((part) => Number(part));
    if (nums.some((num) => !Number.isFinite(num) || num < 0)) return null;

    if (nums.length === 2) {
      return (nums[0] * 60) + nums[1];
    }
    if (nums.length === 3) {
      return (nums[0] * 3600) + (nums[1] * 60) + nums[2];
    }
    return null;
  };

  const formatSeconds = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "";
    const whole = Math.round(seconds);
    const mins = Math.floor(whole / 60);
    const secs = whole % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const getDevelopmentTime = (firstCrack, totalRoast) => {
    const firstCrackSeconds = parseTimeToSeconds(firstCrack);
    const totalRoastSeconds = parseTimeToSeconds(totalRoast);
    if (!Number.isFinite(firstCrackSeconds) || !Number.isFinite(totalRoastSeconds)) return "";
    const delta = totalRoastSeconds - firstCrackSeconds;
    if (delta < 0) return "";
    return formatSeconds(delta);
  };

  const getDevelopmentPercent = (firstCrack, totalRoast) => {
    const firstCrackSeconds = parseTimeToSeconds(firstCrack);
    const totalRoastSeconds = parseTimeToSeconds(totalRoast);
    if (!Number.isFinite(firstCrackSeconds) || !Number.isFinite(totalRoastSeconds) || totalRoastSeconds <= 0) return "";
    const delta = totalRoastSeconds - firstCrackSeconds;
    if (delta < 0) return "";
    return `${((delta / totalRoastSeconds) * 100).toFixed(1)}%`;
  };

  const getRoastDateTime = (roast) => {
    if (!roast?.date) return null;
    const time = (roast.roastTime || "").trim() || "00:00";
    const dateTime = new Date(`${roast.date}T${time}`);
    return Number.isNaN(dateTime.getTime()) ? null : dateTime;
  };

  const getRestedDuration = (roast) => {
    const roastDateTime = getRoastDateTime(roast);
    if (!roastDateTime) return "";
    const elapsedMs = Date.now() - roastDateTime.getTime();
    if (elapsedMs < 0) return "0h";

    const totalHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getElapsedHours = (roast) => {
    const roastDateTime = getRoastDateTime(roast);
    if (!roastDateTime) return null;
    const elapsedMs = Date.now() - roastDateTime.getTime();
    if (elapsedMs < 0) return 0;
    return elapsedMs / (1000 * 60 * 60);
  };

  const getRestReadiness = (roast) => {
    const elapsedHours = getElapsedHours(roast);
    if (!Number.isFinite(elapsedHours)) return { hasWindow: false, isReady: false };

    const fromDays = roast?.restingFromDays !== "" && roast?.restingFromDays !== null && roast?.restingFromDays !== undefined
      ? Number(roast.restingFromDays)
      : null;
    const toDays = roast?.restingToDays !== "" && roast?.restingToDays !== null && roast?.restingToDays !== undefined
      ? Number(roast.restingToDays)
      : null;

    const hasFrom = Number.isFinite(fromDays);
    const hasTo = Number.isFinite(toDays);
    if (!hasFrom && !hasTo) return { hasWindow: false, isReady: false };

    const fromHours = hasFrom ? fromDays * 24 : null;
    const toHours = hasTo ? toDays * 24 : null;

    const meetsFrom = !hasFrom || elapsedHours >= fromHours;
    const meetsTo = !hasTo || elapsedHours <= toHours;

    return { hasWindow: true, isReady: meetsFrom && meetsTo };
  };

  const roastCount = roasts?.length || 0;

  return (
    <>
      <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#d4bca0", textTransform: "uppercase", marginBottom: "12px" }}>
        Roast Log · {roastCount} roast{roastCount !== 1 ? "s" : ""}
      </div>

      {roastCount === 0 ? (
        <div style={{ textAlign: "center", padding: "36px 0", color: "#3a2a1a", fontSize: "13px" }}>No roasts yet — hit "+ Roast" to log the first roast</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {roasts.map((roast, i) => (
            <div key={roast.id || `${roast.date}-${i}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "11px", padding: "15px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", color: "#c8893a" }}>#{roastCount - i}</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", color: "#e4cfb1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {roast.profile || "Untitled Profile"}
                  </span>
                  {roast.roastLevel && (
                    <span style={{ fontSize: "11px", color: "#c1a88c", whiteSpace: "nowrap" }}>
                      {`Level ${roast.roastLevel}`}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  <button onClick={() => onEditRoast?.(roast)} style={{ background: "none", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "6px", color: "#d4bca0", cursor: "pointer", fontSize: "11px", padding: "3px 8px" }}>Edit</button>
                  <button onClick={() => onDeleteRoast?.(roast.id)} style={{ background: "none", border: "none", color: "#3a2a1a", cursor: "pointer", fontSize: "14px", padding: "0 4px" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#c8893a")} onMouseLeave={(e) => (e.currentTarget.style.color = "#3a2a1a")}>✕</button>
                </div>
              </div>
              <div style={{ marginBottom: roast.startWeight || roast.endWeight || roast.reductionPercent || roast.notes || roast.firstCrack || roast.totalRoast ? "10px" : "0" }}>
                {(roast.date || getRestedDuration(roast)) && (
                  <div style={{ fontSize: "10px", color: "#cbb18f", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {`Roasted ${formatDateValue(roast.date) || "-"}`}
                    {getRestedDuration(roast) && (
                      <>
                        {" · "}
                        {`Rested ${getRestedDuration(roast)}`}
                        <span
                          style={{
                            color: getRestReadiness(roast).hasWindow
                              ? (getRestReadiness(roast).isReady ? "#62c26b" : "#d66a6a")
                              : "#cbb18f",
                            marginLeft: "4px",
                            display: "inline-flex",
                            alignItems: "center"
                          }}
                          aria-label={getRestReadiness(roast).hasWindow ? (getRestReadiness(roast).isReady ? "Ready to drink" : "Not ready to drink") : "Rest status"}
                          title={getRestReadiness(roast).hasWindow ? (getRestReadiness(roast).isReady ? "Ready to drink" : "Outside ready-to-drink window") : "No ready-to-drink window set"}
                        >
                          <CoffeeMugIcon size={18} color={getRestReadiness(roast).hasWindow ? (getRestReadiness(roast).isReady ? "#62c26b" : "#d66a6a") : "#cbb18f"} />
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              {(roast.firstCrack || roast.totalRoast || getDevelopmentTime(roast.firstCrack, roast.totalRoast)) && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: roast.startWeight || roast.endWeight || roast.reductionPercent || roast.notes ? "10px" : "0" }}>
                  {roast.firstCrack && (
                    <div style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{roast.firstCrack}</div>
                      <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>First Crack</div>
                    </div>
                  )}
                  {roast.totalRoast && (
                    <div style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{roast.totalRoast}</div>
                      <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Total Roast</div>
                    </div>
                  )}
                  {getDevelopmentPercent(roast.firstCrack, roast.totalRoast) && (
                    <div style={{ background: "rgba(200,137,58,0.08)", borderRadius: "7px", padding: "8px 6px", textAlign: "center", border: "1px solid rgba(200,137,58,0.2)" }}>
                      <div style={{ fontSize: "13px", color: "#e9d8be", fontFamily: "'Playfair Display', serif" }}>{getDevelopmentPercent(roast.firstCrack, roast.totalRoast)}</div>
                      <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Development</div>
                    </div>
                  )}
                  </div>
                </>
              )}
              {(roast.startWeight || roast.endWeight || roast.reductionPercent) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: roast.notes ? "10px" : "0" }}>
                  {roast.startWeight && (
                    <div style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{roast.startWeight}g</div>
                      <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Start</div>
                    </div>
                  )}
                  {roast.endWeight && (
                    <div style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{roast.endWeight}g</div>
                      <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>End</div>
                    </div>
                  )}
                  {roast.reductionPercent && (
                    <div style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{roast.reductionPercent}%</div>
                      <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Reduction</div>
                    </div>
                  )}
                </div>
              )}
              {roast.notes && <div style={{ fontSize: "12px", color: "#ccb294", fontStyle: "italic", lineHeight: 1.6 }}>{`"${roast.notes}"`}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
