"use client";

import { Box, Center, Text } from "@mantine/core";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { useEffect, useMemo, useState } from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
  resolveBase?: string | null;
};

export function CdnImage({ src, resolveBase, alt, style, ...imgProps }: Props) {
  const resolved = useMemo(() => resolveImageUrl(src, resolveBase), [src, resolveBase]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <Center
        aria-label={alt || "Image placeholder"}
        style={{
          background: "linear-gradient(135deg, var(--mantine-color-gray-1), var(--mantine-color-beige-1))",
          minHeight: 120,
          ...style,
        }}
      >
        <Text c="dimmed" fz="xs" ta="center" px="sm">
          Photo unavailable
        </Text>
      </Center>
    );
  }

  return (
    <Box
      component="img"
      src={resolved}
      alt={alt ?? ""}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={style}
      {...imgProps}
    />
  );
}
