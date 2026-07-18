type LoadingStateProps = {
  message: string;
  detail?: string;
};

export function LoadingState({ message, detail }: LoadingStateProps) {
  return (
    <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-container-high border-t-secondary" />
        <div>
          <p className="font-display text-lg font-semibold text-primary">{message}</p>
          {detail ? <p className="mt-1 text-sm text-on-surface-variant">{detail}</p> : null}
        </div>
      </div>
    </div>
  );
}
