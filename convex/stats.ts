import { v } from "convex/values";
import { query } from "./_generated/server";

// Get user's biggest problem
export const getBiggestProblem = query({
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