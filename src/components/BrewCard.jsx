import { useState } from "react";

// Helpers (copied from App.jsx)
function calcRatio(dose, water) {
  if (!dose || !water || isNaN(dose) || isNaN(water)) return null;
  return (parseFloat(water) / parseFloat(dose)).toFixed(1);
}
function bloomRatio(bloomWater, dose) {
  if (!bloomWater || !dose || isNaN(bloomWater) || isNaN(dose)) return null;
  return (parseFloat(bloomWater) / parseFloat(dose)).toFixed(1);
}
function parseTimeValue(value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  if (/^\d+:\d{1,2}$/.test(text)) {
    const [minutes, seconds] = text.split(":").map(Number);
    return Number.isFinite(minutes) && Number.isFinite(seconds) ? minutes * 60 + seconds : 0;
  }
  const digits = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(digits) ? digits : 0;
}
function formatSecondsToTime(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
function normalizePourSteps(pourSteps = [], numPours = "") {
  const count = Math.max(0, Math.min(10, Number(numPours)) - 1);
  const steps = Array.isArray(pourSteps)
    ? pourSteps.map((step) => ({ water: step?.water || "", time: step?.time || "" }))
    : [];
  while (steps.length < count) steps.push({ water: "", time: "" });
  return steps.slice(0, count);
}
function parsePourStepsFromStructure(pourStructure = "", numPours = "") {
  const lines = pourStructure
    .split("→")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(1);
  const count = Math.max(0, Math.min(10, Number(numPours)) - 1);
  const pours = lines.slice(0, count).map((line) => {
    const waterMatch = line.match(/(\d+)\s*g/);
    const timeMatch = line.match(/at\s+([0-9:]+)|([0-9]+)\s*s/);
    let time = "";
    if (timeMatch) time = timeMatch[1] || timeMatch[2] || "";
    if (time.endsWith("s")) time = time.slice(0, -1);
    return {
      water: waterMatch ? waterMatch[1] : "",
      time,
    };
  });
  while (pours.length < count) pours.push({ water: "", time: "" });
  return pours;
}
function getTechniqueLines(brew) {
  const lines = [];
  const poursLabel = brew.numPours ? `${brew.numPours} pours` : null;
  const totalTime = brew.totalTime ? brew.totalTime : null;

  if (poursLabel || totalTime) {
    lines.push({ text: `${poursLabel || "? pours"}${totalTime ? ` · ${totalTime}` : ""}` });
  }

  if (brew.bloomWater || brew.bloomTime) {
    const bloomText = brew.bloomWater ? `${brew.bloomWater}g bloom` : "Bloom";
    const bloomTimeText = brew.bloomTime ? `${brew.bloomTime}s` : "";
    lines.push({ text: `${bloomText}${bloomTimeText ? ` · ${bloomTimeText}` : ""}` });
  }

  const steps = normalizePourSteps(
    brew.pours && brew.pours.length ? brew.pours : parsePourStepsFromStructure(brew.pourStructure || "", brew.numPours),
    brew.numPours
  );
  let currentStart = parseTimeValue(brew.bloomTime);
  steps.forEach((step, index) => {
    if (!step.water && !step.time) return;
    const pourTime = parseTimeValue(step.time);
    const endTime = currentStart + pourTime;
    lines.push({ text: `Pour ${index + 2} · ${step.water ? `${step.water}g` : "?g"}${step.time ? ` · ${formatSecondsToTime(endTime)}` : ""}` });
    currentStart = endTime;
  });

  return lines;
}

function StarRating({ value, size = 20 }) {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= value ? "#c8893a" : "#2e2318", userSelect: "none" }}>★</span>
      ))}
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{ fontSize: "11px", color: "#9a7a5a", background: "rgba(200,137,58,0.08)", padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// ── Brew Card (list item) ─────────────────────────────────────────────────────
export function BrewCard({ brew, bean, onClick }) {
  return (
    <div
      key={`${bean.id}-${brew.id}`}
      onClick={onClick}
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,137,58,0.18)", borderRadius: "12px", padding: "15px 18px", cursor: "pointer", transition: "all 0.18s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,137,58,0.06)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(200,137,58,0.18)"; }}>
      {/* Bean info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", marginBottom: "2px" }}>{bean.name}</div>
          <div style={{ fontSize: "11px", color: "#6a5040" }}>{[bean.roaster, bean.origin].filter(Boolean).join(" · ")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <StarRating value={brew.rating} size={13} />
          <div style={{ fontSize: "11px", color: "#4a3a2a", marginTop: "3px" }}>{brew.date}</div>
        </div>
      </div>
      {/* Tags */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
        {brew.method && <Tag>{brew.method}</Tag>}
        {brew.brewer && <Tag>{brew.brewer}</Tag>}
        {brew.recipeSource && brew.recipeSource !== "Manual" && (
          <span style={{ fontSize: "11px", color: "#7a9a7a", background: "rgba(100,160,100,0.08)", padding: "3px 9px", borderRadius: "20px" }}>
            {brew.recipeSource}{brew.recipeName ? `: ${brew.recipeName}` : ""}
          </span>
        )}
      </div>
      {/* Key params */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {brew.dose && brew.water && <Tag>1:{calcRatio(brew.dose, brew.water)}</Tag>}
        {brew.temperature && <Tag>{brew.temperature}°C</Tag>}
        {brew.totalTime && <Tag>{brew.totalTime}</Tag>}
      </div>
      {brew.tastingNotes && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#6a5a40", fontStyle: "italic", lineHeight: 1.5 }}>
          "{brew.tastingNotes.slice(0, 80)}{brew.tastingNotes.length > 80 ? "…" : ""}"
        </div>
      )}
    </div>
  );
}

