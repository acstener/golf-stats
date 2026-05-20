import { v } from "convex/values";
import { query } from "./_generated/server";

const statBreakdownValidator = v.object({
  outOfPosition: v.number(),
  failedEasyUpDown: v.number(),
  doubleBogeyOrWorse: v.number(),
  threePutt: v.number(),
  penalty: v.number(),
  wedgeRangeOverPar: v.number(),
});

// Get user's biggest problem
export const getBiggestProblem = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      problem: v.string(),
      avgPerRound: v.number(),
      total: v.number(),
      roundsAnalyzed: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get last 10 completed rounds
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("isComplete"), true))
      .order("desc")
      .take(10);

    if (rounds.length === 0) return null;

    // Get all holes for these rounds
    const roundIds = rounds.map(r => r._id);
    const allHoles = await Promise.all(
      roundIds.map(async (roundId) => {
        return await ctx.db
          .query("holes")
          .withIndex("by_round", (q) => q.eq("roundId", roundId))
          .collect();
      })
    );

    const holes = allHoles.flat();
    if (holes.length === 0) return null;

    // Calculate stat totals for the new stats
    const statTotals = {
      outOfPosition: 0,
      failedEasyUpDown: 0,
      doubleBogeyOrWorse: 0,
      threePutt: 0,
      penalty: 0,
      wedgeRangeOverPar: 0,
    };

    holes.forEach(hole => {
      if (hole.outOfPosition?.occurred) statTotals.outOfPosition++;
      if (hole.failedEasyUpDown?.occurred) statTotals.failedEasyUpDown++;
      if (hole.doubleBogeyOrWorse?.occurred) statTotals.doubleBogeyOrWorse++;
      if (hole.threePutt?.occurred) statTotals.threePutt++;
      if (hole.penalty?.occurred) statTotals.penalty++;
      
      // Check wedge range performance (shots > 3 from wedge range)
      if (hole.wedgeRange?.wasInWedgeRange && 
          hole.wedgeRange.shotsFromWedgeRange && 
          hole.wedgeRange.shotsFromWedgeRange > 3) {
        statTotals.wedgeRangeOverPar++;
      }
    });

    // Find the biggest problem
    let biggestProblem = null;
    let maxCount = 0;

    Object.entries(statTotals).forEach(([stat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        biggestProblem = stat;
      }
    });

    if (!biggestProblem || maxCount === 0) return null;

    // Calculate average per round
    const avgPerRound = (maxCount / rounds.length).toFixed(1);

    // Format the problem name
    const problemNames: Record<string, string> = {
      outOfPosition: "Out of Position Shots",
      failedEasyUpDown: "Failed Easy Up & Downs",
      doubleBogeyOrWorse: "Double Bogeys or Worse",
      threePutt: "Three-Putts",
      penalty: "Penalties",
      wedgeRangeOverPar: "Poor Wedge Range Performance",
    };

    return {
      problem: problemNames[biggestProblem],
      avgPerRound: parseFloat(avgPerRound),
      total: maxCount,
      roundsAnalyzed: rounds.length,
    };
  },
});

