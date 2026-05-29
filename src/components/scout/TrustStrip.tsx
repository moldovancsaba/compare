"use client";

import { FeatureBand } from "@doneisbetter/gds-core/client";
import { ThemeIcon } from "@mantine/core";
import { SiteLucideIcon } from "@/lib/siteLucideIcon";
import { useSiteCatalog } from "@/hooks/useCatalog";

const TONE_BG: Record<string, { color: string }> = {
  orange: { color: "orange" },
  teal: { color: "teal" },
  pink: { color: "grape" },
  amber: { color: "yellow" },
  blue: { color: "blue" },
};

export function TrustStrip() {
  const { data: site } = useSiteCatalog();
  if (!site) return null;
  const s = site;

  return (
    <FeatureBand
      columns={3}
      items={s.trustPillars.map((pillar, index) => ({
        id: `${pillar.title}-${index}`,
        title: pillar.title,
        description: pillar.desc,
        icon: (
          <ThemeIcon size={40} radius="xl" variant="light" color={(TONE_BG[pillar.tone] ?? TONE_BG.teal).color}>
            <SiteLucideIcon name={pillar.icon} size={20} />
          </ThemeIcon>
        ),
      }))}
    />
  );
}
