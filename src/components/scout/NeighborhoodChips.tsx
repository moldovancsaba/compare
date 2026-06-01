import { Chip, Group, Stack, Text } from "@mantine/core";
import type { AppLocale } from "@/lib/i18n/config";
import { getLocalText, getText, siteCopy, type LocalCopySource } from "@/lib/i18n/messages";

export function NeighborhoodChips({
  options,
  value,
  onChange,
  locale = "en",
  copySource = null,
}: {
  options: string[];
  value: string | null;
  onChange: (n: string | null) => void;
  locale?: AppLocale;
  copySource?: LocalCopySource;
}) {
  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
        {getLocalText(copySource, locale, "discover.regionLabel", siteCopy.discover.regionLabel)}
      </Text>
      <Group gap="xs">
        <Chip
          checked={value === null}
          onChange={() => onChange(null)}
          radius="xl"
          variant={value === null ? "filled" : "outline"}
          color={value === null ? "dark" : "gray"}
        >
          {getText(siteCopy.common.fallbackAll, locale)}
        </Chip>
        {options.map((n) => {
          return (
            <Chip
              key={n}
              checked={value === n}
              onChange={() => onChange(n)}
              radius="xl"
              variant={value === n ? "light" : "outline"}
              color={value === n ? "teal" : "gray"}
            >
              {n}
            </Chip>
          );
        })}
      </Group>
    </Stack>
  );
}
