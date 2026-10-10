export default function TransferModal({
  showTransfer,
    onClose,
  importText,
    onImportTextChange,
    importError,
    importSuccess,
  exportData,
  importData,
    importing,
  beans = [],
  recipes = []
}) {
return (
    <div className="mbl-dialog-backdrop">
        <div className="mbl-dialog mbl-transfer-dialog">
        <div className="mbl-dialog-header">
            <h2 className="mbl-dialog-title">
            {showTransfer === "export" ? "Export Data" : "Import Data"}
            </h2>
            <button onClick={onClose}
            className="mbl-dialog-close">✕</button>
        </div>

        {showTransfer === "export" && (() => {
            const code = exportData();
            return (
            <div>
                <p className="mbl-dialog-copy">
                Copy this code and paste it into the Import screen on your other device. It contains all your beans, brews and recipes.
                </p>
                <textarea readOnly value={code}
                className="mbl-dialog-code"
                onFocus={e => e.target.select()} />
                <button
                onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); }}
                className="mbl-dialog-button mbl-dialog-button--primary mbl-transfer-main-action">
                Copy to Clipboard
                </button>
                <div className="mbl-dialog-meta">
                {beans.length} bean{beans.length !== 1 ? "s" : ""} · {beans.reduce((a, b) => a + b.brews.length, 0)} brew{beans.reduce((a, b) => a + b.brews.length, 0) !== 1 ? "s" : ""} · {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} included
                </div>
            </div>
            );
        })()}

        {showTransfer === "import" && (
            <div>
            <p className="mbl-dialog-copy">
                Paste the export code from your other device below. This will replace all current data on this device.
            </p>
            <textarea
                value={importText}
                onChange={e => onImportTextChange(e.target.value)}
                placeholder="Paste your export code here…"
                className="mbl-dialog-code" />
            {importError && (
                <div className="mbl-dialog-message mbl-dialog-message--error">Invalid code — make sure you copied the full export text.</div>
            )}
            {importSuccess && (
                <div className="mbl-dialog-message mbl-dialog-message--success">✓ Data imported successfully!</div>
            )}
            <button onClick={importData} disabled={!importText.trim() || importing}
                className="mbl-dialog-button mbl-dialog-button--primary mbl-transfer-main-action">
                {importing ? "Importing..." : "Import Data"}
            </button>
            <div className="mbl-dialog-warning">
                ⚠ This will overwrite existing data on this device
            </div>
            </div>
        )}
        </div>
    </div>
    );
}