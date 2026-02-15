import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("team_member")),
    timerTaskId: v.optional(v.id("tasks")),
    timerStartedAt: v.optional(v.number()),
    recentProjectIds: v.optional(v.array(v.id("projects"))),
    isActive: v.boolean(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  clients: defineTable({
    name: v.string(),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    currency: v.union(
      v.literal("EUR"),
      v.literal("USD"),
      v.literal("HUF"),
    ),
    isArchived: v.boolean(),
  }).index("by_isArchived", ["isArchived"]),

  projects: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    type: v.union(
      v.literal("fixed"),
      v.literal("retainer"),
      v.literal("t_and_m"),
    ),
    isArchived: v.boolean(),
    defaultAssignees: v.optional(v.array(v.id("users"))),
    // Retainer fields
    monthlyHours: v.optional(v.number()),
    overageRate: v.optional(v.number()),
    // Shared fields
    startDate: v.optional(v.string()),
    status: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    // Fixed project category rates
    categoryRates: v.optional(
      v.array(
        v.object({
          workCategoryId: v.id("workCategories"),
          rate: v.number(),
        }),
      ),
    ),
  })
    .index("by_clientId", ["clientId"])
    .index("by_isArchived", ["isArchived"])
    .index("by_clientId_isArchived", ["clientId", "isArchived"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.any()),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    projectId: v.optional(v.id("projects")),
    parentTaskId: v.optional(v.id("tasks")),
    assigneeIds: v.array(v.id("users")),
    workCategoryId: v.optional(v.id("workCategories")),
    estimate: v.optional(v.number()),
    billable: v.boolean(),
    clientUpdateText: v.optional(v.string()),
    isArchived: v.boolean(),
    order: v.optional(v.number()),
  })
    .index("by_projectId", ["projectId"])
    .index("by_parentTaskId", ["parentTaskId"])
    .index("by_status", ["status"])
    .index("by_isArchived", ["isArchived"])
    .index("by_projectId_isArchived", ["projectId", "isArchived"]),

  timeEntries: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    date: v.string(),
    duration: v.number(),
    note: v.optional(v.string()),
    method: v.union(v.literal("timer"), v.literal("manual")),
  })
    .index("by_taskId", ["taskId"])
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_taskId_userId", ["taskId", "userId"]),

  comments: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    content: v.any(),
  }).index("by_taskId", ["taskId"]),

  attachments: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
  }).index("by_taskId", ["taskId"]),

  activityLogEntries: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    action: v.string(),
    details: v.optional(v.any()),
  }).index("by_taskId", ["taskId"]),

  workCategories: defineTable({
    name: v.string(),
    isArchived: v.boolean(),
  }),

  timesheets: defineTable({
    clientId: v.id("clients"),
    period: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
    ),
    generatedAt: v.number(),
    data: v.optional(v.any()),
  })
    .index("by_clientId", ["clientId"])
    .index("by_clientId_period", ["clientId", "period"]),

  retainerPeriods: defineTable({
    projectId: v.id("projects"),
    period: v.string(),
    includedHours: v.number(),
    rolloverHours: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_projectId_period", ["projectId", "period"]),

  projectCategoryEstimates: defineTable({
    projectId: v.id("projects"),
    workCategoryId: v.id("workCategories"),
    estimatedMinutes: v.number(),
    sourcedRate: v.number(),
    billedRate: v.number(),
  }).index("by_projectId", ["projectId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    taskId: v.optional(v.id("tasks")),
    actorId: v.id("users"),
    isRead: v.boolean(),
    message: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  todayOrder: defineTable({
    userId: v.id("users"),
    taskIds: v.array(v.id("tasks")),
  }).index("by_userId", ["userId"]),
});
