import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <h1 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-primary lg:text-[48px]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
