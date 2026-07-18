import { Button } from "./Button";

export type ToastData = {
  id: number;
  title: string;
  description: string;
};

type ToastProps = {
  toast: ToastData;
  onDismiss: (id: number) => void;
};

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div className="flex w-full max-w-sm items-start gap-3 rounded-xl border border-surface-variant bg-surface-container-lowest p-4 shadow-card">
      <span className="material-symbols-outlined filled mt-0.5 text-secondary">check_circle</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold text-primary">{toast.title}</p>
        <p className="mt-1 text-sm leading-6 text-on-surface-variant">{toast.description}</p>
      </div>
      <Button
        variant="ghost"
        onClick={() => onDismiss(toast.id)}
        className="min-h-8 px-2 py-1"
        aria-label="Dismiss notification"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </Button>
    </div>
  );
}
