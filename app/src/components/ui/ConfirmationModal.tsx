import { Button } from "./Button";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-primary/45 px-4 py-6 sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-card">
        <h3 className="font-display text-2xl font-semibold text-primary">{title}</h3>
        <p className="mt-3 text-base leading-7 text-on-surface-variant">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
