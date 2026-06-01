import { ActionIcon, Box, Button, Group, Text } from "@mantine/core";
import { PublicProductCard } from "@doneisbetter/gds-core/client";
import { Heart, Share2, Instagram } from "@/lib/appIcons";
import { useSaved } from "@/store/useScout";
import { toast } from "@/lib/notify";
import type { MeetupGroup } from "@/types/meetup";
import { CdnImage } from "@/components/media/CdnImage";
import { formatBoroughLabel } from "@/data/locations";
import type { AppLocale } from "@/lib/i18n/config";
import { getLocalText, siteCopy, type LocalCopySource } from "@/lib/i18n/messages";

interface Props {
  group: MeetupGroup;
  onOpen: (g: MeetupGroup) => void;
  onShare: (g: MeetupGroup) => void;
  locale?: AppLocale;
  copySource?: LocalCopySource;
}

export function MeetupGroupCard({ group, onOpen, onShare, locale = "en", copySource = null }: Props) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(group.id);
  const instagramHandle = normalizeInstagramHandle(group.instagram);
  const instagramHref = `https://instagram.com/${instagramHandle}`;
  const instagramLabel = `@${instagramHandle}`;

  return (
    <PublicProductCard
      image={
        group.coverImageUrl?.trim() ? (
          <CdnImage
            resolveBase={group.website}
            src={group.coverImageUrl}
            alt={group.name}
            style={{ display: "block", height: 144, width: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box h={144} p="lg" bg="teal.0" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text size="xs" fw={700} tt="uppercase" ta="center" c="teal.8" style={{ letterSpacing: "0.14em" }}>
              {getLocalText(copySource, locale, "providerCard.imageUnavailable", {
                en: "Image not available",
                hu: "Kép nem elérhető",
                it: "Immagine non disponibile",
              })}
            </Text>
          </Box>
        )
      }
      title={group.name}
      description={group.description}
      helperText={`${group.neighborhood}, ${formatBoroughLabel(group.borough, locale)}`}
      helperKind="supporting"
      metadata={[
        { label: getLocalText(copySource, locale, "meetupCard.type", { en: "Type", hu: "Típus", it: "Tipo" }), value: group.groupType },
        { label: getLocalText(copySource, locale, "providerCard.audience", siteCopy.providerCard.audience), value: group.ageRange },
        { label: getLocalText(copySource, locale, "meetupCard.cadence", { en: "Cadence", hu: "Ütemezés", it: "Cadenza" }), value: group.cadence },
        { label: getLocalText(copySource, locale, "meetupCard.channel", { en: "Channel", hu: "Csatorna", it: "Canale" }), value: instagramLabel },
      ]}
      primaryAction={
        <Button onClick={() => onOpen(group)} color="dark">
          {getLocalText(copySource, locale, "providerCard.viewDetails", siteCopy.providerCard.viewDetails)}
        </Button>
      }
      secondaryAction={
        <Group gap="xs">
          <Button
            component="a"
            href={instagramHref}
            target="_blank"
            rel="noreferrer"
            variant="subtle"
            color="dark"
            justify="flex-start"
            leftSection={<Instagram size={14} />}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              style={{
                display: "inline-block",
                maxWidth: 132,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                verticalAlign: "bottom",
              }}
              title={instagramHref}
            >
              {instagramLabel}
            </span>
          </Button>
          <ActionIcon
            variant="default"
            radius="xl"
            size="lg"
            onClick={() => {
              toggle(group.id);
              toast.success(saved
                ? getLocalText(copySource, locale, "providerCard.removedToast", siteCopy.providerCard.removedToast)
                : getLocalText(copySource, locale, "providerCard.savedToast", siteCopy.providerCard.savedToast));
            }}
            aria-label={saved
              ? getLocalText(copySource, locale, "meetupCard.removeSaved", { en: "Remove club from saved", hu: "Klub eltávolítása a mentettekből", it: "Rimuovi club dai salvati" })
              : getLocalText(copySource, locale, "meetupCard.save", { en: "Save club", hu: "Klub mentése", it: "Salva club" })}
          >
            <Heart
              size={16}
              color={saved ? "var(--mantine-color-orange-5)" : "currentColor"}
              fill={saved ? "currentColor" : "none"}
            />
          </ActionIcon>
          <ActionIcon
            variant="default"
            size="lg"
            radius="xl"
            aria-label={getLocalText(copySource, locale, "meetupCard.share", { en: "Share club", hu: "Klub megosztása", it: "Condividi club" })}
            onClick={() => onShare(group)}
          >
            <Share2 size={16} />
          </ActionIcon>
        </Group>
      }
    />
  );
}

function normalizeInstagramHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withoutProtocol = trimmed.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  const handle = withoutProtocol.replace(/^@/, "").replace(/\/+$/, "").split("/")[0];
  return handle || trimmed.replace(/^@/, "");
}
