import type { Borough } from "./provider";

export type MeetupGroupType =
  | "Parent Meetup"
  | "Mom Group"
  | "Playdate Group"
  | "New Parents"
  | "Neighborhood Families"
  | "Sport Shooting Club"
  | "Hunting Association"
  | "IPSC Team"
  | "Clay Club"
  | "Airgun Academy";

export type MeetupCadence = "Weekly" | "Monthly" | "Weekend" | "Pop-up" | "Seasonal" | "Competition Calendar";

export type MeetupAgeRange =
  | "0–2"
  | "0–3"
  | "0–5"
  | "0–6"
  | "2–5"
  | "2–8"
  | "3–5"
  | "All ages"
  | "Youth"
  | "Beginner"
  | "Licensed Adult"
  | "Competition"
  | "All levels";

export type MeetupIcon =
  | "stroller"
  | "skyline"
  | "heart"
  | "coffee"
  | "playground"
  | "community"
  | "target"
  | "forest"
  | "shield"
  | "trophy"
  | "scope";

export interface MeetupGroup {
  id: string;
  catalogProject?: string;
  name: string;
  borough: Borough;
  neighborhood: string;
  groupType: MeetupGroupType;
  ageRange: MeetupAgeRange;
  cadence: MeetupCadence;
  instagram: string;
  website: string;
  description: string;
  initials: string;
  icon: MeetupIcon;
  palette: "teal" | "orange" | "beige" | "charcoal";
  /** Optional cover photo; when set must be an ImgBB-hosted HTTPS URL. */
  coverImageUrl?: string;
}
