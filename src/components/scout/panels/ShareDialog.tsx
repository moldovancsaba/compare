import { Button, Modal, Stack, Text, Title } from "@mantine/core";
import { Mail, MessageCircle, Link2 } from "@/lib/appIcons";
import type { Provider } from "@/types/provider";
import { toast } from "@/lib/notify";

export function ShareDialog({ provider, onClose }: { provider: Provider | null; onClose: () => void }) {
  if (!provider) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://rangescout.vercel.app";
  const url = `${origin}/p/${provider.id}`;
  const summary = `${provider.name} — ${provider.category} in ${provider.neighborhood}, ${provider.borough}. EUR ${provider.pricePerClass}/session. ${provider.shortDescription}`;

  return (
    <Modal opened={!!provider} onClose={onClose} title={<Title order={3}>Share {provider.name}</Title>} size="md">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Send this venue to a colleague, club member, or guest.
        </Text>
          <Button
            variant="default"
            justify="flex-start"
            leftSection={<Mail size={16} />}
            onClick={() => window.open(`mailto:?subject=${encodeURIComponent(provider.name)}&body=${encodeURIComponent(summary + "\n\n" + url)}`)}
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
              navigator.clipboard.writeText(url);
              toast.success("Link copied");
            }}
          >
            Copy link
          </Button>
      </Stack>
    </Modal>
  );
}
