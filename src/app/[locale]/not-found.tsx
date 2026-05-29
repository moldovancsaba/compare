import Link from "next/link";
import { Center, Paper } from "@mantine/core";
import { StateBlock } from "@doneisbetter/gds-core/server";
import { getText } from "@/lib/i18n/messages";
import { localizePath } from "@/lib/i18n/paths";
import { normalizeLocale } from "@/lib/i18n/config";

interface NotFoundProps {
  params: { locale: string };
}

export default function NotFound({ params }: NotFoundProps) {
  const locale = normalizeLocale(params.locale);

  return (
    <Center mih="100vh" bg="beige.0" px="md">
      <Paper withBorder p="xl" maw={480} w="100%">
        <StateBlock
          variant="empty"
          title={getText({
            en: "Page not found",
            hu: "Az oldal nem található",
            it: "Pagina non trovata",
          }, locale)}
          description={getText({
            en: "The page you requested does not exist or may have moved.",
            hu: "A kért oldal nem létezik, vagy áthelyezték.",
            it: "La pagina richiesta non esiste o potrebbe essere stata spostata.",
          }, locale)}
          action={
            <Link href={localizePath("/", locale)}>
              {getText({
                en: "Return home",
                hu: "Vissza a kezdőlapra",
                it: "Torna alla home",
              }, locale)}
            </Link>
          }
        />
      </Paper>
    </Center>
  );
}
