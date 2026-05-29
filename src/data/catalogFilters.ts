import type { AgeRange, DayTimeTag } from "@/types/provider";

/** Filter chips on Discover — not tied to any specific listing. */
export const ACTIVITY_TYPES = [
  "Rifle",
  "Pistol",
  "Shotgun",
  "Clay Shooting",
  "Airgun",
  "IPSC",
  "Long Range",
  "Biathlon Prep",
  "Hunter Safety",
  "Field Shooting",
  "Archery",
  "Gunsmithing",
  "Junior Academy",
  "Women-Only Sessions",
  "Licence Preparation",
  "Corporate Range Days",
  "Night Shooting",
  "Dog Handling",
];

export const AGE_RANGES: AgeRange[] = ["Youth", "Beginner", "Licensed Adult", "Competition", "Hunter Prep"];

export const DAY_TIME_TAGS: DayTimeTag[] = ["Weekday", "Weekend", "Morning", "Afternoon", "Evening", "Seasonal", "After-school"];
