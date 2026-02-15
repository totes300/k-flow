import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../schema";
import { api } from "../_generated/api";

const modules = import.meta.glob("../**/*.ts");

async function seedUser(
  t: ReturnType<typeof convexTest>,
  opts: {
    clerkId: string;
    name: string;
    role: "admin" | "team_member";
    isActive?: boolean;
  },
) {
  return t.run(async (ctx) => {
    return ctx.db.insert("users", {
      clerkId: opts.clerkId,
      name: opts.name,
      email: `${opts.clerkId}@test.com`,
      role: opts.role,
      isActive: opts.isActive ?? true,
    });
  });
}

describe("getAuthUser (via getMe)", () => {
  it("throws for unauthenticated request", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.users.getMe, {});
    expect(result).toBeNull();
  });

  it("returns user for valid identity", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, { clerkId: "user_1", name: "Alice", role: "team_member" });
    const asAlice = t.withIdentity({ subject: "user_1" });
    const result = await asAlice.query(api.users.getMe, {});
    expect(result).toMatchObject({ name: "Alice", role: "team_member" });
  });
});

describe("assertAdmin (via listAll)", () => {
  it("throws for team_member", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, { clerkId: "user_tm", name: "Bob", role: "team_member" });
    const asBob = t.withIdentity({ subject: "user_tm" });
    await expect(asBob.query(api.users.listAll, {})).rejects.toThrow(
      "Admin access required",
    );
  });

  it("passes for admin", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, { clerkId: "user_admin", name: "Carol", role: "admin" });
    const asCarol = t.withIdentity({ subject: "user_admin" });
    const result = await asCarol.query(api.users.listAll, {});
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Carol");
  });

  it("throws for deactivated user", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, {
      clerkId: "user_gone",
      name: "Dave",
      role: "admin",
      isActive: false,
    });
    const asDave = t.withIdentity({ subject: "user_gone" });
    await expect(asDave.query(api.users.listAll, {})).rejects.toThrow(
      "User account is deactivated",
    );
  });
});
