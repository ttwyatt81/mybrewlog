export default function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={{ fontSize: "10px", letterSpacing: "0.1em", color: "#9a7a5a", textTransform: "uppercase" }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: "10px", color: "#4a3a2a" }}>{hint}</span>}
    </div>
  );
}
