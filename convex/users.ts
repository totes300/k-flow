import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, assertAdmin } from "./lib/auth";

export const upsertFromClerk = internalMutation({
  args: { data: v.any() },
  handler: async (ctx, { data }) => {
    const clerkId = data.id as string;
    const name = [data.first_name, data.last_name]
      .filter(Boolean)
      .join(" ")
      || data.email_addresses?.[0]?.email_address
      || "Unknown";
    const email =
      data.email_addresses?.find(
        (e: { id: string }) => e.id === data.primary_email_address_id,
      )?.email_address ?? "";
    const avatarUrl = data.image_url ?? undefined;
    const role = data.public_metadata?.role === "admin" ? "admin" : "team_member";

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { name, email, avatarUrl, role });
    } else {
      await ctx.db.insert("users", {
        clerkId,
        name,
        email,
        avatarUrl,
        role: role as "admin" | "team_member",
        isActive: true,
      });
    }
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);
    return ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});
