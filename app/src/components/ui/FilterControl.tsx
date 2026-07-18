import { Button } from "./Button";

type FilterControlProps = {
  value: string;
  open: boolean;
  options: string[];
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
};

export function FilterControl({ value, open, options, onOpenChange, onSelect }: FilterControlProps) {
  return (
    <div className="relative">
      <Button
        variant="secondary"
        icon={<span className="material-symbols-outlined text-base">filter_list</span>}
        onClick={() => onOpenChange(!open)}
        className="w-full justify-center px-6 sm:w-auto"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {value}
        <span className="material-symbols-outlined text-base">{open ? "expand_less" : "expand_more"}</span>
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-full min-w-48 overflow-hidden rounded border border-surface-variant bg-surface-container-lowest shadow-card sm:w-56">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left font-label text-[12px] uppercase tracking-[0.05em] text-on-surface transition hover:bg-surface-container-low"
              onClick={() => {
                onSelect(option);
                onOpenChange(false);
              }}
            >
              {option}
              {option === value ? (
                <span className="material-symbols-outlined filled text-base text-secondary">check</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
