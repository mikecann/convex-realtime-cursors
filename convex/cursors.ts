import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeCursorBatch = mutation({
  args: {
    userId: v.id("users"),
    movements: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        timestamp: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Update user's last activity time
    await ctx.db.patch(args.userId, {
      lastUpdate: Date.now(),
    });

    // Find existing batch for this user
    const existingBatch = await ctx.db
      .query("cursorBatches")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const now = Date.now();

    if (existingBatch) {
      // Replace existing batch with new one
      await ctx.db.patch(existingBatch._id, {
        movements: args.movements,
        batchTimestamp: now,
      });
    } else {
      // Create a new batch if none exists
      await ctx.db.insert("cursorBatches", {
        userId: args.userId,
        movements: args.movements,
        batchTimestamp: now,
      });
    }
  },
});

export const getRecentCursorBatches = query({
  args: {
    lastProcessedTimestamps: v.optional(v.record(v.id("users"), v.number())),
  },
  handler: async (ctx, args) => {
    // Get all cursor batches
    const batches = await ctx.db.query("cursorBatches").collect();

    // If no processed timestamps provided, return all batches
    if (!args.lastProcessedTimestamps) {
      return batches;
    }

    // Filter out batches that the client has already processed
    return batches.filter((batch) => {
      // Get the last processed timestamp for this user
      const lastProcessed = args.lastProcessedTimestamps?.[batch.userId];

      // Include this batch if:
      // 1. We've never processed a batch from this user, OR
      // 2. This batch is newer than the last one we processed
      return !lastProcessed || batch.batchTimestamp > lastProcessed;
    });
  },
});
