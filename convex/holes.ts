import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save or update a hole
export const saveHole = mutation({
  args: {
    roundId: v.id("rounds"),
    holeNumber: v.number(),
    par: v.number(),
    strokes: v.number(),
    
    // Optional detailed stats
    outOfPosition: v.optional(v.object({
      occurred: v.boolean(),
      reason: v.optional(v.string()),
    })),
    
    failedEasyUpDown: v.optional(v.object({
      occurred: v.boolean(),
      reason: v.optional(v.string()),
    })),
    
    threePutt: v.optional(v.object({
      occurred: v.boolean(),
      firstPuttDistance: v.optional(v.number()),
    })),
    
    penalty: v.optional(v.object({
      occurred: v.boolean(),
      type: v.optional(v.string()),
      reason: v.optional(v.string()),
    })),
    
    wedgeRange: v.optional(v.object({
      wasInWedgeRange: v.boolean(),
      shotsFromWedgeRange: v.optional(v.number()),
      reason: v.optional(v.string()),
    })),
    
    heroShotsAvoided: v.optional(v.object({
      occurred: v.boolean(),
      description: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify round ownership
    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) {
      throw new Error("Round not found or unauthorized");
    }

    // Check if hole already exists
    const existingHole = await ctx.db
      .query("holes")
      .withIndex("by_round_hole", (q) => 
        q.eq("roundId", args.roundId).eq("holeNumber", args.holeNumber)
      )
      .first();

    // Auto-calculate double bogey or worse
    const doubleBogeyOrWorse = args.strokes >= args.par + 2 
      ? { occurred: true, causedBy: undefined }
      : { occurred: false, causedBy: undefined };

    const holeData = {
      par: args.par,
      strokes: args.strokes,
      outOfPosition: args.outOfPosition,
      failedEasyUpDown: args.failedEasyUpDown,
      doubleBogeyOrWorse,
      threePutt: args.threePutt,
      penalty: args.penalty,
      wedgeRange: args.wedgeRange,
      heroShotsAvoided: args.heroShotsAvoided,
    };

    if (existingHole) {
      // Update existing hole
      await ctx.db.patch(existingHole._id, holeData);
      return existingHole._id;
    } else {
      // Create new hole
      const holeId = await ctx.db.insert("holes", {
        roundId: args.roundId,
        holeNumber: args.holeNumber,
        ...holeData,
        createdAt: Date.now(),
      });
      return holeId;
    }
  },
});

// Get all holes for a round
export const getHolesForRound = query({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Verify round ownership
    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) {
      return [];
    }

    const holes = await ctx.db
      .query("holes")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .order("asc")
      .collect();

    return holes;
  },
});

// Get a specific hole
export const getHole = query({
  args: {
    roundId: v.id("rounds"),
    holeNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Verify round ownership
    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) {
      return null;
    }

    const hole = await ctx.db
      .query("holes")
      .withIndex("by_round_hole", (q) => 
        q.eq("roundId", args.roundId).eq("holeNumber", args.holeNumber)
      )
      .first();

    return hole;
  },
});