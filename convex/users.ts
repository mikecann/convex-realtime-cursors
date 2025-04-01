import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    name: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      emoji: args.emoji,
      cursorX: 0,
      cursorY: 0,
      lastUpdate: Date.now(),
    });
    return { userId };
  },
});

export const updateCursor = mutation({
  args: {
    userId: v.id("users"),
    cursorX: v.number(),
    cursorY: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      cursorX: args.cursorX,
      cursorY: args.cursorY,
      lastUpdate: Date.now(),
    });
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error(`User with ID '${args.userId}' not found`);
    return user;
  },
});

export const getActiveUsers = query({
  args: {},
  handler: async (ctx) => {
    // Get users who have moved their cursor in the last 30 seconds
    const thirtySecondsAgo = Date.now() - 30_000;
    return await ctx.db
      .query("users")
      .filter((q) => q.gt(q.field("lastUpdate"), thirtySecondsAgo))
      .collect();
  },
});
