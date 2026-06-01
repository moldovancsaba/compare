import { Button, Modal, Stack, Text, Title } from "@mantine/core";
import { usePathname } from "next/navigation";
import { Mail, MessageCircle, Link2 } from "@/lib/appIcons";
import type { MeetupGroup } from "@/types/meetup";
import { toast } from "@/lib/notify";
import { formatBoroughLabel } from "@/data/locations";
import { useSiteCatalog } from "@/hooks/useCatalog";
import { normalizeLocale } from "@/lib/i18n/config";
import { parseLocaleFromPathname } from "@/lib/i18n/paths";
import { getLocalText } from "@/lib/i18n/messages";

export function MeetupShareDialog({ group, onClose }: { group: MeetupGroup | null; onClose: () => void }) {
  const pathname = usePathname();
  const locale = normalizeLocale(parseLocaleFromPathname(pathname));
  const { data: site } = useSiteCatalog(locale);
  if (!group) return null;
  const url = `https://${group.website.replace(/^https?:\/\//, "")}`;
  const localText = <T extends Record<"en" | "hu" | "it", string>>(path: string, fallback: T) =>
    getLocalText(site, locale, path, fallback);
  const summary = `${group.name} — ${group.neighborhood}, ${formatBoroughLabel(group.borough, locale)}. ${group.description} ${group.website}`;

  return (
    <Modal opened={!!group} onClose={onClose} title={<Title order={3}>{localText("share.title", { en: "Share {name}", hu: "{name} megosztása", it: "Condividi {name}" }).replace("{name}", group.name)}</Title>} size="md">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          {localText("share.clubDescription", {
            en: "Send this club to a colleague, club member, or guest.",
            hu: "Küldd tovább ezt a klubot kollégának, klubtagnak vagy vendégnek.",
            it: "Invia questo club a un collega, membro o ospite.",
          })}
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
            {localText("share.email", { en: "Share via email", hu: "Megosztás e-mailben", it: "Condividi via email" })}
          </Button>
          <Button
            variant="default"
            justify="flex-start"
            leftSection={<MessageCircle size={16} />}
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(summary + " " + url)}`, "_blank")}
          >
            {localText("share.whatsapp", { en: "Share via WhatsApp", hu: "Megosztás WhatsAppon", it: "Condividi via WhatsApp" })}
          </Button>
          <Button
            variant="default"
            justify="flex-start"
            leftSection={<Link2 size={16} />}
            onClick={() => {
              navigator.clipboard.writeText(group.website);
              toast.success(localText("share.websiteCopied", { en: "Website copied", hu: "Weboldal másolva", it: "Sito copiato" }));
            }}
          >
            {localText("share.copyWebsite", { en: "Copy website", hu: "Weboldal másolása", it: "Copia sito" })}
          </Button>
      </Stack>
    </Modal>
  );
}
