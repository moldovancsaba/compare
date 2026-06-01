import { Button, Modal, Stack, Text, Title } from "@mantine/core";
import { usePathname } from "next/navigation";
import { Mail, MessageCircle, Link2 } from "@/lib/appIcons";
import type { Provider } from "@/types/provider";
import { toast } from "@/lib/notify";
import { formatBoroughLabel } from "@/data/locations";
import { useSiteCatalog } from "@/hooks/useCatalog";
import { normalizeLocale } from "@/lib/i18n/config";
import { parseLocaleFromPathname } from "@/lib/i18n/paths";
import { getLocalCategoryLabel, getLocalText } from "@/lib/i18n/messages";
import { getLocalizedProviderCopy } from "@/lib/providerLocalization";

export function ShareDialog({ provider, onClose }: { provider: Provider | null; onClose: () => void }) {
  const pathname = usePathname();
  const locale = normalizeLocale(parseLocaleFromPathname(pathname));
  const { data: site } = useSiteCatalog(locale);
  if (!provider) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://compare.messmass.com";
  const url = `${origin}/p/${provider.id}`;
  const localText = <T extends Record<"en" | "hu" | "it", string>>(path: string, fallback: T) =>
    getLocalText(site, locale, path, fallback);
  const price = provider.pricePerClass > 0
    ? `EUR ${provider.pricePerClass}`
    : localText("providerCard.priceOnRequest", { en: "Price on request", hu: "Ár egyeztetés alapján", it: "Prezzo su richiesta" });
  const providerCopy = getLocalizedProviderCopy(provider, locale);
  const summary = `${provider.name} — ${getLocalCategoryLabel(site, provider.category, locale)} / ${provider.neighborhood}, ${formatBoroughLabel(provider.borough, locale)}. ${price}. ${providerCopy.shortDescription}`;

  return (
    <Modal opened={!!provider} onClose={onClose} title={<Title order={3}>{localText("share.title", { en: "Share {name}", hu: "{name} megosztása", it: "Condividi {name}" }).replace("{name}", provider.name)}</Title>} size="md">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          {localText("share.providerDescription", {
            en: "Send this venue to a colleague, club member, or guest.",
            hu: "Küldd tovább ezt a helyszínt kollégának, klubtagnak vagy vendégnek.",
            it: "Invia questa sede a un collega, membro del club o ospite.",
          })}
        </Text>
          <Button
            variant="default"
            justify="flex-start"
            leftSection={<Mail size={16} />}
            onClick={() => window.open(`mailto:?subject=${encodeURIComponent(provider.name)}&body=${encodeURIComponent(summary + "\n\n" + url)}`)}
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
              navigator.clipboard.writeText(url);
              toast.success(localText("share.linkCopied", { en: "Link copied", hu: "Link másolva", it: "Link copiato" }));
            }}
          >
            {localText("share.copyLink", { en: "Copy link", hu: "Link másolása", it: "Copia link" })}
          </Button>
      </Stack>
    </Modal>
  );
}
