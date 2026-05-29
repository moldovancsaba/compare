import { Avatar, Box, ThemeIcon } from "@mantine/core";
import { Baby, Building2, Heart, Coffee, Blocks, Users } from "@/lib/appIcons";
import type { MeetupGroup } from "@/types/meetup";

const ICONS = {
  stroller: Baby,
  skyline: Building2,
  heart: Heart,
  coffee: Coffee,
  playground: Blocks,
  community: Users,
} as const;

const PALETTES: Record<
  MeetupGroup["palette"],
  { color: string; variant: "light" | "filled"; badgeColor: string; badgeVariant: "light" | "filled" }
> = {
  teal: { color: "teal", variant: "light", badgeColor: "teal", badgeVariant: "filled" },
  orange: { color: "orange", variant: "light", badgeColor: "orange", badgeVariant: "filled" },
  beige: { color: "gray", variant: "light", badgeColor: "dark", badgeVariant: "filled" },
  charcoal: { color: "dark", variant: "filled", badgeColor: "gray", badgeVariant: "light" },
};

export function MeetupLogo({ group, size = "md" }: { group: MeetupGroup; size?: "md" | "lg" }) {
  const Icon = ICONS[group.icon];
  const p = PALETTES[group.palette];
  const rootSize = size === "lg" ? 80 : 56;
  const iconSize = size === "lg" ? 28 : 20;
  const badgeSize = size === "lg" ? 32 : 24;
  return (
    <Box pos="relative" style={{ width: rootSize, height: rootSize }}>
      <ThemeIcon color={p.color} variant={p.variant} radius="xl" size={rootSize}>
        <Icon size={iconSize} strokeWidth={1.75} />
      </ThemeIcon>
      <Avatar
        color={p.badgeColor}
        variant={p.badgeVariant}
        radius="xl"
        size={badgeSize}
        ff="heading"
        fw={700}
        fz={size === "lg" ? "xs" : "10px"}
        pos="absolute"
        bottom={-2}
        right={-2}
      >
        {group.initials}
      </Avatar>
    </Box>
  );
}
