export const statDescriptions = {
  outOfPosition: {
    name: "Out of Position",
    description: "Shots where you can't hit your normal swing (behind trees, obstacles, etc.). Focus especially on tee shots that put you out of position. Track the why: lack of commitment, wrong club choice, not warmed up, etc."
  },
  failedEasyUpDown: {
    name: "Failed Easy Up & Downs",
    description: "When you don't get up and down from situations YOU consider easy. This is skill-level dependent - you define what's 'easy' for you. Track the why: poor aim, didn't account for shot shape, wrong club, lack of commitment."
  },
  doubleBogeyOrWorse: {
    name: "Double Bogeys+",
    description: "Don't worry about regular bogeys - focus on the big numbers. Track what led to each double (was it the drive, approach, chip, or putt?). Look for patterns in where doubles originate."
  },
  threePutt: {
    name: "Three-Putts",
    description: "Track all three putts. Note the distance of the first putt. Consider what led to being that far away (approach shot, chip, etc.)."
  },
  penalty: {
    name: "Penalties",
    description: "Track all penalty strokes (water, OB, lost ball). Record where and why: wrong club selection, ego distances, poor aim, uncommitted swing."
  },
  wedgeRangeOverPar: {
    name: "Wedge Range Performance",
    description: "Once inside wedge range (≤120 yards), track it like a par 3. Goal: Get in the hole in 3 shots from wedge distance. Track total shots from wedge range to holed out."
  }
} as const;