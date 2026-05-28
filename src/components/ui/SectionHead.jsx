export default function SectionHead({ children }) {
  return (
    <div style={{ fontSize: "10px", letterSpacing: "0.14em", color: "#c8893a", textTransform: "uppercase", marginBottom: "14px", borderBottom: "1px solid rgba(200,137,58,0.15)", paddingBottom: "6px" }}>
      {children}
    </div>
  );
}
