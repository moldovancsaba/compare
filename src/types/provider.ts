export type Category = "Classes" | "Camps" | "Birthday Parties" | "Drop-In Activities";

export type Borough =
  | "Manhattan"
  | "Brooklyn"
  | "Queens"
  | "Bronx"
  | "Staten Island"
  | "Germany"
  | "France"
  | "Spain"
  | "Italy"
  | "Poland";

/** Discover / Meetups borough filter: one borough or every borough. */
export type BoroughChoice = Borough | "All";

export type AgeRange =
  | "0–2"
  | "3–5"
  | "6–8"
  | "9–12"
  | "Teens"
  | "Youth"
  | "Beginner"
  | "Licensed Adult"
  | "Competition"
  | "Hunter Prep";

export type DayTimeTag =
  | "Weekday"
  | "Weekend"
  | "Morning"
  | "Afternoon"
  | "Evening"
  | "After-school"
  | "Seasonal";

export type FeaturedBadge =
  | "Featured"
  | "Popular"
  | "New"
  | "Staff Pick"
  | "Great for Toddlers"
  | "Weekend Friendly"
  | "Beginner Friendly"
  | "Licence Support";

export type RecurringProgramCadence =
  | "Daily"
  | "Weekdays"
  | "Weekends"
  | "Weekly"
  | "Biweekly"
  | "Monthly"
  | "Seasonal"
  | "Custom";

export type RecurringProgramDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface RecurringProgram {
  id: string;
  title: string;
  cadence: RecurringProgramCadence;
  daysOfWeek: RecurringProgramDay[];
  timeText: string;
  locationNote?: string;
  ageRanges?: AgeRange[];
  activityTypes?: string[];
  summary?: string;
  priceText?: string;
  registrationUrl?: string;
  startDate?: string;
  endDate?: string;
  isDropIn?: boolean;
}

export interface ScheduledInstance {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  timeText?: string;
  locationNote?: string;
  ageRanges?: AgeRange[];
  activityTypes?: string[];
  summary?: string;
  priceText?: string;
  registrationUrl?: string;
  isDropIn?: boolean;
}

export interface UpcomingOccurrence {
  id: string;
  source: "scheduled-instance" | "recurring-program";
  title: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  timeText?: string;
  weekday: RecurringProgramDay;
  locationNote?: string;
  ageRanges?: AgeRange[];
  activityTypes?: string[];
  summary?: string;
  priceText?: string;
  registrationUrl?: string;
  isDropIn?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  category: Category;
  borough: Borough;
  neighborhood: string;
  address: string;
  activityTypes: string[];
  ageRanges: AgeRange[];
  dayTimeTags: DayTimeTag[];
  pricePerClass: number;
  shortDescription: string;
  longDescription: string;
  rating: number;
  reviewCount: number;
  badges: FeaturedBadge[];
  image: string;
  email: string;
  website: string;
  phone: string;
  // Optional content enrichments used when a listing has announcement, gallery, or recurring schedule data.
  announcementTitle?: string;
  announcementDescription?: string;
  announcementBadge?: string;
  galleryImages?: string[];
  recurringPrograms?: RecurringProgram[];
  scheduledInstances?: ScheduledInstance[];
  publishedAt?: string;
  updatedAt?: string;
  nextOccurrence?: UpcomingOccurrence | null;
  bookingEnabled?: boolean;
}
