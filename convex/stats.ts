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

    // Calculate stat totals
    const statTotals = {
      threePutt: 0,
      penalty: 0,
      bunker: 0,
      waterHazard: 0,
      outOfBounds: 0,
      duffedChip: 0,
    };

    holes.forEach(hole => {
      Object.keys(statTotals).forEach(stat => {
        if (hole.stats[stat as keyof typeof statTotals]) {
          statTotals[stat as keyof typeof statTotals]++;
        }
      });
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
      threePutt: "Three-Putting",
      penalty: "Penalties",
      bunker: "Bunker Trouble",
      waterHazard: "Water Hazards",
      outOfBounds: "Out of Bounds",
      duffedChip: "Duffed Chips",
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
          threePutts: 0,
          penalties: 0,
          bunkers: 0,
          waterHazards: 0,
          outOfBounds: 0,
          duffedChips: 0,
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

    // Calculate stat averages
    const statTotals = {
      threePutts: 0,
      penalties: 0,
      bunkers: 0,
      waterHazards: 0,
      outOfBounds: 0,
      duffedChips: 0,
    };

    holes.forEach(hole => {
      if (hole.stats.threePutt) statTotals.threePutts++;
      if (hole.stats.penalty) statTotals.penalties++;
      if (hole.stats.bunker) statTotals.bunkers++;
      if (hole.stats.waterHazard) statTotals.waterHazards++;
      if (hole.stats.outOfBounds) statTotals.outOfBounds++;
      if (hole.stats.duffedChip) statTotals.duffedChips++;
    });

    // Convert to per-round averages
    const stats = {
      threePutts: parseFloat((statTotals.threePutts / rounds.length).toFixed(1)),
      penalties: parseFloat((statTotals.penalties / rounds.length).toFixed(1)),
      bunkers: parseFloat((statTotals.bunkers / rounds.length).toFixed(1)),
      waterHazards: parseFloat((statTotals.waterHazards / rounds.length).toFixed(1)),
      outOfBounds: parseFloat((statTotals.outOfBounds / rounds.length).toFixed(1)),
      duffedChips: parseFloat((statTotals.duffedChips / rounds.length).toFixed(1)),
    };

    return {
      roundsPlayed: rounds.length,
      averageScore,
      stats,
    };
  },
});