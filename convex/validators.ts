import { v } from "convex/values";

// Shape of a hole's nested stat objects (used by both saveHole args + the
// hole document validator). Keeping these as plain object literals lets us
// spread them into the document validator below.
export const outOfPositionShape = v.object({
  occurred: v.boolean(),
  reason: v.optional(v.string()),
});

export const failedEasyUpDownShape = v.object({
  occurred: v.boolean(),
  reason: v.optional(v.string()),
});

export const doubleBogeyOrWorseShape = v.object({
  occurred: v.boolean(),
  causedBy: v.optional(v.string()),
});

export const threePuttShape = v.object({
  occurred: v.boolean(),
  firstPuttDistance: v.optional(v.number()),
});

export const penaltyShape = v.object({
  occurred: v.boolean(),
  type: v.optional(v.string()),
  reason: v.optional(v.string()),
});

export const wedgeRangeShape = v.object({
  wasInWedgeRange: v.boolean(),
  shotsFromWedgeRange: v.optional(v.number()),
  reason: v.optional(v.string()),
});

export const heroShotsAvoidedShape = v.object({
  occurred: v.boolean(),
  description: v.optional(v.string()),
});

// Tracking-mode union for rounds. Drives the hole tracker UI + which
// per-round data the app captures.
export const trackingModeValidator = v.union(
  v.literal("score"),
  v.literal("six"),
  v.literal("classic"),
);

// Full document validators (for return types of queries).
export const roundValidator = v.object({
  _id: v.id("rounds"),
  _creationTime: v.number(),
  userId: v.string(),
  date: v.number(),
  courseName: v.string(),
  courseId: v.optional(v.string()),
  teeId: v.optional(v.string()),
  teeName: v.optional(v.string()),
  trackingMode: v.optional(trackingModeValidator),
  totalScore: v.optional(v.number()),
  totalPar: v.optional(v.number()),
  handicapIndex: v.optional(v.number()),
  courseHandicap: v.optional(v.number()),
  playingHandicap: v.optional(v.number()),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
  isComplete: v.boolean(),
});

// Shot lie + result enums (kept aligned with schema).
export const lieValidator = v.union(
  v.literal("tee"),
  v.literal("fairway"),
  v.literal("rough"),
  v.literal("sand"),
  v.literal("recovery"),
  v.literal("green"),
  v.literal("penalty"),
);
export const resultLieValidator = v.union(
  v.literal("fairway"),
  v.literal("rough"),
  v.literal("sand"),
  v.literal("green"),
  v.literal("hole"),
  v.literal("penalty-water"),
  v.literal("penalty-ob"),
  v.literal("penalty-lost"),
  v.literal("recovery"),
);
export const shotValidator = v.object({
  _id: v.id("shots"),
  _creationTime: v.number(),
  roundId: v.id("rounds"),
  holeNumber: v.number(),
  shotNumber: v.number(),
  lie: lieValidator,
  distance: v.optional(v.number()),
  result: v.optional(resultLieValidator),
  club: v.optional(v.string()),
  createdAt: v.number(),
});

export const holeValidator = v.object({
  _id: v.id("holes"),
  _creationTime: v.number(),
  roundId: v.id("rounds"),
  holeNumber: v.number(),
  par: v.number(),
  strokes: v.number(),
  outOfPosition: v.optional(outOfPositionShape),
  failedEasyUpDown: v.optional(failedEasyUpDownShape),
  doubleBogeyOrWorse: v.optional(doubleBogeyOrWorseShape),
  threePutt: v.optional(threePuttShape),
  penalty: v.optional(penaltyShape),
  wedgeRange: v.optional(wedgeRangeShape),
  heroShotsAvoided: v.optional(heroShotsAvoidedShape),
  fir: v.optional(v.boolean()),
  gir: v.optional(v.boolean()),
  putts: v.optional(v.number()),
  driveDistance: v.optional(v.number()),
  createdAt: v.number(),
});

export const roundWithHolesValidator = v.object({
  _id: v.id("rounds"),
  _creationTime: v.number(),
  userId: v.string(),
  date: v.number(),
  courseName: v.string(),
  courseId: v.optional(v.string()),
  teeId: v.optional(v.string()),
  teeName: v.optional(v.string()),
  trackingMode: v.optional(trackingModeValidator),
  totalScore: v.optional(v.number()),
  totalPar: v.optional(v.number()),
  handicapIndex: v.optional(v.number()),
  courseHandicap: v.optional(v.number()),
  playingHandicap: v.optional(v.number()),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
  isComplete: v.boolean(),
  holes: v.array(holeValidator),
});

// Helper: turn empty strings into undefined so optional fields stay clean.
// Used inside mutation handlers to normalize user input.
export function blank<T extends Record<string, unknown>>(obj: T | undefined): T | undefined {
  if (!obj) return obj;
  const out = { ...obj };
  for (const k of Object.keys(out) as (keyof T)[]) {
    if (typeof out[k] === "string" && (out[k] as string).trim() === "") {
      (out as Record<string, unknown>)[k as string] = undefined;
    }
  }
  return out;
}
