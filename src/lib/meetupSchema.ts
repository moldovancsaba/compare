import { z } from "zod";
import { isImgBbHttpsImageUrl } from "@/lib/imgbbUrl";

const borough = z.enum(["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]);
const groupType = z.enum(["Parent Meetup", "Mom Group", "Playdate Group", "New Parents", "Neighborhood Families"]);
const ageRange = z.enum(["0–2", "0–3", "0–5", "0–6", "2–5", "2–8", "3–5", "All ages"]);
const cadence = z.enum(["Weekly", "Monthly", "Weekend", "Pop-up"]);
const icon = z.enum(["stroller", "skyline", "heart", "coffee", "playground", "community"]);
const palette = z.enum(["teal", "orange", "beige", "charcoal"]);

export const curatedMeetupSchema = z
  .object({
    id: z.string().min(7).max(100).regex(/^meetup-[a-z0-9-]+$/),
    name: z.string().min(2).max(160),
    borough,
    neighborhood: z.string().min(2).max(80),
    groupType,
    ageRange,
    cadence,
    instagram: z.string().max(500),
    website: z.string().url().max(500),
    description: z.string().min(20).max(8000),
    initials: z.string().min(1).max(12),
    icon,
    palette,
    coverImageUrl: z
      .string()
      .max(2000)
      .refine((s) => !s.trim() || isImgBbHttpsImageUrl(s), {
        message: "coverImageUrl must be empty or an https ImgBB URL",
      })
      .optional(),
  })
  .strict();

export type CuratedMeetup = z.infer<typeof curatedMeetupSchema>;
