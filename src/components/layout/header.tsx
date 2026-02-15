"use client";

import { UserButton } from "@clerk/nextjs";
import { MobileSidebar } from "./mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function Header({
  onSearchOpen,
}: {
  onSearchOpen: () => void;
}) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-[var(--border)] px-4 md:px-6">
      <MobileSidebar />
      <div className="flex-1" />
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center gap-2 text-[var(--muted-foreground)]"
        onClick={onSearchOpen}
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-2 rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-xs">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={onSearchOpen}
      >
        <Search className="h-5 w-5" />
      </Button>
      <UserButton afterSignOutUrl="/sign-in" />
    </header>
  );
}
