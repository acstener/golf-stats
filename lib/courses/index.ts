import dykeRaw from "./dyke.json";
import langleyParkRaw from "./langley-park.json";

export type CourseHole = {
  holeNumber: number;
  par: number;
  strokeIndex: number;
  yardage: number;
  metres: number;
};

export type CourseTee = {
  id: string;
  name: string;
  colour: string;
  totalYardage: number;
  par: number;
  courseRating: number;
  slopeRating: number;
  holes: CourseHole[];
};

export type Course = {
  id: string;
  name: string;
  clubName: string;
  region: string;
  par: number;
  description?: string;
  tees: CourseTee[];
};

type RawHole = {
  hole_number: number;
  par: number;
  stroke_index: number;
  yardage: number;
  metres: number;
};

type RawTee = {
  id: string;
  name: string;
  colour: string;
  total_yardage: number;
  par: number;
  course_rating: number;
  slope_rating: number;
  holes: RawHole[];
};

type RawCourse = {
  club: { name: string; region_name: string; description?: string };
  course: { name: string; par: number };
  tees: RawTee[];
};

function normalize(id: string, raw: RawCourse): Course {
  return {
    id,
    name: raw.course.name,
    clubName: raw.club.name,
    region: raw.club.region_name,
    par: raw.course.par,
    description: raw.club.description,
    tees: raw.tees.map((t) => ({
      id: t.id,
      name: t.name,
      colour: t.colour,
      totalYardage: t.total_yardage,
      par: t.par,
      courseRating: t.course_rating,
      slopeRating: t.slope_rating,
      holes: t.holes.map((h) => ({
        holeNumber: h.hole_number,
        par: h.par,
        strokeIndex: h.stroke_index,
        yardage: h.yardage,
        metres: h.metres,
      })),
    })),
  };
}

export const COURSES: Course[] = [
  normalize("devils-dyke", dykeRaw as RawCourse),
  normalize("langley-park", langleyParkRaw as RawCourse),
];

export function findCourse(courseId: string | undefined): Course | undefined {
  if (!courseId) return undefined;
  return COURSES.find((c) => c.id === courseId);
}

export function findTee(course: Course | undefined, teeId: string | undefined): CourseTee | undefined {
  if (!course || !teeId) return undefined;
  return course.tees.find((t) => t.id === teeId);
}

export function findHole(tee: CourseTee | undefined, holeNumber: number): CourseHole | undefined {
  if (!tee) return undefined;
  return tee.holes.find((h) => h.holeNumber === holeNumber);
}
