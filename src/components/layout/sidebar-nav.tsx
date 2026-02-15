"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Sun,
  Users,
  FolderOpen,
  Clock,
  CalendarDays,
  FileText,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

const navItems = [
  { label: "Tasks", path: "/tasks", icon: CheckSquare, adminOnly: false },
  { label: "Today", path: "/today", icon: Sun, adminOnly: false },
  { label: "Clients", path: "/clients", icon: Users, adminOnly: true },
  { label: "Projects", path: "/projects", icon: FolderOpen, adminOnly: true },
  { label: "My Time", path: "/my-time", icon: Clock, adminOnly: false },
  { label: "Daily Summary", path: "/daily-summary", icon: CalendarDays, adminOnly: true },
  { label: "Timesheets", path: "/timesheets", icon: FileText, adminOnly: true },
  { label: "Team", path: "/team", icon: UsersRound, adminOnly: true },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useCurrentUser();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <nav className="flex flex-col gap-1 px-3">
      {visibleItems.map((item) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            href={item.path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
