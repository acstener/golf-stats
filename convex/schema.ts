import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  // Golf rounds table
  rounds: defineTable({
    userId: v.string(),        // Clerk user ID
    date: v.number(),          // Unix timestamp
    courseName: v.string(),
    totalScore: v.optional(v.number()),
    totalPar: v.optional(v.number()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    isComplete: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),
  
  // Individual holes table
  holes: defineTable({
    roundId: v.id("rounds"),
    holeNumber: v.number(),    // 1-18
    par: v.number(),           // 3, 4, or 5
    strokes: v.number(),
    stats: v.object({
      threePutt: v.boolean(),
      penalty: v.boolean(),
      bunker: v.boolean(),
      waterHazard: v.boolean(),
      outOfBounds: v.boolean(),
      duffedChip: v.boolean(),
    }),
    createdAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_hole", ["roundId", "holeNumber"]),
  
  // Aggregated user statistics
  userStats: defineTable({
    userId: v.string(),
    lastUpdated: v.number(),
    averages: v.object({
      score: v.number(),
      threePutts: v.number(),
      penalties: v.number(),
      bunkers: v.number(),
      waterHazards: v.number(),
      outOfBounds: v.number(),
      duffedChips: v.number(),
    }),
    roundsPlayed: v.number(),
  })
    .index("by_user", ["userId"]),
});

export default schema;
