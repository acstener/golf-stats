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