import { Chip, Group, Stack, Text } from "@mantine/core";
import { BOROUGHS, formatBoroughLabel } from "@/data/locations";
import type { BoroughChoice } from "@/types/provider";
import type { AppLocale } from "@/lib/i18n/config";
import { getLocalText, getText, siteCopy, type LocalCopySource } from "@/lib/i18n/messages";

export function BoroughBar({
  value,
  onChange,
  locale = "en",
  copySource = null,
}: {
  value: BoroughChoice;
  onChange: (b: BoroughChoice) => void;
  locale?: AppLocale;
  copySource?: LocalCopySource;
}) {
  const choices: BoroughChoice[] = ["All", ...BOROUGHS];
  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
        {getLocalText(copySource, locale, "discover.countryLabel", siteCopy.discover.countryLabel)}
      </Text>
      <Group gap="xs">
        {choices.map((b) => {
          const label = b === "All" ? getText(siteCopy.common.fallbackAll, locale) : formatBoroughLabel(b, locale);
          return (
            <Chip
              key={b}
              checked={value === b}
              onChange={() => onChange(b)}
              radius="xl"
              variant={value === b ? "filled" : "outline"}
              color={value === b ? "teal" : "gray"}
            >
              {label}
            </Chip>
          );
        })}
      </Group>
    </Stack>
  );
}
