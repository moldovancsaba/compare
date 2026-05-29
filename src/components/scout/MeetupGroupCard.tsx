import { ActionIcon, Button, Group } from "@mantine/core";
import { PublicProductCard } from "@doneisbetter/gds-core/client";
import { Heart, Share2, Instagram } from "@/lib/appIcons";
import { useSaved } from "@/store/useScout";
import { toast } from "@/lib/notify";
import type { MeetupGroup } from "@/types/meetup";
import { CdnImage } from "@/components/media/CdnImage";
import { CMS_MEDIA } from "@/config/defaultMedia";
import { formatBoroughLabel } from "@/data/locations";

interface Props {
  group: MeetupGroup;
  onOpen: (g: MeetupGroup) => void;
  onShare: (g: MeetupGroup) => void;
}

export function MeetupGroupCard({ group, onOpen, onShare }: Props) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(group.id);
  const instagramHandle = normalizeInstagramHandle(group.instagram);
  const instagramHref = `https://instagram.com/${instagramHandle}`;
  const instagramLabel = `@${instagramHandle}`;

  return (
    <PublicProductCard
      image={
        <CdnImage
          resolveBase={group.coverImageUrl?.trim() ? group.website : undefined}
          src={group.coverImageUrl?.trim() ? group.coverImageUrl : CMS_MEDIA.fallbackMeetup}
          alt={group.name}
          style={{ display: "block", height: 144, width: "100%", objectFit: "cover" }}
        />
      }
      title={group.name}
      description={group.description}
      helperText={`${group.neighborhood}, ${formatBoroughLabel(group.borough)}`}
      helperKind="supporting"
      metadata={[
        { label: "Type", value: group.groupType },
        { label: "Audience", value: group.ageRange },
        { label: "Cadence", value: group.cadence },
        { label: "Channel", value: instagramLabel },
      ]}
      primaryAction={
        <Button onClick={() => onOpen(group)} color="dark">
          View details
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
              toast.success(saved ? "Removed from saved" : "Saved");
            }}
            aria-label={saved ? "Remove from saved" : "Save group"}
          >
            <Heart
              size={16}
              color={saved ? "var(--mantine-color-orange-5)" : "currentColor"}
              fill={saved ? "currentColor" : "none"}
            />
          </ActionIcon>
          <ActionIcon variant="default" size="lg" radius="xl" aria-label="Share group" onClick={() => onShare(group)}>
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
