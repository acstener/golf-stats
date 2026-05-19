import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { lieValidator, resultLieValidator, shotValidator } from "./validators";

// Save a single shot (used by strokes-gained tracking mode).
// Upserts on (roundId, holeNumber, shotNumber) so editing a shot updates
// in place rather than appending a duplicate.
export const saveShot = mutation({
  args: {
    roundId: v.id("rounds"),
    holeNumber: v.number(),
    shotNumber: v.number(),
    lie: lieValidator,
    distance: v.optional(v.number()),
    result: v.optional(resultLieValidator),
    club: v.optional(v.string()),
  },
  returns: v.id("shots"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be signed in to save a shot.",
      });
    }

    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Round not found." });
    }

    const existing = await ctx.db
      .query("shots")
      .withIndex("by_round_hole", (q) =>
        q.eq("roundId", args.roundId).eq("holeNumber", args.holeNumber),
      )
      .collect();

    const match = existing.find((s) => s.shotNumber === args.shotNumber);
    const payload = {
      lie: args.lie,
      distance: args.distance,
      result: args.result,
      club: args.club,
    };

    if (match) {
      await ctx.db.patch(match._id, payload);
      return match._id;
    }

    return await ctx.db.insert("shots", {
      roundId: args.roundId,
      holeNumber: args.holeNumber,
      shotNumber: args.shotNumber,
      ...payload,
      createdAt: Date.now(),
    });
  },
});

export const deleteShot = mutation({
  args: { shotId: v.id("shots") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHENTICATED", message: "Sign in required." });
    }
    const shot = await ctx.db.get(args.shotId);
    if (!shot) return null;
    const round = await ctx.db.get(shot.roundId);
    if (!round || round.userId !== identity.subject) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Shot not found." });
    }
    await ctx.db.delete(args.shotId);
    return null;
  },
});

export const getShotsForRound = query({
  args: { roundId: v.id("rounds") },
  returns: v.array(shotValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) return [];
    return await ctx.db
      .query("shots")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .order("asc")
      .collect();
  },
});

export const getShotsForHole = query({
  args: { roundId: v.id("rounds"), holeNumber: v.number() },
  returns: v.array(shotValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) return [];
    return await ctx.db
      .query("shots")
      .withIndex("by_round_hole", (q) =>
        q.eq("roundId", args.roundId).eq("holeNumber", args.holeNumber),
      )
      .order("asc")
      .collect();
  },
});
