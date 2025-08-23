import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Create a new round
export const createRound = mutation({
  args: {
    courseName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const roundId = await ctx.db.insert("rounds", {
      userId: identity.subject,
      courseName: args.courseName,
      date: Date.now(),
      createdAt: Date.now(),
      isComplete: false,
    });

    return roundId;
  },
});

// Get all rounds for the current user
export const getRounds = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = args.limit || 10;
    
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", identity.subject)
      )
      .order("desc")
      .take(limit);

    return rounds;
  },
});

// Get a single round with its holes
export const getRound = query({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) return null;

    const holes = await ctx.db
      .query("holes")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .order("asc")
      .collect();

    return {
      ...round,
      holes,
    };
  },
});

// Get recent rounds for dashboard
export const getRecentRounds = query({
  args: {
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { rounds: [], averageScore: 0 };

    const count = args.count || 5;
    
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("isComplete"), true))
      .order("desc")
      .take(count);

    const scores = rounds
      .filter(r => r.totalScore !== undefined)
      .map(r => r.totalScore!);
    
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      rounds,
      averageScore,
    };
  },
});

// Complete a round
export const completeRound = mutation({
  args: {
    roundId: v.id("rounds"),
    totalScore: v.number(),
    totalPar: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) {
      throw new Error("Round not found or unauthorized");
    }

    await ctx.db.patch(args.roundId, {
      totalScore: args.totalScore,
      totalPar: args.totalPar,
      completedAt: Date.now(),
      isComplete: true,
    });

    return { success: true };
  },
});

// Delete a round
export const deleteRound = mutation({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) {
      throw new Error("Round not found or unauthorized");
    }

    // Delete all holes for this round
    const holes = await ctx.db
      .query("holes")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    for (const hole of holes) {
      await ctx.db.delete(hole._id);
    }

    // Delete the round
    await ctx.db.delete(args.roundId);

    return { success: true };
  },
});