// Get aggregated stats
export const getUserStats = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      roundsPlayed: v.number(),
      averageScore: v.number(),
      stats: statBreakdownValidator,
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get all completed rounds
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isComplete"), true))
      .collect();

    if (rounds.length === 0) {
      return {
        roundsPlayed: 0,
        averageScore: 0,
        stats: {
          outOfPosition: 0,
          failedEasyUpDown: 0,
          doubleBogeyOrWorse: 0,
          threePutt: 0,
          penalty: 0,
          wedgeRangeOverPar: 0,
        },
      };
    }

    // Get all holes
    const allHoles = await Promise.all(
      rounds.map(async (round) => {
        return await ctx.db
          .query("holes")
          .withIndex("by_round", (q) => q.eq("roundId", round._id))
          .collect();
      })
    );

    const holes = allHoles.flat();

    // Calculate averages
    const scores = rounds
      .filter(r => r.totalScore !== undefined)
      .map(r => r.totalScore!);
    
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Calculate stat totals
    const statTotals = {
      outOfPosition: 0,
      failedEasyUpDown: 0,
      doubleBogeyOrWorse: 0,
      threePutt: 0,
      penalty: 0,
      wedgeRangeOverPar: 0,
    };

    holes.forEach(hole => {
      if (hole.outOfPosition?.occurred) statTotals.outOfPosition++;
      if (hole.failedEasyUpDown?.occurred) statTotals.failedEasyUpDown++;
      if (hole.doubleBogeyOrWorse?.occurred) statTotals.doubleBogeyOrWorse++;
      if (hole.threePutt?.occurred) statTotals.threePutt++;
      if (hole.penalty?.occurred) statTotals.penalty++;
      
      // Check wedge range performance
      if (hole.wedgeRange?.wasInWedgeRange && 
          hole.wedgeRange.shotsFromWedgeRange && 
          hole.wedgeRange.shotsFromWedgeRange > 3) {
        statTotals.wedgeRangeOverPar++;
      }
    });

    // Convert to per-round averages
    const stats = {
      outOfPosition: parseFloat((statTotals.outOfPosition / rounds.length).toFixed(1)),
      failedEasyUpDown: parseFloat((statTotals.failedEasyUpDown / rounds.length).toFixed(1)),
      doubleBogeyOrWorse: parseFloat((statTotals.doubleBogeyOrWorse / rounds.length).toFixed(1)),
      threePutt: parseFloat((statTotals.threePutt / rounds.length).toFixed(1)),
      penalty: parseFloat((statTotals.penalty / rounds.length).toFixed(1)),
      wedgeRangeOverPar: parseFloat((statTotals.wedgeRangeOverPar / rounds.length).toFixed(1)),
    };

    return {
      roundsPlayed: rounds.length,
      averageScore,
      stats,
    };
  },
});

