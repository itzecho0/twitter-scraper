import { cn } from "../../utils/cn";

const statusStyles = {
  Draft: "bg-surface-container-low text-on-surface-variant",
  Ready: "bg-secondary text-on-secondary",
  Posted: "bg-primary text-on-primary",
  Archived: "bg-surface-container-highest text-on-surface-variant"
};

type StatusBadgeProps = {
  status: keyof typeof statusStyles;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2.5 py-1 font-label text-[11px] uppercase tracking-[0.05em]",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
