import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { roundValidator, roundWithHolesValidator, trackingModeValidator } from "./validators";

export const createRound = mutation({
  args: {
    courseName: v.string(),
    courseId: v.optional(v.string()),
    teeId: v.optional(v.string()),
    teeName: v.optional(v.string()),
    trackingMode: v.optional(trackingModeValidator),
  },
  returns: v.id("rounds"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be signed in to create a round.",
      });
    }

    const roundId = await ctx.db.insert("rounds", {
      userId: identity.subject,
      courseName: args.courseName,
      courseId: args.courseId,
      teeId: args.teeId,
      teeName: args.teeName,
      trackingMode: args.trackingMode ?? "six",
      date: Date.now(),
      createdAt: Date.now(),
      isComplete: false,
    });

    return roundId;
  },
});

export const getRounds = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(roundValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = args.limit ?? 10;
    return await ctx.db
      .query("rounds")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);
  },
});

export const getRound = query({
  args: { roundId: v.id("rounds") },
  returns: v.union(v.null(), roundWithHolesValidator),
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

    return { ...round, holes };
  },
});

export const getRecentRounds = query({
  args: { count: v.optional(v.number()) },
  returns: v.object({
    rounds: v.array(roundValidator),
    averageScore: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { rounds: [], averageScore: 0 };

    const count = args.count ?? 5;

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isComplete"), true))
      .order("desc")
      .take(count);

    const scores = rounds
      .filter((r) => r.totalScore !== undefined)
      .map((r) => r.totalScore!);

    const averageScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return { rounds, averageScore };
  },
});

// Most-recent in-progress round (for the "Resume" card on Track screen).
export const getIncompleteRound = query({
  args: {},
  returns: v.union(v.null(), roundWithHolesValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const round = await ctx.db
      .query("rounds")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isComplete"), false))
      .order("desc")
      .first();

    if (!round) return null;

    const holes = await ctx.db
      .query("holes")
      .withIndex("by_round", (q) => q.eq("roundId", round._id))
      .order("asc")
      .collect();

    return { ...round, holes };
  },
});

export const completeRound = mutation({
  args: {
    roundId: v.id("rounds"),
    totalScore: v.number(),
    totalPar: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be signed in.",
      });
    }

    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Round not found.",
      });
    }

    // Idempotent: bail out cleanly if already finalised so a repeated effect
    // (e.g. summary screen mounting twice) doesn't double-write.
    if (round.isComplete) return null;

    await ctx.db.patch(args.roundId, {
      totalScore: args.totalScore,
      totalPar: args.totalPar,
      completedAt: Date.now(),
      isComplete: true,
    });

    return null;
  },
});

export const deleteRound = mutation({
  args: { roundId: v.id("rounds") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be signed in.",
      });
    }

    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Round not found.",
      });
    }

    const holes = await ctx.db
      .query("holes")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();

    await Promise.all(holes.map((h) => ctx.db.delete(h._id)));
    await ctx.db.delete(args.roundId);

    return null;
  },
});
