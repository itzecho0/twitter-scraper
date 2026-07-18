import type { ReactNode } from "react";
import { MobileBottomNavigation, DesktopSidebar } from "./Navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-on-background lg:h-screen lg:overflow-hidden">
      <DesktopSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-sidebar_width lg:h-screen lg:overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/95 px-margin_mobile py-4 backdrop-blur lg:hidden">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-primary">
            Ronak&apos;s Assistant
          </h1>
        </header>
        <main className="min-w-0 flex-1 px-margin_mobile py-6 pb-28 lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden lg:px-margin_desktop lg:py-10 lg:pb-10">
          <div className="mx-auto w-full max-w-canvas">{children}</div>
        </main>
        <MobileBottomNavigation />
      </div>
    </div>
  );
}
