export default function StatBox({ label, value }) {
  return (
    <div style={{ background: "rgba(200,137,58,0.05)", border: "1px solid rgba(200,137,58,0.12)", borderRadius: "9px", padding: "11px 8px", textAlign: "center" }}>
      <div style={{ fontSize: "15px", color: "#f0e6d3", marginBottom: "3px", fontFamily: "'Playfair Display', serif" }}>{value || "—"}</div>
      <div style={{ fontSize: "9px", color: "#6a5040", letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}