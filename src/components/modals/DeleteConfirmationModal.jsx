export default function DeleteConfirmationModal({ itemType, onCancel, onConfirm }) {
  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="mbl-dialog-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        onClick={(event) => event.stopPropagation()}
        className="mbl-dialog mbl-delete-dialog"
      >
        <h2 id="delete-confirmation-title" className="mbl-dialog-title">
          Delete {itemType}?
        </h2>
        <p className="mbl-dialog-copy">
          This will permanently remove this {itemType}. This action cannot be undone.
        </p>
        <div className="mbl-dialog-actions">
          <button
            onClick={onCancel}
            className="mbl-dialog-button mbl-dialog-button--quiet"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="mbl-dialog-button mbl-dialog-button--danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}