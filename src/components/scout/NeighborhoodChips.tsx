import { Chip, Group, Stack, Text } from "@mantine/core";

export function NeighborhoodChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (n: string | null) => void;
}) {
  return (
    <Stack gap="xs">
      <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.18em" }}>
        Region
      </Text>
      <Group gap="xs">
        <Chip
          checked={value === null}
          onChange={() => onChange(null)}
          radius="xl"
          variant={value === null ? "filled" : "outline"}
          color={value === null ? "dark" : "gray"}
        >
          All
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
