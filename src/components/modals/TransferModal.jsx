import { IS } from "../ui/formStyles";

export default function TransferModal({
  showTransfer,
  setShowTransfer,
  importText,
  setImportText,
  importStatus,
  setImportStatus,
  exportData,
  importData,
  beans = [],
  recipes = []
}) {
return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{ background: "#141008", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "16px", width: "100%", maxWidth: "480px", padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px" }}>
            {showTransfer === "export" ? "Export Data" : "Import Data"}
            </div>
            <button onClick={() => { setShowTransfer(null); setImportText(""); setImportStatus(""); }}
            style={{ background: "none", border: "none", color: "#6a5040", cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>

        {showTransfer === "export" && (() => {
            const code = exportData();
            return (
            <div>
                <p style={{ fontSize: "13px", color: "#7a6050", lineHeight: 1.6, marginBottom: "16px" }}>
                Copy this code and paste it into the Import screen on your other device. It contains all your beans, brews and recipes.
                </p>
                <textarea readOnly value={code}
                style={{ ...IS, resize: "none", height: "140px", fontSize: "11px", fontFamily: "monospace", lineHeight: 1.5, color: "#c8a878" }}
                onFocus={e => e.target.select()} />
                <button
                onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); }}
                style={{ width: "100%", marginTop: "12px", background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "9px", color: "#fff", padding: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
                Copy to Clipboard
                </button>
                <div style={{ marginTop: "10px", fontSize: "11px", color: "#4a3a2a", textAlign: "center" }}>
                {beans.length} bean{beans.length !== 1 ? "s" : ""} · {beans.reduce((a, b) => a + b.brews.length, 0)} brew{beans.reduce((a, b) => a + b.brews.length, 0) !== 1 ? "s" : ""} · {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} included
                </div>
            </div>
            );
        })()}

        {showTransfer === "import" && (
            <div>
            <p style={{ fontSize: "13px", color: "#7a6050", lineHeight: 1.6, marginBottom: "16px" }}>
                Paste the export code from your other device below. This will replace all current data on this device.
            </p>
            <textarea
                value={importText}
                onChange={e => { setImportText(e.target.value); setImportStatus(""); }}
                placeholder="Paste your export code here…"
                style={{ ...IS, resize: "none", height: "140px", fontSize: "11px", fontFamily: "monospace", lineHeight: 1.5 }} />
            {importStatus === "error" && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#c87060" }}>Invalid code — make sure you copied the full export text.</div>
            )}
            {importStatus === "success" && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#60c880" }}>✓ Data imported successfully!</div>
            )}
            <button onClick={importData} disabled={!importText.trim()}
                style={{ width: "100%", marginTop: "12px", background: importText.trim() ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.15)", border: "none", borderRadius: "9px", color: importText.trim() ? "#fff" : "#4a3020", padding: "12px", fontSize: "14px", fontWeight: "500", cursor: importText.trim() ? "pointer" : "not-allowed" }}>
                Import Data
            </button>
            <div style={{ marginTop: "10px", fontSize: "11px", color: "#4a3a2a", textAlign: "center" }}>
                ⚠ This will overwrite existing data on this device
            </div>
            </div>
        )}
        </div>
    </div>
    );
}