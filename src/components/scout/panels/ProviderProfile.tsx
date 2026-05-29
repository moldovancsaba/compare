"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { SectionPanel } from "@doneisbetter/gds-core/client";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Globe,
  Heart,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  Share2,
  Star,
  X,
} from "@/lib/appIcons";
import { useSaved, useCalculator } from "@/store/useScout";
import { toast } from "@/lib/notify";
import { useProvidersCatalog } from "@/hooks/useCatalog";
import { CdnImage } from "@/components/media/CdnImage";
import { ProviderCard } from "../ProviderCard";
import { ProviderMap } from "./ProviderMap";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { CMS_MEDIA } from "@/config/defaultMedia";
import { formatBoroughLabel } from "@/data/locations";
import type { Provider } from "@/types/provider";
import { discoveryFeatureFlags } from "@/lib/discoveryConfig";
import { deriveUpcomingOccurrences, formatUpcomingOccurrenceLabel } from "@/lib/providerSchedule";

function normalizeExternalUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function ContactLinkItem({
  icon,
  label,
  href,
  external = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  external?: boolean;
}) {
  return (
    <Anchor
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      underline="never"
      c="dark.7"
      style={{ display: "block", minWidth: 0 }}
      title={href}
    >
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        <ThemeIcon variant="light" color="gray" radius="xl">
          {icon}
        </ThemeIcon>
        <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
          {label}
        </Text>
      </Group>
    </Anchor>
  );
}

