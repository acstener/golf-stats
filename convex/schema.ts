import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  // Golf rounds table
  rounds: defineTable({
    userId: v.string(),        // Clerk user ID
    date: v.number(),          // Unix timestamp
    courseName: v.string(),
    courseId: v.optional(v.string()),  // slug from lib/courses, if known
    teeId: v.optional(v.string()),     // tee played from
    teeName: v.optional(v.string()),   // human-readable tee name snapshot
    // What stat depth the user opted into for this round. Drives the hole
    // tracker UI + which data we collect. Absent = legacy round (treat as
    // "six" for backward compat).
    //   "score":    par + strokes per hole only
    //   "six":      score + the six per-hole stats (default)
    //   "classic":  score + FIR / GIR / putts / drive distance per hole
    trackingMode: v.optional(
      v.union(v.literal("score"), v.literal("six"), v.literal("classic")),
    ),
    // Which 9 holes the player is tracking. Absent = legacy round (treat
    // as "full" for backward compat).
    //   "full":  all 18 holes
    //   "front": holes 1–9 only
    //   "back":  holes 10–18 only
    nineMode: v.optional(
      v.union(v.literal("full"), v.literal("front"), v.literal("back")),
    ),
    totalScore: v.optional(v.number()),
    totalPar: v.optional(v.number()),
    // Frozen at round-creation time. Lets us recompute Stableford even if
    // the user later edits their handicap index or the tee/course data
    // changes. Calculated client-side from courseHandicap × 0.95
    // (Stableford allowance), so we only need to store the final integer
    // strokes-received-per-round value.
    playingHandicap: v.optional(v.number()),
    // Per-tee playing handicap context, snapshotted so we can show how
    // we got the number ("8.6 → 11 CH → 10 PH at White (CR 72.9, S 134)").
    handicapIndex: v.optional(v.number()),
    courseHandicap: v.optional(v.number()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    isComplete: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // Player profile — one row per Clerk user. Stores handicap and any
  // future preferences. Keyed by userId (Clerk subject).
  userProfiles: defineTable({
    userId: v.string(),
    // WHS Handicap Index — e.g. 8.6 means single-digit handicap.
    // Range typically [-5.0, 54.0]. Stored as the raw decimal, NOT
    // multiplied — we convert to course/playing handicap per round.
    handicapIndex: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  
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

    // Classic stats (populated when round.trackingMode === "classic").
    // FIR is N/A on par 3, so undefined when not applicable / not entered.
    fir: v.optional(v.boolean()),
    gir: v.optional(v.boolean()),
    putts: v.optional(v.number()),
    driveDistance: v.optional(v.number()), // yards

    createdAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_hole", ["roundId", "holeNumber"]),
  
  // Shot-by-shot data (only populated when the round is in
  // trackingMode = "strokes-gained"). Each shot records the lie it was
  // played from + distance to the pin, enough to compute strokes gained
  // against a benchmark table later.
  shots: defineTable({
    roundId: v.id("rounds"),
    holeNumber: v.number(),
    shotNumber: v.number(),
    lie: v.union(
      v.literal("tee"),
      v.literal("fairway"),
      v.literal("rough"),
      v.literal("sand"),
      v.literal("recovery"),
      v.literal("green"),
      v.literal("penalty"),
    ),
    // Yards from tee/fairway/rough/sand/recovery, feet from the green.
    distance: v.optional(v.number()),
    // Where the ball ended up. Used as the next shot's starting lie or as
    // "hole" for the final stroke.
    result: v.optional(
      v.union(
        v.literal("fairway"),
        v.literal("rough"),
        v.literal("sand"),
        v.literal("green"),
        v.literal("hole"),
        v.literal("penalty-water"),
        v.literal("penalty-ob"),
        v.literal("penalty-lost"),
        v.literal("recovery"),
      ),
    ),
    club: v.optional(v.string()),
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
