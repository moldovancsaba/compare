import { ActionIcon, Button, Group } from "@mantine/core";
import { PublicProductCard } from "@doneisbetter/gds-core/client";
import { Heart, Share2, Plus, Star, Calendar } from "@/lib/appIcons";
import type { Provider } from "@/types/provider";
import { CdnImage } from "@/components/media/CdnImage";
import { useSaved, useCalculator } from "@/store/useScout";
import { toast } from "@/lib/notify";
import { CMS_MEDIA } from "@/config/defaultMedia";
import { formatBoroughLabel } from "@/data/locations";

interface Props {
  provider: Provider;
  onOpen: (p: Provider) => void;
  onShare: (p: Provider) => void;
  highlightUpcoming?: boolean;
  subtitle?: string;
}

export function ProviderCard({ provider, onOpen, onShare, highlightUpcoming = false, subtitle }: Props) {
  const { isSaved, toggle } = useSaved();
  const { add } = useCalculator();
  const saved = isSaved(provider.id);
  const upcomingLabel = subtitle ?? undefined;

  return (
    <PublicProductCard
      image={
        <CdnImage
          resolveBase={provider.website}
          src={provider.image?.trim() ? provider.image : CMS_MEDIA.fallbackListing}
          alt={provider.name}
          style={{ display: "block", height: 176, width: "100%", objectFit: "cover" }}
        />
      }
      title={provider.name}
      description={provider.shortDescription}
      price={`EUR ${provider.pricePerClass}/session`}
      helperText={
        highlightUpcoming && upcomingLabel ? `Next: ${upcomingLabel}` : `${provider.neighborhood}, ${formatBoroughLabel(provider.borough)}`
      }
      helperKind="supporting"
      inventoryNote={provider.announcementBadge ?? undefined}
      metadata={[
        ...(highlightUpcoming && upcomingLabel
          ? [{
              label: "Upcoming",
              value: upcomingLabel,
            }]
          : []),
        {
          label: "Disciplines",
          value: provider.activityTypes.slice(0, 3).join(" · "),
        },
        {
          label: "Audience",
          value: provider.ageRanges.slice(0, 2).join(", "),
        },
        {
          label: "Tags",
          value: provider.dayTimeTags.slice(0, 2).join(" · "),
        },
        {
          label: "Rating",
          value: (
            <Group gap={4} justify="flex-end" wrap="nowrap">
              <Star size={16} fill="var(--mantine-color-orange-5)" color="var(--mantine-color-orange-5)" />
              <span>{provider.rating}</span>
              <span style={{ color: "var(--mantine-color-dimmed)" }}>({provider.reviewCount})</span>
            </Group>
          ),
        },
      ]}
      primaryAction={
        provider.bookingEnabled ? (
          <Button onClick={() => onOpen(provider)} leftSection={<Calendar size={16} />}>
            Book now
          </Button>
        ) : (
          <Button onClick={() => onOpen(provider)} color="dark">
            View details
          </Button>
        )
      }
      secondaryAction={
        <Group gap="xs">
          <ActionIcon
            variant="default"
            size="lg"
            radius="xl"
            aria-label="Add to planner"
            onClick={() => {
              add(provider.id);
              toast.success(`${provider.name} added to planner`);
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
              toast.success(saved ? "Removed from saved" : "Saved");
            }}
            aria-label={saved ? "Remove from saved" : "Save provider"}
          >
            <Heart
              size={16}
              color={saved ? "var(--mantine-color-orange-5)" : "currentColor"}
              fill={saved ? "currentColor" : "none"}
            />
          </ActionIcon>
          <ActionIcon variant="default" size="lg" radius="xl" aria-label="Share provider" onClick={() => onShare(provider)}>
            <Share2 size={16} />
          </ActionIcon>
        </Group>
      }
    />
  );
}
