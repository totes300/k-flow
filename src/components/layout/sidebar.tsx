import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r border-[var(--border)] bg-[var(--sidebar-background)]">
      <div className="flex h-14 items-center border-b border-[var(--border)] px-6">
        <span className="text-lg font-semibold">Agency Flow</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav />
      </div>
    </aside>
  );
}
