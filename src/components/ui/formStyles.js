export const IS = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,137,58,0.2)",
  borderRadius: "7px", color: "#f6eee0", padding: "9px 12px", fontSize: "14px",
  outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s",
};
export function inp(extra = {}) { return { ...IS, ...extra }; }
export function onFoc(e) { e.target.style.borderColor = "rgba(200,137,58,0.65)"; }
export function onBlr(e) { e.target.style.borderColor = "rgba(200,137,58,0.2)"; }