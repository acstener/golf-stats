import { mutation } from "./_generated/server";

// One-time migration to clean up old schema data
export const cleanupOldHoles = mutation({
  handler: async (ctx) => {
    // Get all holes
    const allHoles = await ctx.db.query("holes").collect();
    
    let deleted = 0;
    for (const hole of allHoles) {
      // Check if it has the old 'stats' field structure
      if ('stats' in hole && typeof hole.stats === 'object' && 
          'threePutt' in (hole.stats as any) && typeof (hole.stats as any).threePutt === 'boolean') {
        // This is an old format hole, delete it
        await ctx.db.delete(hole._id);
        deleted++;
      }
    }
    
    return { deleted, message: `Deleted ${deleted} old format holes` };
  },
});

// Clean up test rounds
export const cleanupTestRounds = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Delete all rounds for the current user
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_user", q => q.eq("userId", identity.subject))
      .collect();
    
    for (const round of rounds) {
      // Delete all holes for this round
      const holes = await ctx.db
        .query("holes")
        .withIndex("by_round", q => q.eq("roundId", round._id))
        .collect();
      
      for (const hole of holes) {
        await ctx.db.delete(hole._id);
      }
      
      // Delete the round
      await ctx.db.delete(round._id);
    }
    
    return { deletedRounds: rounds.length };
  },
});