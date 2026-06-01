import { ActionIcon, Box, Button, Group, Text } from "@mantine/core";
import { PublicProductCard } from "@doneisbetter/gds-core/client";
import { Heart, Share2, Plus, Star, Calendar } from "@/lib/appIcons";
import type { Provider } from "@/types/provider";
import { CdnImage } from "@/components/media/CdnImage";
import { useSaved, useCalculator } from "@/store/useScout";
import { toast } from "@/lib/notify";
import { formatBoroughLabel } from "@/data/locations";
import type { AppLocale } from "@/lib/i18n/config";
import { getLocalFilterValueLabel, getLocalText, interpolate, siteCopy, type LocalCopySource } from "@/lib/i18n/messages";
import { getLocalizedProviderCopy } from "@/lib/providerLocalization";

interface Props {
  provider: Provider;
  onOpen: (p: Provider) => void;
  onShare: (p: Provider) => void;
  highlightUpcoming?: boolean;
  subtitle?: string;
  locale?: AppLocale;
  copySource?: LocalCopySource;
}

export function ProviderCard({ provider, onOpen, onShare, highlightUpcoming = false, subtitle, locale = "en", copySource = null }: Props) {
  const { isSaved, toggle } = useSaved();
  const { add } = useCalculator();
  const saved = isSaved(provider.id);
  const providerCopy = getLocalizedProviderCopy(provider, locale);
  const upcomingLabel = subtitle ?? undefined;
  const copy = siteCopy.providerCard;
  const priceLabel =
    provider.pricePerClass > 0
      ? `EUR ${provider.pricePerClass}/${getLocalText(copySource, locale, "providerCard.priceUnitSession", copy.priceUnitSession)}`
      : getLocalText(copySource, locale, "providerCard.priceOnRequest", {
          en: "Price on request",
          hu: "Ár egyeztetés alapján",
          it: "Prezzo su richiesta",
        });
  const ratingMetadata =
    provider.reviewCount > 0
      ? [{
          label: getLocalText(copySource, locale, "providerCard.rating", copy.rating),
          value: (
            <Group gap={4} justify="flex-end" wrap="nowrap">
              <Star size={16} fill="var(--mantine-color-orange-5)" color="var(--mantine-color-orange-5)" />
              <span>{provider.rating}</span>
              <span style={{ color: "var(--mantine-color-dimmed)" }}>({provider.reviewCount})</span>
            </Group>
          ),
        }]
      : [{
          label: getLocalText(copySource, locale, "providerCard.rating", copy.rating),
          value: getLocalText(copySource, locale, "providerCard.noReviews", {
            en: "No public reviews yet",
            hu: "Még nincs nyilvános értékelés",
            it: "Nessuna recensione pubblica",
          }),
        }];

  return (
    <PublicProductCard
      image={
        provider.image?.trim() ? (
          <CdnImage
            resolveBase={provider.website}
            src={provider.image}
            alt={provider.name}
            style={{ display: "block", height: 176, width: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box
            h={176}
            p="lg"
            bg="teal.0"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: "1px solid var(--mantine-color-gray-2)",
            }}
          >
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
      title={provider.name}
      description={providerCopy.shortDescription}
      price={priceLabel}
      helperText={
        highlightUpcoming && upcomingLabel
          ? `${getLocalText(copySource, locale, "providerCard.nextPrefix", copy.nextPrefix)}: ${upcomingLabel}`
          : `${provider.neighborhood}, ${formatBoroughLabel(provider.borough, locale)}`
      }
      helperKind="supporting"
      stateLabels={{
        available: providerCopy.announcementBadge ||
          getLocalText(copySource, locale, "providerCard.sourceVerified", {
          en: "Verified",
          hu: "Ellenőrzött",
          it: "Verificato",
        }),
      }}
      metadata={[
        ...(highlightUpcoming && upcomingLabel
          ? [{
              label: getLocalText(copySource, locale, "providerCard.upcoming", copy.upcoming),
              value: upcomingLabel,
            }]
          : []),
        {
          label: getLocalText(copySource, locale, "providerCard.disciplines", copy.disciplines),
          value: provider.activityTypes.slice(0, 3).map((value) => getLocalFilterValueLabel(copySource, value, locale)).join(" · "),
        },
        {
          label: getLocalText(copySource, locale, "providerCard.audience", copy.audience),
          value: provider.ageRanges.slice(0, 2).map((value) => getLocalFilterValueLabel(copySource, value, locale)).join(", "),
        },
        {
          label: getLocalText(copySource, locale, "providerCard.tags", copy.tags),
          value: provider.dayTimeTags.slice(0, 2).map((value) => getLocalFilterValueLabel(copySource, value, locale)).join(" · "),
        },
        ...ratingMetadata,
      ]}
      primaryAction={
        provider.bookingEnabled ? (
          <Button onClick={() => onOpen(provider)} leftSection={<Calendar size={16} />}>
            {getLocalText(copySource, locale, "providerCard.bookNow", copy.bookNow)}
          </Button>
        ) : (
          <Button onClick={() => onOpen(provider)} color="dark">
            {getLocalText(copySource, locale, "providerCard.viewDetails", copy.viewDetails)}
          </Button>
        )
      }
      secondaryAction={
        <Group gap="xs">
          <ActionIcon
            variant="default"
            size="lg"
            radius="xl"
            aria-label={getLocalText(copySource, locale, "providerCard.addToPlanner", copy.addToPlanner)}
            onClick={() => {
              add(provider.id);
              toast.success(interpolate(getLocalText(copySource, locale, "providerCard.addedToast", copy.addedToast), { name: provider.name }));
            }}
          >
            <Plus size={16} />
          </ActionIcon>
          <ActionIcon
            variant="default"
            radius="xl"
            size="lg"
            onClick={() => {
              toggle(provider.id);
              toast.success(saved ? getLocalText(copySource, locale, "providerCard.removedToast", copy.removedToast) : getLocalText(copySource, locale, "providerCard.savedToast", copy.savedToast));
            }}
            aria-label={saved ? getLocalText(copySource, locale, "providerCard.removeSaved", copy.removeSaved) : getLocalText(copySource, locale, "providerCard.saveProvider", copy.saveProvider)}
          >
            <Heart
              size={16}
              color={saved ? "var(--mantine-color-orange-5)" : "currentColor"}
              fill={saved ? "currentColor" : "none"}
            />
          </ActionIcon>
          <ActionIcon variant="default" size="lg" radius="xl" aria-label={getLocalText(copySource, locale, "providerCard.shareProvider", copy.shareProvider)} onClick={() => onShare(provider)}>
            <Share2 size={16} />
          </ActionIcon>
        </Group>
      }
    />
  );
}
