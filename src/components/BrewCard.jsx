import { getTechniqueLinesFromBrew } from "../features/brews/model";
import BrewLogCardContent from "./BrewLogCardContent";

const formatDateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

function StarRating({ value, size = 20 }) {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= value ? "#c8893a" : "#2e2318", userSelect: "none" }}>★</span>
      ))}
    </div>
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
          <div style={{ fontSize: "11px", color: "#c9b094" }}>{[bean.roaster, bean.origin].filter(Boolean).join(" · ")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <StarRating value={brew.rating} size={13} />
          <div style={{ fontSize: "11px", color: "#c1a88c", marginTop: "3px" }}>{formatDateValue(brew.date)}</div>
        </div>
      </div>
      <BrewLogCardContent
        entry={brew}
        getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
        compact
        showTechnique={false}
        tastingNotesMaxLength={80}
      />
    </div>
  );
}

// ── Brew Detail (full view) ───────────────────────────────────────────────────
export function BrewDetail({ brew, bean, onBack, onEdit, onCopyToRecipe, onGoToBean }) {
  return (
    <div>
      <button onClick={onBack}
        style={{ background: "none", border: "none", color: "#d4bca0", cursor: "pointer", fontSize: "13px", marginBottom: "20px", padding: 0 }}>
        ← All Brews
      </button>

      {/* Bean reference */}
      <div style={{ background: "rgba(200,137,58,0.05)", border: "1px solid rgba(200,137,58,0.15)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", cursor: "pointer" }}
        onClick={onGoToBean}>
        <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#c9b094", textTransform: "uppercase", marginBottom: "4px" }}>Bean</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", marginBottom: "2px" }}>{bean.name}</div>
        <div style={{ fontSize: "12px", color: "#d0b69a" }}>{[bean.roaster, bean.origin, bean.roastLevel].filter(Boolean).join(" · ")}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "4px" }}>Brew Session</div>
          <div style={{ fontSize: "12px", color: "#c9b094" }}>{formatDateValue(brew.date)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <StarRating value={brew.rating} size={18} />
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={onEdit}
              style={{ background: "none", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", fontSize: "12px", padding: "5px 11px" }}>
              Edit Brew
            </button>
            <button onClick={onCopyToRecipe}
              style={{ background: "none", border: "1px solid rgba(200,137,58,0.25)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", fontSize: "12px", padding: "5px 11px" }}>
              → Save as Recipe
            </button>
          </div>
        </div>
      </div>

      <BrewLogCardContent
        entry={brew}
        getTechniqueLinesFromBrew={getTechniqueLinesFromBrew}
        showManualRecipeSource
      />
    </div>
  );
}
