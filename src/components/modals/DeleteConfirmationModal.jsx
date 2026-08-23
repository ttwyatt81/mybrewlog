export default function DeleteConfirmationModal({ itemType, onCancel, onConfirm }) {
  return (
    <div
      role="presentation"
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        onClick={(event) => event.stopPropagation()}
        style={{ background: "#141008", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "12px", width: "100%", maxWidth: "400px", padding: "28px" }}
      >
        <div id="delete-confirmation-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#f6eee0" }}>
          Delete {itemType}?
        </div>
        <p style={{ margin: "12px 0 24px", color: "#c2a587", fontSize: "13px", lineHeight: 1.6 }}>
          This will permanently remove this {itemType}. This action cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{ background: "none", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "7px", color: "#d4bca0", cursor: "pointer", padding: "9px 14px", fontSize: "13px" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ background: "#b9523f", border: "1px solid #d16b56", borderRadius: "7px", color: "#fff", cursor: "pointer", padding: "9px 14px", fontSize: "13px", fontWeight: "500" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}