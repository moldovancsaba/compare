import { Button, Modal, Stack, Text, Title } from "@mantine/core";
import { Mail, MessageCircle, Link2 } from "@/lib/appIcons";
import type { MeetupGroup } from "@/types/meetup";
import { toast } from "@/lib/notify";
import { formatBoroughLabel } from "@/data/locations";

export function MeetupShareDialog({ group, onClose }: { group: MeetupGroup | null; onClose: () => void }) {
  if (!group) return null;
  const url = `https://${group.website.replace(/^https?:\/\//, "")}`;
  const summary = `${group.name} — ${group.neighborhood}, ${formatBoroughLabel(group.borough)}. ${group.description} Instagram: ${group.instagram} • ${group.website}`;

  return (
    <Modal opened={!!group} onClose={onClose} title={<Title order={3}>Share {group.name}</Title>} size="md">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Send this meet-up group to a friend or co-parent.
        </Text>
          <Button
            variant="default"
            justify="flex-start"
            leftSection={<Mail size={16} />}
            onClick={() =>
              window.open(
                `mailto:?subject=${encodeURIComponent(group.name)}&body=${encodeURIComponent(summary + "\n\n" + url)}`,
              )
            }
          >
            Share via email
          </Button>
          <Button
            variant="default"
            justify="flex-start"
            leftSection={<MessageCircle size={16} />}
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(summary + " " + url)}`, "_blank")}
          >
            Share via WhatsApp
          </Button>
          <Button
            variant="default"
            justify="flex-start"
            leftSection={<Link2 size={16} />}
            onClick={() => {
              navigator.clipboard.writeText(group.website);
              toast.success("Website copied");
            }}
          >
            Copy website
          </Button>
      </Stack>
    </Modal>
  );
}
