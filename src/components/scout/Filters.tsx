import { Badge, Button, Chip, Collapse, Group, Paper, Stack, Text } from "@mantine/core";
import { AGE_RANGES, DAY_TIME_TAGS, ACTIVITY_TYPES } from "@/data/providers";
import type { AgeRange, DayTimeTag } from "@/types/provider";
import { SlidersHorizontal } from "@/lib/appIcons";
import { useState } from "react";

export interface FilterState {
  ages: AgeRange[];
  times: DayTimeTag[];
  activity: string | null;
}

export const EMPTY_FILTERS: FilterState = { ages: [], times: [], activity: null };

export function Filters({ value, onChange }: { value: FilterState; onChange: (v: FilterState) => void }) {
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
          Filters {has > 0 && <Badge color="teal" variant="filled">{has}</Badge>}
        </Button>
        {has > 0 && (
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Clear all
          </Button>
        )}
      </Group>

      <Collapse in={open}>
        <Paper withBorder radius="xl" p="lg">
          <Stack gap="lg">
            <Stack gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
                Audience
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
                    {a}
                  </Chip>
                ))}
              </Group>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
                Availability
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
                    {d}
                  </Chip>
                ))}
              </Group>
            </Stack>
            <Stack gap="xs">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
                Activity
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
                  Any
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
                    {t}
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
