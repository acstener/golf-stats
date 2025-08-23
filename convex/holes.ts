import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save or update a hole
export const saveHole = mutation({
  args: {
    roundId: v.id("rounds"),
    holeNumber: v.number(),
    par: v.number(),
    strokes: v.number(),
    stats: v.object({
      threePutt: v.boolean(),
      penalty: v.boolean(),
      bunker: v.boolean(),
      waterHazard: v.boolean(),
      outOfBounds: v.boolean(),
      duffedChip: v.boolean(),
    }),
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

    if (existingHole) {
      // Update existing hole
      await ctx.db.patch(existingHole._id, {
        par: args.par,
        strokes: args.strokes,
        stats: args.stats,
      });
      return existingHole._id;
    } else {
      // Create new hole
      const holeId = await ctx.db.insert("holes", {
        roundId: args.roundId,
        holeNumber: args.holeNumber,
        par: args.par,
        strokes: args.strokes,
        stats: args.stats,
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