import { Button } from "./Button";

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-primary">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="mt-5 font-display text-2xl font-semibold text-primary">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-on-surface-variant">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
