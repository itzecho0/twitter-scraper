import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: string;
};

export function Input({ className, icon, ...props }: InputProps) {
  return (
    <div className="group relative">
      {icon ? (
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-secondary">
          {icon}
        </span>
      ) : null}
      <input
        className={cn(
          "w-full rounded border border-surface-variant bg-surface-container-lowest px-4 py-3 text-[16px] text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15",
          icon ? "pl-10" : "",
          className
        )}
        {...props}
      />
    </div>
  );
}
