import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");

async function seedForSearch(t: ReturnType<typeof convexTest>) {
  const adminId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      clerkId: "admin_1",
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
      isActive: true,
    }),
  );

  const memberId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      clerkId: "member_1",
      name: "Member",
      email: "member@test.com",
      role: "team_member",
      isActive: true,
    }),
  );

  const clientId = await t.run(async (ctx) =>
    ctx.db.insert("clients", {
      name: "Acme Corp",
      currency: "USD",
      isArchived: false,
    }),
  );

  const archivedClientId = await t.run(async (ctx) =>
    ctx.db.insert("clients", {
      name: "Acme Old",
      currency: "EUR",
      isArchived: true,
    }),
  );

  const projectId = await t.run(async (ctx) =>
    ctx.db.insert("projects", {
      clientId,
      name: "Website Redesign",
      type: "fixed",
      isArchived: false,
    }),
  );

  // Regular task assigned to member
  await t.run(async (ctx) =>
    ctx.db.insert("tasks", {
      title: "Design homepage",
      status: "todo",
      assigneeIds: [memberId],
      billable: true,
      isArchived: false,
    }),
  );

  // Task NOT assigned to member
  await t.run(async (ctx) =>
    ctx.db.insert("tasks", {
      title: "Design admin panel",
      status: "todo",
      assigneeIds: [adminId],
      billable: true,
      isArchived: false,
    }),
  );

  // Archived task
  await t.run(async (ctx) =>
    ctx.db.insert("tasks", {
      title: "Design old page",
      status: "completed",
      assigneeIds: [memberId],
      billable: true,
      isArchived: true,
    }),
  );

  return { adminId, memberId, clientId, projectId };
}

describe("globalSearch", () => {
  it("returns empty for short query", async () => {
    const t = convexTest(schema, modules);
    await seedForSearch(t);
    const asAdmin = t.withIdentity({ subject: "admin_1" });
    const result = await asAdmin.query(api.search.globalSearch, {
      searchTerm: "a",
    });
    expect(result).toEqual({ tasks: [], clients: [], projects: [] });
  });

  it("finds tasks by title", async () => {
    const t = convexTest(schema, modules);
    await seedForSearch(t);
    const asAdmin = t.withIdentity({ subject: "admin_1" });
    const result = await asAdmin.query(api.search.globalSearch, {
      searchTerm: "design",
    });
    expect(result.tasks).toHaveLength(2);
  });

  it("team_member only sees assigned tasks", async () => {
    const t = convexTest(schema, modules);
    await seedForSearch(t);
    const asMember = t.withIdentity({ subject: "member_1" });
    const result = await asMember.query(api.search.globalSearch, {
      searchTerm: "design",
    });
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe("Design homepage");
  });

  it("admin sees clients and projects", async () => {
    const t = convexTest(schema, modules);
    await seedForSearch(t);
    const asAdmin = t.withIdentity({ subject: "admin_1" });
    const result = await asAdmin.query(api.search.globalSearch, {
      searchTerm: "acme",
    });
    expect(result.clients).toHaveLength(1);
    expect(result.clients[0].name).toBe("Acme Corp");
  });

  it("team_member gets empty clients/projects", async () => {
    const t = convexTest(schema, modules);
    await seedForSearch(t);
    const asMember = t.withIdentity({ subject: "member_1" });
    const result = await asMember.query(api.search.globalSearch, {
      searchTerm: "acme",
    });
    expect(result.clients).toHaveLength(0);
    expect(result.projects).toHaveLength(0);
  });

  it("excludes archived records", async () => {
    const t = convexTest(schema, modules);
    await seedForSearch(t);
    const asAdmin = t.withIdentity({ subject: "admin_1" });

    const taskResult = await asAdmin.query(api.search.globalSearch, {
      searchTerm: "design old",
    });
    // "Design old page" is archived, so not found
    expect(
      taskResult.tasks.find((t: { title: string }) => t.title === "Design old page"),
    ).toBeUndefined();

    const clientResult = await asAdmin.query(api.search.globalSearch, {
      searchTerm: "acme old",
    });
    expect(
      clientResult.clients.find((c: { name: string }) => c.name === "Acme Old"),
    ).toBeUndefined();
  });

  it("caps results at 5 per group", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        clerkId: "admin_cap",
        name: "Admin",
        email: "admin@cap.com",
        role: "admin",
        isActive: true,
      }),
    );

    for (let i = 0; i < 8; i++) {
      await t.run(async (ctx) =>
        ctx.db.insert("tasks", {
          title: `Task item ${i}`,
          status: "todo",
          assigneeIds: [adminId],
          billable: true,
          isArchived: false,
        }),
      );
    }

    const asAdmin = t.withIdentity({ subject: "admin_cap" });
    const result = await asAdmin.query(api.search.globalSearch, {
      searchTerm: "task item",
    });
    expect(result.tasks).toHaveLength(5);
  });

  it("is case-insensitive", async () => {
    const t = convexTest(schema, modules);
    await seedForSearch(t);
    const asAdmin = t.withIdentity({ subject: "admin_1" });
    const result = await asAdmin.query(api.search.globalSearch, {
      searchTerm: "DESIGN",
    });
    expect(result.tasks.length).toBeGreaterThan(0);
  });
});
