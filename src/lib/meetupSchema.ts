import { z } from "zod";
import { isImgBbHttpsImageUrl } from "@/lib/imgbbUrl";

const borough = z.enum([
  "Hungary",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Poland",
]);
const groupType = z.enum([
  "Parent Meetup",
  "Mom Group",
  "Playdate Group",
  "New Parents",
  "Neighborhood Families",
  "Sport Shooting Club",
  "Hunting Association",
  "IPSC Team",
  "Clay Club",
  "Airgun Academy",
]);
const ageRange = z.enum([
  "0–2",
  "0–3",
  "0–5",
  "0–6",
  "2–5",
  "2–8",
  "3–5",
  "All ages",
  "Youth",
  "Beginner",
  "Licensed Adult",
  "Competition",
  "All levels",
]);
const cadence = z.enum(["Weekly", "Monthly", "Weekend", "Pop-up", "Seasonal", "Competition Calendar"]);
const icon = z.enum(["stroller", "skyline", "heart", "coffee", "playground", "community", "target", "forest", "shield", "trophy", "scope"]);
const palette = z.enum(["teal", "orange", "beige", "charcoal"]);

export const curatedMeetupSchema = z
  .object({
    id: z.string().min(7).max(100).regex(/^meetup-[a-z0-9-]+$/),
    catalogProject: z.string().trim().min(1).max(80).optional(),
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
