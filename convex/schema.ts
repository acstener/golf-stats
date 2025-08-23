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
    
    // Core stats to track
    outOfPosition: v.optional(v.object({
      occurred: v.boolean(),
      reason: v.optional(v.string()), // "lack of commitment", "wrong club", "not warmed up", etc.
    })),
    
    failedEasyUpDown: v.optional(v.object({
      occurred: v.boolean(),
      reason: v.optional(v.string()), // "poor aim", "wrong club", "lack of commitment", etc.
    })),
    
    doubleBogeyOrWorse: v.optional(v.object({
      occurred: v.boolean(),
      causedBy: v.optional(v.string()), // "drive", "approach", "chip", "putt"
    })),
    
    threePutt: v.optional(v.object({
      occurred: v.boolean(),
      firstPuttDistance: v.optional(v.number()), // in feet
    })),
    
    penalty: v.optional(v.object({
      occurred: v.boolean(),
      type: v.optional(v.string()), // "water", "OB", "lost ball"
      reason: v.optional(v.string()), // "wrong club", "ego distance", "poor aim", "uncommitted"
    })),
    
    wedgeRange: v.optional(v.object({
      wasInWedgeRange: v.boolean(), // Did you have ≤120 yards to pin?
      shotsFromWedgeRange: v.optional(v.number()), // Total shots from there to holed out
      reason: v.optional(v.string()), // Why > 3 shots: "bad approach", "bad lag putt", "bad short putt", "double chip"
    })),
    
    heroShotsAvoided: v.optional(v.object({
      occurred: v.boolean(),
      description: v.optional(v.string()), // What hero shot did you avoid?
    })),
    
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
