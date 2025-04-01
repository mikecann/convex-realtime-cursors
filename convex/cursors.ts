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
    // Update the user's current position to the last position in the batch
    const lastMovement = args.movements[args.movements.length - 1];
    await ctx.db.patch(args.userId, {
      cursorX: lastMovement.x,
      cursorY: lastMovement.y,
      lastUpdate: Date.now(),
    });

    // Store the batch of movements
    await ctx.db.insert("cursorBatches", {
      userId: args.userId,
      movements: args.movements,
      batchTimestamp: Date.now(),
    });
  },
});

export const getRecentCursorBatches = query({
  args: {
    sinceTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Get batches newer than the specified timestamp
    return await ctx.db
      .query("cursorBatches")
      .filter((q) => q.gt(q.field("batchTimestamp"), args.sinceTimestamp))
      .order("asc")
      .collect();
  },
});
