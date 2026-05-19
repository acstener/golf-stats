import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  blank,
  failedEasyUpDownShape,
  heroShotsAvoidedShape,
  holeValidator,
  outOfPositionShape,
  penaltyShape,
  threePuttShape,
  wedgeRangeShape,
} from "./validators";

export const saveHole = mutation({
  args: {
    roundId: v.id("rounds"),
    holeNumber: v.number(),
    par: v.number(),
    strokes: v.number(),
    outOfPosition: v.optional(outOfPositionShape),
    failedEasyUpDown: v.optional(failedEasyUpDownShape),
    threePutt: v.optional(threePuttShape),
    penalty: v.optional(penaltyShape),
    wedgeRange: v.optional(wedgeRangeShape),
    heroShotsAvoided: v.optional(heroShotsAvoidedShape),
  },
  returns: v.id("holes"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be signed in to save a hole.",
      });
    }

    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Round not found.",
      });
    }

    const existingHole = await ctx.db
      .query("holes")
      .withIndex("by_round_hole", (q) =>
        q.eq("roundId", args.roundId).eq("holeNumber", args.holeNumber),
      )
      .first();

    // Server-side auto-calc — double bogey+ derives from strokes vs par.
    const doubleBogeyOrWorse =
      args.strokes >= args.par + 2
        ? { occurred: true, causedBy: undefined }
        : { occurred: false, causedBy: undefined };

    // Normalize: turn empty-string reasons into undefined so stats analysis
    // sees clean data ("user didn't pick a reason") instead of mixing "" with
    // real values like "lack-of-commitment".
    const holeData = {
      par: args.par,
      strokes: args.strokes,
      outOfPosition: blank(args.outOfPosition),
      failedEasyUpDown: blank(args.failedEasyUpDown),
      doubleBogeyOrWorse,
      threePutt: blank(args.threePutt),
      penalty: blank(args.penalty),
      wedgeRange: blank(args.wedgeRange),
      heroShotsAvoided: blank(args.heroShotsAvoided),
    };

    if (existingHole) {
      await ctx.db.patch(existingHole._id, holeData);
      return existingHole._id;
    }

    return await ctx.db.insert("holes", {
      roundId: args.roundId,
      holeNumber: args.holeNumber,
      ...holeData,
      createdAt: Date.now(),
    });
  },
});

export const getHolesForRound = query({
  args: { roundId: v.id("rounds") },
  returns: v.array(holeValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) return [];

    return await ctx.db
      .query("holes")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .order("asc")
      .collect();
  },
});

export const getHole = query({
  args: { roundId: v.id("rounds"), holeNumber: v.number() },
  returns: v.union(v.null(), holeValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const round = await ctx.db.get(args.roundId);
    if (!round || round.userId !== identity.subject) return null;

    return await ctx.db
      .query("holes")
      .withIndex("by_round_hole", (q) =>
        q.eq("roundId", args.roundId).eq("holeNumber", args.holeNumber),
      )
      .first();
  },
});
