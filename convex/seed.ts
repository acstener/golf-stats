import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";

// Seeds 10 realistic "The Six"-tracked rounds for the calling user — spaced
// roughly weekly across the last ~10 weeks, alternating between the two
// real courses we ship, with a mild improvement trend (each round shaves
// ~0.5 strokes off the player's baseline). Used to give the Stats screen
// something interesting to look at during development.
//
// Stat frequencies are calibrated to look like a real ~85-shooting golfer:
//   - out-of-position ~18% of holes
//   - failed up & down ~12%
//   - three-putt ~20% of holes the player bogeyed or worse
//   - penalty stroke ~8%
//   - inside wedge range ~50% of par 4/5 holes
//   - hero shot avoided ~6%

const DYKE_PARS = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];
const LANGLEY_PARS = [4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4];

const REASON_BANK = {
  outOfPosition: [
    "lack-of-commitment",
    "wrong-club",
    "not-warmed-up",
    "poor-aim",
    "other",
  ] as const,
  failedEasyUpDown: [
    "poor-aim",
    "wrong-club",
    "lack-of-commitment",
    "bad-read",
    "other",
  ] as const,
  penaltyType: ["water", "ob", "lost", "unplayable"] as const,
  penaltyReason: [
    "wrong-club",
    "ego-distance",
    "poor-aim",
    "uncommitted",
    "other",
  ] as const,
  wedgeRange: [
    "bad-approach",
    "bad-lag-putt",
    "bad-short-putt",
    "double-chip",
  ] as const,
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(p: number) {
  return Math.random() < p;
}

export const seedSixRounds = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Sign in first.",
      });
    }

    const ROUND_COUNT = 10;
    const DAY = 24 * 60 * 60 * 1000;

    for (let i = 0; i < ROUND_COUNT; i++) {
      // Most-recent round = i=0, oldest = i=9
      const daysAgo = i * 7 + Math.floor(Math.random() * 3);
      const date = Date.now() - daysAgo * DAY;

      // Alternate courses with a 60/40 bias toward Dyke.
      const useDyke = chance(0.6);
      const courseName = useDyke ? "The Dyke Golf Club" : "Langley Park Golf Club";
      const courseId = useDyke ? "dyke" : "langley-park";
      const teeName = useDyke ? "White" : "White";
      const teeId = useDyke ? "white" : "white";
      const pars = useDyke ? DYKE_PARS : LANGLEY_PARS;

      // Insert the round shell first — we'll patch totals once holes are built.
      const roundId = await ctx.db.insert("rounds", {
        userId: identity.subject,
        date,
        courseName,
        courseId,
        teeId,
        teeName,
        trackingMode: "six",
        createdAt: date,
        completedAt: date + 4 * 60 * 60 * 1000,
        isComplete: true,
      });

      let totalScore = 0;
      let totalPar = 0;

      for (let h = 0; h < 18; h++) {
        const par = pars[h];

        // Score distribution biased toward bogey golf with a slow trend
        // toward par for the more recent rounds (i=0 = newest).
        const recency = (ROUND_COUNT - i) / ROUND_COUNT; // 0.1..1.0
        const roll = Math.random();
        let strokes: number;
        if (roll < 0.04) strokes = par - 1;
        else if (roll < 0.32 + 0.1 * recency) strokes = par;
        else if (roll < 0.72) strokes = par + 1;
        else if (roll < 0.93) strokes = par + 2;
        else strokes = par + 3;

        totalScore += strokes;
        totalPar += par;

        const wasBogeyOrWorse = strokes >= par + 1;

        const outOfPosition = chance(0.18)
          ? { occurred: true as const, reason: pick(REASON_BANK.outOfPosition) }
          : undefined;

        const failedEasyUpDown = chance(0.12)
          ? { occurred: true as const, reason: pick(REASON_BANK.failedEasyUpDown) }
          : undefined;

        const threePutt =
          wasBogeyOrWorse && chance(0.25)
            ? {
                occurred: true as const,
                firstPuttDistance: 20 + Math.floor(Math.random() * 30),
              }
            : undefined;

        const penalty = chance(0.08)
          ? {
              occurred: true as const,
              type: pick(REASON_BANK.penaltyType),
              reason: pick(REASON_BANK.penaltyReason),
            }
          : undefined;

        const wedgeRange =
          par >= 4 && chance(0.5)
            ? (() => {
                const shots = chance(0.7)
                  ? 2 + Math.floor(Math.random() * 2)
                  : 4;
                return {
                  wasInWedgeRange: true as const,
                  shotsFromWedgeRange: shots,
                  reason: shots > 3 ? pick(REASON_BANK.wedgeRange) : "",
                };
              })()
            : undefined;

        const heroShotsAvoided = chance(0.06)
          ? {
              occurred: true as const,
              description: "Laid up instead of going for the green",
            }
          : undefined;

        const doubleBogeyOrWorse =
          strokes >= par + 2
            ? { occurred: true as const, causedBy: undefined }
            : { occurred: false as const, causedBy: undefined };

        await ctx.db.insert("holes", {
          roundId,
          holeNumber: h + 1,
          par,
          strokes,
          outOfPosition,
          failedEasyUpDown,
          doubleBogeyOrWorse,
          threePutt,
          penalty,
          wedgeRange,
          heroShotsAvoided,
          createdAt: date,
        });
      }

      await ctx.db.patch(roundId, { totalScore, totalPar });
    }

    return ROUND_COUNT;
  },
});

// Nukes every round (and its holes) the caller owns. Pair with seedSixRounds
// for an idempotent dev workflow: clear → reseed → analyze.
export const clearMyRounds = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Sign in first.",
      });
    }

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    for (const round of rounds) {
      const holes = await ctx.db
        .query("holes")
        .withIndex("by_round", (q) => q.eq("roundId", round._id))
        .collect();
      for (const hole of holes) {
        await ctx.db.delete(hole._id);
      }
      await ctx.db.delete(round._id);
    }

    return rounds.length;
  },
});
