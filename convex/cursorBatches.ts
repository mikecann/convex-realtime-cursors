import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {
    userId: v.id("users"),
    movements: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        timeSinceBatchStart: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Find existing batch for this user
    const existingBatch = await ctx.db
      .query("cursorBatches")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingBatch)
      // Replace existing batch with new one
      return await ctx.db.patch(existingBatch._id, {
        movements: args.movements,
      });

    // Create a new batch if none exists
    await ctx.db.insert("cursorBatches", {
      userId: args.userId,
      movements: args.movements,
    });
  },
});

export const find = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cursorBatches")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});
