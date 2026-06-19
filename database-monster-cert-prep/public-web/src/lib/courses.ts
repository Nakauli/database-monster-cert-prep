export const COURSE_OPTIONS = ["IT", "CS"] as const;

export type CourseOption = (typeof COURSE_OPTIONS)[number];

export function normalizeCourse(value: string | null | undefined): CourseOption | null {
  const normalized = value?.trim().toUpperCase();
  return normalized === "IT" || normalized === "CS" ? normalized : null;
}
