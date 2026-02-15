import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./lib/auth";

export const globalSearch = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const user = await getAuthUser(ctx);
    const term = searchTerm.toLowerCase().trim();

    if (term.length < 2) {
      return { tasks: [], clients: [], projects: [] };
    }

    // Tasks — team_member sees only assigned
    const allTasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    const filteredTasks = allTasks
      .filter((t) => {
        if (!t.title.toLowerCase().includes(term)) return false;
        if (t.parentTaskId) return false;
        if (user.role === "team_member") {
          return t.assigneeIds.includes(user._id);
        }
        return true;
      })
      .slice(0, 5);

    // Clients — admin only
    let clients: { _id: string; name: string }[] = [];
    if (user.role === "admin") {
      const allClients = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("isArchived"), false))
        .collect();
      clients = allClients
        .filter((c) => c.name.toLowerCase().includes(term))
        .slice(0, 5);
    }

    // Projects — admin only
    let projects: { _id: string; name: string }[] = [];
    if (user.role === "admin") {
      const allProjects = await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("isArchived"), false))
        .collect();
      projects = allProjects
        .filter((p) => p.name.toLowerCase().includes(term))
        .slice(0, 5);
    }

    return { tasks: filteredTasks, clients, projects };
  },
});
