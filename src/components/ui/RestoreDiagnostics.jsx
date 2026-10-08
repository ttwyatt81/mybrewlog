import { useState } from "react";
import { formatRestoreDiagnostics } from "../../features/auth/sessionRestore";

const btn = { background: "none", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "7px", color: "#d0b69a", cursor: "pointer", fontSize: "12px", padding: "6px 12px" };

export default function RestoreDiagnostics({ entries, onClear, defaultOpen = false }) {
  const [copied, setCopied] = useState(false);
  const text = formatRestoreDiagnostics(entries);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <details open={defaultOpen || undefined} style={{ marginTop: "28px", fontSize: "12px", color: "#c3aa90" }}>
      <summary style={{ cursor: "pointer", textAlign: "center" }}>Troubleshooting</summary>
      <div style={{ marginTop: "10px" }}>
        <textarea
          readOnly
          value={entries.length ? text : "No session restore attempts recorded yet."}
          onFocus={(e) => e.target.select()}
          rows={Math.min(8, entries.length + 2)}
          style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,137,58,0.2)", borderRadius: "7px", color: "#d0b69a", fontFamily: "monospace", fontSize: "11px", padding: "8px" }}
        />
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button type="button" style={btn} onClick={copy} disabled={!entries.length}>{copied ? "Copied" : "Copy"}</button>
          <button type="button" style={btn} onClick={onClear} disabled={!entries.length}>Clear</button>
        </div>
      </div>
    </details>
  );
}