// ── Brew Detail (full view) ───────────────────────────────────────────────────
export function BrewDetail({ brew, bean, onBack, onEdit, onCopyToRecipe, onGoToBean }) {
  return (
    <div>
      <button onClick={onBack}
        style={{ background: "none", border: "none", color: "#9a7a5a", cursor: "pointer", fontSize: "13px", marginBottom: "20px", padding: 0 }}>
        ← All Brews
      </button>

      {/* Bean reference */}
      <div style={{ background: "rgba(200,137,58,0.05)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", cursor: "pointer" }}
        onClick={onGoToBean}>
        <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#6a5040", textTransform: "uppercase", marginBottom: "4px" }}>Bean</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", marginBottom: "2px" }}>{bean.name}</div>
        <div style={{ fontSize: "12px", color: "#7a6050" }}>{[bean.roaster, bean.origin, bean.roastLevel].filter(Boolean).join(" · ")}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "4px" }}>Brew Session</div>
          <div style={{ fontSize: "12px", color: "#6a5040" }}>{brew.date}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <StarRating value={brew.rating} size={18} />
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={onEdit}
              style={{ background: "none", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "7px", color: "#9a7a5a", cursor: "pointer", fontSize: "12px", padding: "5px 11px" }}>
              Edit Brew
            </button>
            <button onClick={onCopyToRecipe}
              style={{ background: "none", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "7px", color: "#9a7a5a", cursor: "pointer", fontSize: "12px", padding: "5px 11px" }}>
              → Save as Recipe
            </button>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
        {brew.method && <Tag>{brew.method}</Tag>}
        {brew.brewer && <Tag>{brew.brewer}</Tag>}
        {brew.filterPaper && <Tag>{brew.filterPaper}</Tag>}
        {brew.recipeSource && (
          <span style={{ fontSize: "11px", color: brew.recipeSource === "Manual" ? "#9a7a5a" : "#7a9a7a", background: brew.recipeSource === "Manual" ? "rgba(200,137,58,0.08)" : "rgba(100,160,100,0.08)", padding: "3px 9px", borderRadius: "20px" }}>
            {brew.recipeSource}{brew.recipeName ? `: ${brew.recipeName}` : ""}
          </span>
        )}
      </div>

      {/* Stats */}
      {brew.method === "Pour Over" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "18px" }}>
          {[
            { l: "Dose", v: brew.dose ? `${brew.dose}g` : null },
            { l: "Water", v: brew.water ? `${brew.water}g` : null },
            { l: "Ratio", v: calcRatio(brew.dose, brew.water) ? `1:${calcRatio(brew.dose, brew.water)}` : null },
            { l: "Temp", v: brew.temperature ? `${brew.temperature}°C` : null },
            { l: "Grind", v: brew.grindSize || null },
            { l: "Time", v: brew.totalTime || null },
            { l: "Bloom", v: brew.bloomWater ? `${brew.bloomWater}g` : null },
            { l: "Bloom ×", v: bloomRatio(brew.bloomWater, brew.dose) ? `×${bloomRatio(brew.bloomWater, brew.dose)}` : null },
            { l: "# Pours", v: brew.numPours || null },
          ].filter(x => x.v).map(x => (
            <div key={x.l} style={{ background: "rgba(200,137,58,0.05)", border: "1px solid rgba(200,137,58,0.1)", borderRadius: "9px", padding: "11px 8px", textAlign: "center" }}>
              <div style={{ fontSize: "16px", color: "#f0e6d3", fontFamily: "'Playfair Display', serif" }}>{x.v}</div>
              <div style={{ fontSize: "9px", color: "#6a5040", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: "3px" }}>{x.l}</div>
            </div>
          ))}
        </div>
      )}

      {brew.method === "Pour Over" && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9a7a5a", textTransform: "uppercase", marginBottom: "8px" }}>Technique</div>
          <div style={{ display: "grid", gap: "10px", background: "rgba(200,137,58,0.05)", padding: "14px", borderRadius: "10px", borderLeft: "2px solid rgba(200,137,58,0.35)" }}>
            {getTechniqueLines(brew).map((line, index) => (
              <div key={index} style={{ fontSize: index === 0 ? "14px" : "13px", color: "#c8a878", lineHeight: 1.5, fontWeight: index === 0 ? 600 : 400 }}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {brew.tastingNotes && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9a7a5a", textTransform: "uppercase", marginBottom: "8px" }}>Tasting Notes</div>
          <div style={{ fontSize: "14px", color: "#c8a878", lineHeight: 1.7, fontStyle: "italic" }}>"{brew.tastingNotes}"</div>
        </div>
      )}
    </div>
  );
}          