// Classic Stats: aggregates the four standard golf metrics — FIR %, GIR %,
// avg putts, avg drive — across the user's completed classic-mode rounds.
// Returns nulls for buckets with no eligible holes so the UI can render
// "—" instead of NaN.
export const getClassicStats = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      roundsPlayed: v.number(),
      firPct: v.union(v.number(), v.null()),
      girPct: v.union(v.number(), v.null()),
      avgPutts: v.union(v.number(), v.null()),
      avgDrive: v.union(v.number(), v.null()),
      firDenominator: v.number(),
      girDenominator: v.number(),
      puttsDenominator: v.number(),
      driveDenominator: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.and(
          q.eq(q.field("isComplete"), true),
          q.eq(q.field("trackingMode"), "classic"),
        ),
      )
      .collect();

    if (rounds.length === 0) return null;

    const allHoles = await Promise.all(
      rounds.map((r) =>
        ctx.db
          .query("holes")
          .withIndex("by_round", (q) => q.eq("roundId", r._id))
          .collect(),
      ),
    );
    const holes = allHoles.flat();

    let firHits = 0;
    let firDenominator = 0;
    let girHits = 0;
    let girDenominator = 0;
    let puttsTotal = 0;
    let puttsDenominator = 0;
    let driveTotal = 0;
    let driveDenominator = 0;

    for (const h of holes) {
      // FIR: only applicable on par 4+ where user actually answered.
      if (h.par >= 4 && h.fir !== undefined) {
        firDenominator++;
        if (h.fir) firHits++;
      }
      if (h.gir !== undefined) {
        girDenominator++;
        if (h.gir) girHits++;
      }
      if (h.putts !== undefined) {
        puttsDenominator++;
        puttsTotal += h.putts;
      }
      if (h.par >= 4 && h.driveDistance !== undefined && h.driveDistance > 0) {
        driveDenominator++;
        driveTotal += h.driveDistance;
      }
    }

    return {
      roundsPlayed: rounds.length,
      firPct:
        firDenominator > 0
          ? parseFloat(((firHits / firDenominator) * 100).toFixed(1))
          : null,
      girPct:
        girDenominator > 0
          ? parseFloat(((girHits / girDenominator) * 100).toFixed(1))
          : null,
      avgPutts:
        puttsDenominator > 0
          ? parseFloat((puttsTotal / puttsDenominator).toFixed(2))
          : null,
      avgDrive:
        driveDenominator > 0
          ? Math.round(driveTotal / driveDenominator)
          : null,
      firDenominator,
      girDenominator,
      puttsDenominator,
      driveDenominator,
    };
  },
});
// Last N completed rounds with score, par, course + per-round stat counts.
// Drives the score-trend bars and per-stat sparkline on the Stats screen.
export const getScoreTrend = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("rounds"),
      date: v.number(),
      courseName: v.string(),
      courseId: v.optional(v.string()),
      score: v.number(),
      par: v.number(),
      statCounts: v.object({
        outOfPosition: v.number(),
        failedEasyUpDown: v.number(),
        threePutt: v.number(),
        penalty: v.number(),
        doubleBogeyOrWorse: v.number(),
        heroShotsAvoided: v.number(),
        wedgeRangeOverPar: v.number(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = args.limit ?? 10;

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isComplete"), true))
      .order("desc")
      .take(limit);

    return await Promise.all(
      rounds.map(async (r) => {
        const holes = await ctx.db
          .query("holes")
          .withIndex("by_round", (q) => q.eq("roundId", r._id))
          .collect();

        const score = r.totalScore ?? holes.reduce((a, h) => a + h.strokes, 0);
        const par = r.totalPar ?? holes.reduce((a, h) => a + h.par, 0);

        return {
          _id: r._id,
          date: r.date,
          courseName: r.courseName,
          courseId: r.courseId,
          score,
          par,
          statCounts: {
            outOfPosition: holes.filter((h) => h.outOfPosition?.occurred).length,
            failedEasyUpDown: holes.filter((h) => h.failedEasyUpDown?.occurred).length,
            threePutt: holes.filter((h) => h.threePutt?.occurred).length,
            penalty: holes.filter((h) => h.penalty?.occurred).length,
            doubleBogeyOrWorse: holes.filter((h) => h.doubleBogeyOrWorse?.occurred).length,
            heroShotsAvoided: holes.filter((h) => h.heroShotsAvoided?.occurred).length,
            wedgeRangeOverPar: holes.filter(
              (h) =>
                h.wedgeRange?.wasInWedgeRange &&
                (h.wedgeRange.shotsFromWedgeRange ?? 0) > 3,
            ).length,
          },
        };
      }),
    );
  },
});

// Per-course averages — counts and avg score grouped by courseName. Lets the
// user see "I shoot 4 better at Dyke" at a glance.
export const getCourseAverages = query({
  args: {},
  returns: v.array(
    v.object({
      courseName: v.string(),
      courseId: v.optional(v.string()),
      roundsPlayed: v.number(),
      averageScore: v.number(),
      bestScore: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isComplete"), true))
      .collect();

    const byCourse = new Map<
      string,
      { courseId?: string; scores: number[] }
    >();
    for (const r of rounds) {
      if (r.totalScore == null) continue;
      const existing = byCourse.get(r.courseName) ?? {
        courseId: r.courseId,
        scores: [],
      };
      existing.scores.push(r.totalScore);
      byCourse.set(r.courseName, existing);
    }

    const result = [];
    for (const [courseName, { courseId, scores }] of byCourse) {
      if (scores.length === 0) continue;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      result.push({
        courseName,
        courseId,
        roundsPlayed: scores.length,
        averageScore: Math.round(avg * 10) / 10,
        bestScore: Math.min(...scores),
      });
    }
    // Most-played first.
    result.sort((a, b) => b.roundsPlayed - a.roundsPlayed);
    return result;
  },
});
