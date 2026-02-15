"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CheckSquare, Users, FolderOpen } from "lucide-react";

type SearchResult = {
  tasks: Array<{ _id: string; title: string }>;
  clients: Array<{ _id: string; name: string }>;
  projects: Array<{ _id: string; name: string }>;
};

export function CommandSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const results = useQuery(
    api.search.globalSearch,
    debouncedSearch.length >= 2 ? { searchTerm: debouncedSearch } : "skip",
  ) as SearchResult | undefined;

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = useCallback(
    (path: string) => {
      onOpenChange(false);
      setSearch("");
      router.push(path);
    },
    [router, onOpenChange],
  );

  const hasTasks = results?.tasks && results.tasks.length > 0;
  const hasClients = results?.clients && results.clients.length > 0;
  const hasProjects = results?.projects && results.projects.length > 0;
  const hasResults = hasTasks || hasClients || hasProjects;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search tasks, clients, projects..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {debouncedSearch.length >= 2 && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {hasTasks && (
          <CommandGroup heading="Tasks">
            {results.tasks.map((task) => (
              <CommandItem
                key={task._id}
                onSelect={() => handleSelect(`/tasks/${task._id}`)}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                {task.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {hasClients && (
          <CommandGroup heading="Clients">
            {results.clients.map((client) => (
              <CommandItem
                key={client._id}
                onSelect={() => handleSelect(`/clients/${client._id}`)}
              >
                <Users className="mr-2 h-4 w-4" />
                {client.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {hasProjects && (
          <CommandGroup heading="Projects">
            {results.projects.map((project) => (
              <CommandItem
                key={project._id}
                onSelect={() => handleSelect(`/projects/${project._id}`)}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                {project.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
