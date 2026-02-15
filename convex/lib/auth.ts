import { QueryCtx, MutationCtx } from "../_generated/server";

export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) {
    throw new Error("User not found in database");
  }
  if (!user.isActive) {
    throw new Error("User account is deactivated");
  }
  return user;
}

export async function assertAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

export async function getOptionalUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}