export function ProviderProfile({
  provider,
  onClose,
  onShare,
  onOpenAnother,
}: {
  provider: Provider | null;
  onClose: () => void;
  onShare: (p: Provider) => void;
  onOpenAnother: (p: Provider) => void;
}) {
  const { data: allProviders = [] } = useProvidersCatalog();
  const { isSaved, toggle } = useSaved();
  const { add } = useCalculator();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [bannerOpen, setBannerOpen] = useState(true);

  useEffect(() => {
    setPhotoIdx(0);
    setBannerOpen(true);
  }, [provider?.id]);

  const gallery = useMemo(() => {
    if (!provider) return [];
    const urls: string[] = [];
    const seen = new Set<string>();

    const append = (raw?: string) => {
      const resolved = resolveImageUrl(raw, provider.website);
      if (!resolved || seen.has(resolved)) return;
      seen.add(resolved);
      urls.push(resolved);
    };

    append(provider.image);
    for (const image of provider.galleryImages ?? []) append(image);
    if (urls.length === 0) urls.push(CMS_MEDIA.fallbackListing);
    return urls;
  }, [provider]);

  if (!provider) return null;

  const saved = isSaved(provider.id);
  const current = gallery[Math.min(photoIdx, Math.max(gallery.length - 1, 0))] ?? CMS_MEDIA.fallbackListing;
  const websiteUrl = normalizeExternalUrl(provider.website);
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://rangescout.vercel.app";
  const providerUrl = `${appOrigin}/p/${provider.id}`;

  const similar = allProviders
    .filter((item) => item.id !== provider.id && item.borough === provider.borough && item.category === provider.category)
    .slice(0, 3);
  const upcomingOccurrences = deriveUpcomingOccurrences(provider, new Date(), 7).slice(0, 5);
  const nextOccurrenceLabel = formatUpcomingOccurrenceLabel(provider.nextOccurrence);

  const shareEmail = () => {
    const body = `Check out ${provider.name} — ${provider.category} in ${provider.neighborhood}, ${formatBoroughLabel(
      provider.borough,
    )}.\n\n${provider.shortDescription}\nFrom EUR ${provider.pricePerClass}/session.\n\n${providerUrl}`;
    window.open(
      `mailto:?subject=${encodeURIComponent(`${provider.name} on RangeScout EU`)}&body=${encodeURIComponent(body)}`,
    );
  };

  const shareWhatsapp = () => {
    const text = `${provider.name} (${provider.category}) in ${provider.neighborhood}, ${formatBoroughLabel(
      provider.borough,
    )} — EUR ${provider.pricePerClass}/session. ${provider.shortDescription} ${providerUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Drawer
      opened={Boolean(provider)}
      onClose={onClose}
      position="right"
      size="xl"
      padding={0}
      scrollAreaComponent={ScrollArea.Autosize}
      title={null}
    >
      <Stack gap={0}>
        <Box pos="relative" h={320}>
          <CdnImage
            resolveBase={provider.website}
            src={current}
            alt={provider.name}
            style={{ display: "block", height: "100%", width: "100%", objectFit: "cover" }}
          />

          <Group pos="absolute" top={16} left={16} gap="xs">
            <Badge radius="xl" color="teal" variant="filled">
              {provider.category}
            </Badge>
            {provider.badges.slice(0, 2).map((badge) => (
              <Badge key={badge} radius="xl" color="dark" variant="filled">
                {badge}
              </Badge>
            ))}
          </Group>

          <Group pos="absolute" top={16} right={16} gap="xs">
            <Badge radius="xl" color="dark" variant="filled">
              {photoIdx + 1} / {gallery.length}
            </Badge>
            <ActionIcon variant="white" radius="xl" size="lg" onClick={onClose} aria-label="Close provider details">
              <X size={16} />
            </ActionIcon>
          </Group>

          {gallery.length > 1 ? (
            <>
              <ActionIcon
                pos="absolute"
                left={16}
                top="50%"
                radius="xl"
                size="lg"
                variant="white"
                style={{ transform: "translateY(-50%)" }}
                onClick={() => setPhotoIdx((index) => (index - 1 + gallery.length) % gallery.length)}
                aria-label="Previous photo"
              >
                <ChevronLeft size={18} />
              </ActionIcon>
              <ActionIcon
                pos="absolute"
                right={16}
                top="50%"
                radius="xl"
                size="lg"
                variant="white"
                style={{ transform: "translateY(-50%)" }}
                onClick={() => setPhotoIdx((index) => (index + 1) % gallery.length)}
                aria-label="Next photo"
              >
                <ChevronRight size={18} />
              </ActionIcon>
              <Group pos="absolute" bottom={16} left="50%" gap={8} style={{ transform: "translateX(-50%)" }}>
                {gallery.map((_, index) => (
                  <UnstyledButton
                    key={`${provider.id}-gallery-${index}`}
                    onClick={() => setPhotoIdx(index)}
                    aria-label={`Go to photo ${index + 1}`}
                  >
                    <Box
                      h={8}
                      w={index === photoIdx ? 26 : 8}
                      bg={index === photoIdx ? "teal.5" : "white"}
                      style={{ borderRadius: 999, opacity: index === photoIdx ? 1 : 0.85, transition: "all 160ms ease" }}
                    />
                  </UnstyledButton>
                ))}
              </Group>
            </>
          ) : null}
        </Box>

        <Stack gap="lg" p="lg" pb="xl">
          {provider.announcementTitle && bannerOpen ? (
            <Paper radius="xl" p="md" bg="teal.0" withBorder>
              <Group align="flex-start" justify="space-between" wrap="nowrap">
                <Group align="flex-start" wrap="nowrap" gap="sm">
                  <ThemeIcon variant="light" color="teal" radius="xl" size="lg">
                    <Megaphone size={16} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text ff="heading" fw={600} size="sm">
                      {provider.announcementTitle}
                    </Text>
                    {provider.announcementDescription ? (
                      <Text size="sm" c="dimmed">
                        {provider.announcementDescription}
                      </Text>
                    ) : null}
                  </Stack>
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  onClick={() => setBannerOpen(false)}
                  aria-label="Dismiss announcement"
                >
                  <X size={16} />
                </ActionIcon>
              </Group>
            </Paper>
          ) : null}

          {gallery.length > 1 ? (
            <ScrollArea>
              <Group gap="sm" wrap="nowrap">
                {gallery.map((src, index) => (
                  <UnstyledButton
                    key={`${provider.id}-thumb-${index}`}
                    onClick={() => setPhotoIdx(index)}
                    aria-label={`View photo ${index + 1}`}
                  >
                    <Paper
                      radius="lg"
                      withBorder
                      style={{
                        overflow: "hidden",
                        borderColor:
                          index === photoIdx ? "var(--mantine-color-teal-5)" : "var(--mantine-color-gray-3)",
                        borderWidth: index === photoIdx ? 2 : 1,
                      }}
                    >
                      <CdnImage
                        resolveBase={provider.website}
                        src={src}
                        alt={`${provider.name} photo ${index + 1}`}
                        style={{ display: "block", height: 72, width: 112, objectFit: "cover" }}
                      />
                    </Paper>
                  </UnstyledButton>
                ))}
              </Group>
            </ScrollArea>
          ) : null}

          <Stack gap="sm">
            <Text size="xs" fw={700} tt="uppercase" c="teal.7">
              {provider.category}
            </Text>
            <Title order={2}>{provider.name}</Title>
            <Group gap="xs" c="dimmed">
              <MapPin size={16} />
              <Text size="sm">{provider.address}</Text>
            </Group>
            <Group gap="lg">
              <Group gap={6}>
                <Star size={16} fill="var(--mantine-color-orange-5)" color="var(--mantine-color-orange-5)" />
                <Text fw={600}>{provider.rating}</Text>
                <Text c="dimmed" size="sm">
                  ({provider.reviewCount} reviews)
                </Text>
              </Group>
              <Text ff="heading" fw={700} size="lg" c="orange.5">
                EUR {provider.pricePerClass}
                <Text span size="sm" fw={400} c="dimmed">
                  /session
                </Text>
              </Text>
            </Group>
            <Group gap="xs">
              {provider.activityTypes.map((item) => (
                <Badge key={item} radius="xl" color="teal" variant="light">
                  {item}
                </Badge>
              ))}
              {provider.ageRanges.map((age) => (
                <Badge key={age} radius="xl" color="gray" variant="light">
                  Audience {age}
                </Badge>
              ))}
              {provider.dayTimeTags.map((tag) => (
                <Badge key={tag} radius="xl" color="gray" variant="outline">
                  {tag}
                </Badge>
              ))}
            </Group>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {provider.bookingEnabled ? (
              <Button
                leftSection={<Calendar size={16} />}
                disabled
              >
                Book now
              </Button>
            ) : (
              <Button color="dark" component="a" href={websiteUrl} target="_blank" rel="noreferrer">
                Visit website
              </Button>
            )}
            <Button
              color="dark"
              variant="light"
              leftSection={<Plus size={16} />}
              onClick={() => {
                add(provider.id);
                toast.success(`${provider.name} added to planner`);
              }}
            >
              Add to calculator
            </Button>
          </SimpleGrid>

          <SectionPanel title="Contact this provider" description="Reach out directly for booking, questions, or schedule details.">
            <Stack gap="sm">
              <ContactLinkItem icon={<Mail size={14} />} label={provider.email} href={`mailto:${provider.email}`} />
              <ContactLinkItem icon={<Phone size={14} />} label={provider.phone} href={`tel:${provider.phone}`} />
              <ContactLinkItem icon={<Globe size={14} />} label={provider.website} href={websiteUrl} external />
            </Stack>
          </SectionPanel>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Button
              variant="default"
              leftSection={<Heart size={16} fill={saved ? "currentColor" : "none"} />}
              onClick={() => {
                toggle(provider.id);
                toast.success(saved ? "Removed from saved" : "Saved");
              }}
            >
              {saved ? "Saved" : "Save provider"}
            </Button>
            <Button variant="default" leftSection={<Share2 size={16} />} onClick={() => onShare(provider)}>
              Share
            </Button>
            <Button variant="default" leftSection={<Mail size={16} />} onClick={shareEmail}>
              Email
            </Button>
            <Button variant="default" leftSection={<MessageCircle size={16} />} onClick={shareWhatsapp}>
              WhatsApp
            </Button>
          </SimpleGrid>

          <SectionPanel title="About this provider">
            <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-line" }}>
              {provider.longDescription}
            </Text>
          </SectionPanel>

          {discoveryFeatureFlags.upcomingRenderingEnabled && (nextOccurrenceLabel || upcomingOccurrences.length > 0) ? (
            <SectionPanel
              title="Upcoming schedule"
              description="Source-backed upcoming availability within the next seven days when available."
            >
              <Stack gap="md">
                {nextOccurrenceLabel ? (
                  <Paper radius="lg" p="md" bg="teal.0" withBorder>
                    <Stack gap={4}>
                      <Text size="xs" fw={700} tt="uppercase" c="teal.7">
                        Next up
                      </Text>
                      <Text fw={600}>{provider.nextOccurrence?.title ?? provider.name}</Text>
                      <Text size="sm" c="dimmed">
                        {nextOccurrenceLabel}
                      </Text>
                    </Stack>
                  </Paper>
                ) : null}
                {upcomingOccurrences.length > 0 ? (
                  <Stack gap="xs">
                    {upcomingOccurrences.map((occurrence) => (
                      <Paper key={`${occurrence.source}-${occurrence.id}-${occurrence.startDate}`} radius="lg" p="md" bg="beige.0" withBorder>
                        <Group justify="space-between" align="flex-start" gap="md">
                          <Stack gap={4}>
                            <Text fw={600}>{occurrence.title}</Text>
                            <Text size="sm" c="dimmed">
                              {formatUpcomingOccurrenceLabel(occurrence)}
                            </Text>
                            {occurrence.summary ? (
                              <Text size="sm" c="dimmed">
                                {occurrence.summary}
                              </Text>
                            ) : null}
                          </Stack>
                          {occurrence.isDropIn ? (
                            <Badge radius="xl" color="teal" variant="light">
                              Drop-in
                            </Badge>
                          ) : null}
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </SectionPanel>
          ) : null}

          {provider.recurringPrograms?.length ? (
            <SectionPanel
              title="Recurring programs"
              description="Structured schedule details for ongoing classes, series, and repeating activities."
            >
              <Stack gap="md">
                {provider.recurringPrograms.map((program) => (
                  <Paper key={program.id} radius="lg" p="md" bg="beige.0" withBorder>
                    <Stack gap="sm">
                      <Group gap="xs">
                        <Text fw={600}>{program.title}</Text>
                        <Badge radius="xl" color="gray" variant="light">
                          {program.cadence}
                        </Badge>
                        {program.isDropIn ? (
                          <Badge radius="xl" color="teal" variant="light">
                            Drop-in
                          </Badge>
                        ) : null}
                      </Group>
                      <Text size="sm">
                        {program.daysOfWeek.length ? `${program.daysOfWeek.join(", ")} · ` : ""}
                        {program.timeText}
                      </Text>
                      {program.summary ? (
                        <Text size="sm" c="dimmed">
                          {program.summary}
                        </Text>
                      ) : null}
                      <Group gap="xs">
                        {(program.activityTypes ?? []).map((activity) => (
                          <Badge key={activity} radius="xl" color="teal" variant="light">
                            {activity}
                          </Badge>
                        ))}
                        {(program.ageRanges ?? []).map((age) => (
                          <Badge key={age} radius="xl" color="gray" variant="light">
                            Audience {age}
                          </Badge>
                        ))}
                      </Group>
                      {program.locationNote || program.priceText || program.registrationUrl || program.startDate || program.endDate ? (
                        <Stack gap={4}>
                          {program.locationNote ? (
                            <Text size="xs" c="dimmed">
                              Location: {program.locationNote}
                            </Text>
                          ) : null}
                          {program.priceText ? (
                            <Text size="xs" c="dimmed">
                              Pricing: {program.priceText}
                            </Text>
                          ) : null}
                          {program.startDate || program.endDate ? (
                            <Text size="xs" c="dimmed">
                              {program.startDate ?? "Open"} to {program.endDate ?? "ongoing"}
                            </Text>
                          ) : null}
                          {program.registrationUrl ? (
                            <Button
                              component="a"
                              href={program.registrationUrl}
                              target="_blank"
                              rel="noreferrer"
                              variant="subtle"
                              color="teal"
                              justify="flex-start"
                              px={0}
                            >
                              Registration details
                            </Button>
                          ) : null}
                        </Stack>
                      ) : null}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </SectionPanel>
          ) : null}

          <ProviderMap address={provider.address} borough={provider.borough} />

          {similar.length ? (
            <SectionPanel title="Similar providers nearby" description="More options in the same country and category.">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {similar.map((item) => (
                  <ProviderCard key={item.id} provider={item} onOpen={onOpenAnother} onShare={onShare} />
                ))}
              </SimpleGrid>
            </SectionPanel>
          ) : null}
        </Stack>
      </Stack>
    </Drawer>
  );
}
