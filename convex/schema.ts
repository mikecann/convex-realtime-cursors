import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cursorBatches: defineTable({
    userId: v.id("users"),
    movements: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        timestamp: v.number(),
      }),
    ),
    batchTimestamp: v.number(),
  }),
  users: defineTable({
    name: v.string(),
    emoji: v.string(),
    cursorX: v.number(),
    cursorY: v.number(),
    lastUpdate: v.number(),
  }),
});
