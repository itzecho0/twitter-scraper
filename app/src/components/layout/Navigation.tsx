import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

const navItems = [
  { to: "/discover", label: "Discover", icon: "explore" },
  { to: "/saved", label: "Saved", icon: "bookmark" },
  { to: "/history", label: "History", icon: "history" },
  { to: "/settings", label: "Settings", icon: "settings" }
];

export function DesktopSidebar() {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:h-screen lg:w-sidebar_width lg:flex-col lg:overflow-hidden lg:border-r lg:border-tertiary-container lg:bg-tertiary-container lg:text-on-tertiary">
      <div className="px-gutter py-7">
        <h1 className="font-display text-[32px] font-semibold leading-[1.15] tracking-[-0.02em]">
          Ronak&apos;s Assistant
        </h1>
      </div>
      <nav className="flex-1 space-y-3 px-4 py-8">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded px-3 py-3 font-label text-[12px] uppercase tracking-[0.05em] transition-colors",
                isActive
                  ? "border-l-2 border-secondary bg-on-tertiary text-tertiary-container"
                  : "border-l-2 border-transparent text-on-tertiary-container hover:border-outline-variant hover:bg-inverse-surface"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn("material-symbols-outlined", isActive ? "filled" : "")}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-inverse-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant text-on-surface">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
          <div>
            <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-tertiary">
              Admin User
            </p>
            <p className="text-sm text-on-tertiary-container">Frontend Preview</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant bg-surface/95 px-4 pb-safe pt-2 backdrop-blur lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex min-w-16 flex-col items-center justify-center rounded px-2 py-2 text-on-surface-variant transition hover:bg-surface-container-lowest",
                isActive ? "text-secondary" : ""
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn("material-symbols-outlined", isActive ? "filled" : "")}>
                  {item.icon}
                </span>
                <span className="mt-1 font-label text-[11px] uppercase tracking-[0.05em]">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
