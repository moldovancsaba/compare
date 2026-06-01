"use client";

import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { usePathname } from "next/navigation";
import { SectionPanel } from "@doneisbetter/gds-core/client";
import { CalendarClock, Globe, Heart, Instagram, Mail, MapPin, MessageCircle, Share2, X } from "@/lib/appIcons";
import { useSaved } from "@/store/useScout";
import { toast } from "@/lib/notify";
import { useMeetupGroupsCatalog, useSiteCatalog } from "@/hooks/useCatalog";
import { MeetupLogo } from "../MeetupLogo";
import { MeetupGroupCard } from "../MeetupGroupCard";
import type { MeetupGroup } from "@/types/meetup";
import { CdnImage } from "@/components/media/CdnImage";
import { formatBoroughLabel } from "@/data/locations";
import { normalizeLocale } from "@/lib/i18n/config";
import { parseLocaleFromPathname } from "@/lib/i18n/paths";
import { getLocalText, siteCopy } from "@/lib/i18n/messages";

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

function normalizeExternalUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function normalizeInstagramHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withoutProtocol = trimmed.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  const handle = withoutProtocol.replace(/^@/, "").replace(/\/+$/, "").split("/")[0];
  return handle || trimmed.replace(/^@/, "");
}

function formatUrlLabel(value: string, maxLength = 42) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function MeetupGroupProfile({
  group,
  onClose,
  onShare,
  onOpenAnother,
}: {
  group: MeetupGroup | null;
  onClose: () => void;
  onShare: (g: MeetupGroup) => void;
  onOpenAnother: (g: MeetupGroup) => void;
}) {
  const pathname = usePathname();
  const locale = normalizeLocale(parseLocaleFromPathname(pathname));
  const { data: site } = useSiteCatalog(locale);
  const { isSaved, toggle } = useSaved();
  const { data: allGroups = [] } = useMeetupGroupsCatalog();

  if (!group) return null;
  const localText = <T extends Record<"en" | "hu" | "it", string>>(path: string, fallback: T) =>
    getLocalText(site, locale, path, fallback);

  const saved = isSaved(group.id);
  const websiteUrl = normalizeExternalUrl(group.website);
  const instagramHandle = normalizeInstagramHandle(group.instagram);
  const instagramUrl = `https://instagram.com/${instagramHandle}`;
  const instagramLabel = `@${instagramHandle}`;

  const similar = allGroups.filter((item) => item.id !== group.id && item.borough === group.borough).slice(0, 3);

  const shareEmail = () => {
    const body = `${group.name} — ${group.groupType} / ${group.neighborhood}, ${formatBoroughLabel(
      group.borough,
      locale,
    )}.\n\n${group.description}\n\n${group.website}`;
    window.open(
      `mailto:?subject=${encodeURIComponent(`${group.name} / Compare`)}&body=${encodeURIComponent(body)}`,
    );
  };

  const shareWhatsapp = () => {
    const text = `${group.name} — ${group.neighborhood}, ${formatBoroughLabel(group.borough, locale)}. ${group.description} ${group.website}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Drawer
      opened={Boolean(group)}
      onClose={onClose}
      position="right"
      size="xl"
      padding={0}
      scrollAreaComponent={ScrollArea.Autosize}
      title={null}
    >
      <Stack gap={0}>
        <Box pos="relative" h={240}>
          {group.coverImageUrl?.trim() ? (
            <CdnImage
              resolveBase={group.website}
              src={group.coverImageUrl}
              alt={group.name}
              style={{ display: "block", height: "100%", width: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box h="100%" bg="teal.0" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Text size="xs" fw={700} tt="uppercase" c="teal.8" style={{ letterSpacing: "0.14em" }}>
                {localText("providerCard.imageUnavailable", {
                  en: "Image not available",
                  hu: "Kép nem elérhető",
                  it: "Immagine non disponibile",
                })}
              </Text>
            </Box>
          )}
          <Group pos="absolute" top={16} left={16} gap="xs">
            <Badge radius="xl" color="teal" variant="filled">
              {group.groupType}
            </Badge>
          </Group>
          <ActionIcon
            pos="absolute"
            top={16}
            right={16}
            variant="white"
            radius="xl"
            size="lg"
            onClick={onClose}
            aria-label={localText("meetupProfile.close", {
              en: "Close club details",
              hu: "Klubrészletek bezárása",
              it: "Chiudi dettagli club",
            })}
          >
            <X size={16} />
          </ActionIcon>
        </Box>

        <Stack gap="lg" p="lg" pb="xl">
          <Group align="flex-start" wrap="nowrap" gap="md">
            <MeetupLogo group={group} size="lg" />
            <Stack gap="xs" flex={1}>
              <Text size="xs" fw={700} tt="uppercase" c="teal.7">
                {localText("nav.clubs", siteCopy.nav.clubs)}
              </Text>
              <Title order={2}>{group.name}</Title>
              <Group gap="xs" c="dimmed">
                <MapPin size={16} />
                <Text size="sm">
                  {group.neighborhood}, {formatBoroughLabel(group.borough, locale)}
                </Text>
              </Group>
              <Group gap="xs">
                <Badge radius="xl" color="gray" variant="light">
                  {localText("providerCard.audience", siteCopy.providerCard.audience)} {group.ageRange}
                </Badge>
                <Badge radius="xl" color="gray" variant="outline" leftSection={<CalendarClock size={12} />}>
              {group.cadence}
                </Badge>
                <Badge radius="xl" color="orange" variant="light">
                  {group.groupType}
                </Badge>
              </Group>
            </Stack>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Button
              variant="default"
              leftSection={<Heart size={16} fill={saved ? "currentColor" : "none"} />}
              onClick={() => {
                toggle(group.id);
                toast.success(saved
                  ? localText("providerCard.removedToast", siteCopy.providerCard.removedToast)
                  : localText("meetupProfile.savedToast", { en: "Club saved", hu: "Klub mentve", it: "Club salvato" }));
              }}
            >
              {saved ? localText("nav.saved", siteCopy.nav.saved) : localText("meetupCard.save", { en: "Save club", hu: "Klub mentése", it: "Salva club" })}
            </Button>
            <Button component="a" href={websiteUrl} target="_blank" rel="noreferrer" color="dark">
              {localText("profile.visitWebsite", { en: "Visit website", hu: "Weboldal megnyitása", it: "Visita il sito" })}
            </Button>
            <Button variant="default" leftSection={<Share2 size={16} />} onClick={() => onShare(group)}>
              {localText("profile.share", { en: "Share", hu: "Megosztás", it: "Condividi" })}
            </Button>
            <Button
              component="a"
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              variant="default"
              leftSection={<Instagram size={16} />}
            >
              {localText("meetupProfile.openInstagram", { en: "Open Instagram", hu: "Instagram megnyitása", it: "Apri Instagram" })}
            </Button>
            <Button variant="default" leftSection={<Mail size={16} />} onClick={shareEmail}>
              Email
            </Button>
            <Button variant="default" leftSection={<MessageCircle size={16} />} onClick={shareWhatsapp}>
              WhatsApp
            </Button>
          </SimpleGrid>

          <SectionPanel title={localText("meetupProfile.about", { en: "About this club", hu: "A klubról", it: "Informazioni sul club" })}>
            <Text size="sm" c="dimmed">
              {group.description}
            </Text>
          </SectionPanel>

          <SectionPanel title={localText("meetupProfile.connect", { en: "Connect with this club", hu: "Kapcsolat a klubbal", it: "Contatta questo club" })} description={localText("meetupProfile.connectDescription", {
            en: "Use the public channels they share for event details and membership updates.",
            hu: "Használd a megadott nyilvános csatornákat esemény- és tagsági információkhoz.",
            it: "Usa i canali pubblici indicati per eventi e aggiornamenti.",
          })}>
            <Stack gap="sm">
              <ContactLinkItem
                icon={<Instagram size={14} />}
                label={instagramLabel}
                href={instagramUrl}
                external
              />
              <ContactLinkItem icon={<Globe size={14} />} label={formatUrlLabel(websiteUrl)} href={websiteUrl} external />
            </Stack>
          </SectionPanel>

          {similar.length ? (
            <SectionPanel title={localText("meetupProfile.similar", { en: "Similar clubs nearby", hu: "Hasonló klubok a közelben", it: "Club simili nelle vicinanze" })} description={localText("meetupProfile.similarDescription", {
              en: "Other clubs in the same country worth checking out.",
              hu: "További klubok ugyanabban az országban.",
              it: "Altri club nello stesso paese da valutare.",
            })}>
              <Stack gap="md">
                {similar.map((item) => (
                  <MeetupGroupCard key={item.id} group={item} onOpen={onOpenAnother} onShare={onShare} locale={locale} copySource={site} />
                ))}
              </Stack>
            </SectionPanel>
          ) : null}
        </Stack>
      </Stack>
    </Drawer>
  );
}
