import { z } from "zod";
import {
  CURATOR_BADGES,
  CURATOR_BOROUGHS,
  CURATOR_CATEGORIES,
  CURATOR_AGE_RANGES,
  CURATOR_DAY_TAGS,
} from "@/lib/curator/constants";
import { isImgBbHttpsImageUrl } from "@/lib/imgbbUrl";

const category = z.enum(CURATOR_CATEGORIES);
const borough = z.enum(CURATOR_BOROUGHS);
const ageRange = z.enum(CURATOR_AGE_RANGES);
const dayTag = z.enum(CURATOR_DAY_TAGS);
const badge = z.enum(CURATOR_BADGES);
const recurringProgramCadence = z.enum(["Daily", "Weekdays", "Weekends", "Weekly", "Biweekly", "Monthly", "Seasonal", "Custom"]);
const recurringProgramDay = z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
const scheduledInstance = z
  .object({
    id: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    title: z.string().min(2).max(120),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    timeText: z.string().max(120).optional(),
    locationNote: z.string().max(160).optional(),
    ageRanges: z.array(ageRange).max(5).optional(),
    activityTypes: z.array(z.string().min(1).max(60)).max(12).optional(),
    summary: z.string().max(400).optional(),
    priceText: z.string().max(120).optional(),
    registrationUrl: z.string().url().max(500).optional(),
    isDropIn: z.boolean().optional(),
  })
  .strict();
const recurringProgram = z
  .object({
    id: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    title: z.string().min(2).max(120),
    cadence: recurringProgramCadence,
    daysOfWeek: z.array(recurringProgramDay).max(7),
    timeText: z.string().min(2).max(120),
    locationNote: z.string().max(160).optional(),
    ageRanges: z.array(ageRange).max(5).optional(),
    activityTypes: z.array(z.string().min(1).max(60)).max(12).optional(),
    summary: z.string().max(400).optional(),
    priceText: z.string().max(120).optional(),
    registrationUrl: z.string().url().max(500).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    isDropIn: z.boolean().optional(),
  })
  .strict();

/** Strict provider document for curated / LLM output (matches Mongo ingest shape). */
export const curatedProviderSchema = z
  .object({
    id: z.string().min(4).max(80).regex(/^prov-[a-z0-9-]+$/),
    name: z.string().min(2).max(160),
    category,
    borough,
    neighborhood: z.string().min(2).max(80),
    address: z.string().min(8).max(200),
    activityTypes: z.array(z.string().min(1).max(60)).min(1).max(12),
    ageRanges: z.array(ageRange).min(1).max(5),
    dayTimeTags: z.array(dayTag).min(1).max(8),
    pricePerClass: z.number().nonnegative().max(50000),
    shortDescription: z.string().min(10).max(400),
    longDescription: z.string().min(40).max(8000),
    rating: z.number().min(0).max(5),
    reviewCount: z.number().int().min(0).max(1_000_000),
    badges: z.array(badge).max(4),
    image: z
      .string()
      .max(2000)
      .refine((s) => !s.trim() || isImgBbHttpsImageUrl(s), { message: "image must be empty or an https ImgBB URL (i.ibb.co)" }),
    galleryImages: z
      .array(
        z
          .string()
          .url()
          .refine((s) => isImgBbHttpsImageUrl(s), { message: "each galleryImages entry must be an https ImgBB URL" }),
      )
      .max(8)
      .optional(),
    email: z.string().max(200),
    website: z.string().url().max(500),
    phone: z.string().max(80),
    announcementTitle: z.string().max(120).optional(),
    announcementDescription: z.string().max(500).optional(),
    announcementBadge: z.string().max(60).optional(),
    recurringPrograms: z.array(recurringProgram).max(24).optional(),
    scheduledInstances: z.array(scheduledInstance).max(64).optional(),
    publishedAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    bookingEnabled: z.boolean().optional(),
  })
  .strict();

export type CuratedProvider = z.infer<typeof curatedProviderSchema>;
