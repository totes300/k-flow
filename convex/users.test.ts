import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("upsertFromClerk", () => {
  it("creates new user from webhook data", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.upsertFromClerk, {
      data: {
        id: "clerk_1",
        first_name: "Alice",
        last_name: "Smith",
        email_addresses: [
          { id: "email_1", email_address: "alice@test.com" },
        ],
        primary_email_address_id: "email_1",
        image_url: "https://img.example.com/alice.jpg",
        public_metadata: {},
      },
    });

    const users = await t.run(async (ctx) => ctx.db.query("users").collect());
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      clerkId: "clerk_1",
      name: "Alice Smith",
      email: "alice@test.com",
      avatarUrl: "https://img.example.com/alice.jpg",
      role: "team_member",
      isActive: true,
    });
  });

  it("updates existing user", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.upsertFromClerk, {
      data: {
        id: "clerk_2",
        first_name: "Bob",
        last_name: null,
        email_addresses: [
          { id: "email_2", email_address: "bob@test.com" },
        ],
        primary_email_address_id: "email_2",
        public_metadata: {},
      },
    });

    await t.mutation(internal.users.upsertFromClerk, {
      data: {
        id: "clerk_2",
        first_name: "Robert",
        last_name: "Jones",
        email_addresses: [
          { id: "email_2", email_address: "robert@test.com" },
        ],
        primary_email_address_id: "email_2",
        public_metadata: {},
      },
    });

    const users = await t.run(async (ctx) => ctx.db.query("users").collect());
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      name: "Robert Jones",
      email: "robert@test.com",
    });
  });

  it("defaults role to team_member", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.upsertFromClerk, {
      data: {
        id: "clerk_3",
        first_name: "Carol",
        email_addresses: [
          { id: "email_3", email_address: "carol@test.com" },
        ],
        primary_email_address_id: "email_3",
        public_metadata: {},
      },
    });

    const users = await t.run(async (ctx) => ctx.db.query("users").collect());
    expect(users[0].role).toBe("team_member");
  });

  it("respects admin role from metadata", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.upsertFromClerk, {
      data: {
        id: "clerk_4",
        first_name: "Dave",
        email_addresses: [
          { id: "email_4", email_address: "dave@test.com" },
        ],
        primary_email_address_id: "email_4",
        public_metadata: { role: "admin" },
      },
    });

    const users = await t.run(async (ctx) => ctx.db.query("users").collect());
    expect(users[0].role).toBe("admin");
  });
});
