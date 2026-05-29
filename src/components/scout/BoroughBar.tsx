import { Chip, Group, Stack, Text } from "@mantine/core";
import { BOROUGHS, formatBoroughLabel } from "@/data/locations";
import type { BoroughChoice } from "@/types/provider";

export function BoroughBar({ value, onChange }: { value: BoroughChoice; onChange: (b: BoroughChoice) => void }) {
  const choices: BoroughChoice[] = ["All", ...BOROUGHS];
  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
        Country
      </Text>
      <Group gap="xs">
        {choices.map((b) => {
          const label = b === "All" ? "All" : formatBoroughLabel(b);
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
