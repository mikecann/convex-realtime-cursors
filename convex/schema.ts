import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


export default defineSchema({
  batches: defineTable({
    actions: v.array(v.object({
      action: v.string(),
      timestamp: v.number(),
    })),
  }),
  
  

});
