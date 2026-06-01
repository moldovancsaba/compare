import { Badge, Button, Chip, Collapse, Group, Paper, Stack, Text } from "@mantine/core";
import { AGE_RANGES, DAY_TIME_TAGS, ACTIVITY_TYPES } from "@/data/providers";
import type { AgeRange, DayTimeTag } from "@/types/provider";
import { SlidersHorizontal } from "@/lib/appIcons";
import { useState } from "react";
import type { AppLocale } from "@/lib/i18n/config";
import { getLocalFilterValueLabel, getLocalText, siteCopy, type LocalCopySource } from "@/lib/i18n/messages";

export interface FilterState {
  ages: AgeRange[];
  times: DayTimeTag[];
  activity: string | null;
}

export const EMPTY_FILTERS: FilterState = { ages: [], times: [], activity: null };

export function Filters({
  value,
  onChange,
  locale = "en",
  copySource = null,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  locale?: AppLocale;
  copySource?: LocalCopySource;
}) {
  const [open, setOpen] = useState(false);
  const has = value.ages.length + value.times.length + (value.activity ? 1 : 0);

  const toggle = <T,>(arr: T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Button
          variant="default"
          leftSection={<SlidersHorizontal size={16} />}
          onClick={() => setOpen((o) => !o)}
        >
          {getLocalText(copySource, locale, "filters.button", siteCopy.filters.button)} {has > 0 && <Badge color="teal" variant="filled">{has}</Badge>}
        </Button>
        {has > 0 && (
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            {getLocalText(copySource, locale, "filters.clearAll", siteCopy.filters.clearAll)}
          </Button>
        )}
      </Group>

      <Collapse in={open}>
        <Paper withBorder radius="xl" p="lg">
          <Stack gap="lg">
            <Stack gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
                {getLocalText(copySource, locale, "filters.audience", siteCopy.filters.audience)}
              </Text>
              <Group gap="xs">
                {AGE_RANGES.map((a) => (
                  <Chip
                    key={a}
                    checked={value.ages.includes(a)}
                    onChange={() => onChange({ ...value, ages: toggle(value.ages, a) })}
                    radius="xl"
                    size="sm"
                    variant={value.ages.includes(a) ? "filled" : "outline"}
                    color={value.ages.includes(a) ? "teal" : "gray"}
                  >
                    {getLocalFilterValueLabel(copySource, a, locale)}
                  </Chip>
                ))}
              </Group>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
                {getLocalText(copySource, locale, "filters.availability", siteCopy.filters.availability)}
              </Text>
              <Group gap="xs">
                {DAY_TIME_TAGS.map((d) => (
                  <Chip
                    key={d}
                    checked={value.times.includes(d)}
                    onChange={() => onChange({ ...value, times: toggle(value.times, d) })}
                    radius="xl"
                    size="sm"
                    variant={value.times.includes(d) ? "filled" : "outline"}
                    color={value.times.includes(d) ? "teal" : "gray"}
                  >
                    {getLocalFilterValueLabel(copySource, d, locale)}
                  </Chip>
                ))}
              </Group>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
                {getLocalText(copySource, locale, "filters.activity", siteCopy.filters.activity)}
              </Text>
              <Group gap="xs">
                <Chip
                  checked={value.activity === null}
                  onChange={() => onChange({ ...value, activity: null })}
                  radius="xl"
                  size="sm"
                  variant={value.activity === null ? "filled" : "outline"}
                  color={value.activity === null ? "teal" : "gray"}
                >
                  {getLocalText(copySource, locale, "filters.any", siteCopy.filters.any)}
                </Chip>
                {ACTIVITY_TYPES.map((t) => (
                  <Chip
                    key={t}
                    checked={value.activity === t}
                    onChange={() => onChange({ ...value, activity: t })}
                    radius="xl"
                    size="sm"
                    variant={value.activity === t ? "filled" : "outline"}
                    color={value.activity === t ? "teal" : "gray"}
                  >
                    {getLocalFilterValueLabel(copySource, t, locale)}
                  </Chip>
                ))}
              </Group>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>
    </Stack>
  );
}
