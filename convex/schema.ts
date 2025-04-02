import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    emoji: v.string(),
  }),

  cursorBatches: defineTable({
    userId: v.id("users"),
    movements: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        timeSinceBatchStart: v.number(),
      }),
    ),
  }).index("by_userId", ["userId"]),
});
