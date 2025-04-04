import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    emoji: v.string(),
  }),

  cursorBatches: defineTable({
    userId: v.id("users"),
    actions: v.array(
      v.union(
        v.object({
          kind: v.literal("movement"),
          x: v.number(),
          y: v.number(),
          timeSinceBatchStart: v.number(),
        }),
        v.object({
          kind: v.literal("click"),
          x: v.number(),
          y: v.number(),
          timeSinceBatchStart: v.number(),
        }),
      ),
    ),
  }).index("by_userId", ["userId"]),
});
