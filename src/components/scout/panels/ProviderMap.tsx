import { Box, Button, Loader, Paper, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { Navigation } from "@/lib/appIcons";

const BOROUGH_CENTERS: Record<string, [number, number]> = {
  Manhattan: [40.7831, -73.9712],
  Brooklyn: [40.6782, -73.9442],
  Queens: [40.7282, -73.7949],
  Bronx: [40.8448, -73.8648],
  "Staten Island": [40.5795, -74.1502],
};

export function ProviderMap({ address, borough }: { address: string; borough: string }) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data[0]) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setCoords(BOROUGH_CENTERS[borough] ?? BOROUGH_CENTERS.Manhattan);
        }
      })
      .catch(() => {
        if (!cancelled) setCoords(BOROUGH_CENTERS[borough] ?? BOROUGH_CENTERS.Manhattan);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address, borough]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  const bbox = coords
    ? `${coords[1] - 0.005},${coords[0] - 0.003},${coords[1] + 0.005},${coords[0] + 0.003}`
    : "";
  const src = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords[0]},${coords[1]}`
    : "";

  return (
    <Paper radius="xl" p="lg" bg="beige.1">
      <Stack gap="md">
      <Title order={3} size="h5">
        Location
      </Title>
      <Box style={{ height: 192, overflow: "hidden", borderRadius: "var(--mantine-radius-xl)", background: "var(--mantine-color-gray-1)" }}>
        {loading || !coords ? (
          <Loader mx="auto" my="xl" />
        ) : (
          <iframe
            title={`Map of ${address}`}
            src={src}
            style={{ height: "100%", width: "100%", border: 0 }}
            loading="lazy"
          />
        )}
      </Box>
      <Text size="sm" c="dimmed">
        {address}
      </Text>
      <Button
        variant="default"
        color="dark"
        fullWidth
        leftSection={<Navigation size={16} />}
        onClick={() => window.open(directionsUrl, "_blank", "noopener,noreferrer")}
      >
        Get directions
      </Button>
      </Stack>
    </Paper>
  );
}
