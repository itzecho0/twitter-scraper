import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
};

const variants = {
  primary:
    "bg-primary text-on-primary border-primary hover:bg-on-background hover:border-on-background",
  secondary:
    "bg-surface-container-lowest text-on-surface border-surface-variant hover:border-primary",
  ghost:
    "bg-transparent text-on-surface border-transparent hover:bg-surface-container-low",
  danger:
    "bg-error text-on-error border-error hover:opacity-90"
};

export function Button({
  className,
  variant = "primary",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded border px-4 py-2 font-label text-[12px] uppercase tracking-[0.05em] transition duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
