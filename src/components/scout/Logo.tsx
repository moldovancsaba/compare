import Image from "next/image";
import { Avatar, Group, Stack, Text } from "@mantine/core";

const DEFAULT_LOGO_URL = "/images/class_scout_notext.png";

export function Logo({
  logoUrl: _logoUrl,
  size = 128,
  withWordmark = true,
  className = "",
}: {
  /** Retained for compatibility; the app now uses the local SSOT logo asset. */
  logoUrl?: string | null;
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <Group gap="md" className={className} wrap="nowrap">
      <Avatar radius="xl" size={size} color="white">
        <Image
          src={DEFAULT_LOGO_URL}
          alt="Class Scout NY logo"
          fill
          sizes={`${size}px`}
          style={{ objectFit: "cover" }}
          priority={size <= 64}
        />
      </Avatar>
      {withWordmark && (
        <Stack gap={0}>
          <Text ff="heading" fw={700} fz="xl" c="inherit" lh={1.05}>
            Class Scout
          </Text>
          <Text ff="heading" fw={700} fz="xs" c="teal.6" tt="uppercase" style={{ letterSpacing: "0.2em" }}>
            New York
          </Text>
        </Stack>
      )}
    </Group>
  );
}
