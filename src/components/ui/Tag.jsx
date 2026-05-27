export function Tag({ children }) {
  return (
    <span style={{ fontSize: "11px", color: "#9a7a5a", background: "rgba(200,137,58,0.08)", padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
