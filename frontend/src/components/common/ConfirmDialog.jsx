import Modal from './Modal';
import Spinner from './Spinner';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading = false, variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary btn" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={variant === 'danger' ? 'btn-danger btn' : 'btn-primary btn'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
