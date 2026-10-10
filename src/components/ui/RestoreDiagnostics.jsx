import { useState } from "react";
import { formatRestoreDiagnostics } from "../../features/auth/sessionRestore";

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
    <details className="mbl-restore-diagnostics" open={defaultOpen || undefined}>
      <summary>Troubleshooting</summary>
      <div className="mbl-diagnostics-content">
        <textarea
          readOnly
          value={entries.length ? text : "No session restore attempts recorded yet."}
          onFocus={(e) => e.target.select()}
          rows={Math.min(8, entries.length + 2)}
        />
        <div className="mbl-diagnostics-actions">
          <button type="button" onClick={copy} disabled={!entries.length}>{copied ? "Copied" : "Copy"}</button>
          <button type="button" onClick={onClear} disabled={!entries.length}>Clear</button>
        </div>
      </div>
    </details>
  );
}
