import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const profileValidator = v.union(
  v.null(),
  v.object({
    _id: v.id("userProfiles"),
    _creationTime: v.number(),
    userId: v.string(),
    handicapIndex: v.optional(v.number()),
    updatedAt: v.number(),
  }),
);

// Returns the caller's profile (handicap index + any future prefs), or
// null if they haven't set one yet — the UI uses null as the trigger to
// prompt for handicap on the first round.
export const getMyProfile = query({
  args: {},
  returns: profileValidator,
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

// Upserts the caller's handicap index. Allows decimal precision (8.6)
// because WHS handicaps go to one decimal. Range-clamps to sensible WHS
// limits — anything outside [-5, 54] is a typo, throw.
export const setHandicapIndex = mutation({
  args: { handicapIndex: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be signed in.",
      });
    }
    if (args.handicapIndex < -5 || args.handicapIndex > 54) {
      throw new ConvexError({
        code: "BAD_INPUT",
        message: "Handicap index must be between -5 and 54.",
      });
    }

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        handicapIndex: args.handicapIndex,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: identity.subject,
        handicapIndex: args.handicapIndex,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});
