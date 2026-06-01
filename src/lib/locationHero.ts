import type { Borough, BoroughChoice, Category } from "@/types/provider";
import { formatBoroughLabel } from "@/data/locations";
import type { SiteDoc, SiteLocationHeroImage, SiteLocationImageView } from "@/types/site";
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/config";
import { getCategoryLabel } from "@/lib/i18n/messages";

type HeroKind = Category | "Meet-Up Groups";

type HeroCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

type BoroughTheme = {
  landmark: string;
  boroughLine: string;
};

const BOROUGH_THEMES: Record<Borough, Record<AppLocale, BoroughTheme>> = {
  Hungary: {
    en: {
      landmark: "Budapest and Hungarian regions",
      boroughLine: "Competition, range, club, training, and hunting coverage from operator-focused, city-by-city discovery.",
    },
    hu: {
      landmark: "Budapest és magyar régiók",
      boroughLine: "Forrással igazolt verseny-, lőtér-, klub-, képzési és vadászati lefedettség gyakorlati üzemeltetői kontextussal.",
    },
    it: {
      landmark: "Budapest e regioni ungheresi",
      boroughLine: "Copertura supportata da fonti per gare, poligoni, club, allenamenti e caccia con contesto operativo pratico.",
    },
  },
  Germany: {
    en: { landmark: "Forest ranges + clubhouses", boroughLine: "Dense club infrastructure, strong safety culture, and a deep mix of indoor and outdoor shooting venues." },
    hu: { landmark: "Erdei lőterek és klubházak", boroughLine: "Sűrű klubhálózat, erős biztonsági kultúra, beltéri és kültéri lőterek széles választéka." },
    it: { landmark: "Poligoni forestali e club house", boroughLine: "Infrastruttura di club densa, forte cultura della sicurezza e mix di sedi indoor e outdoor." },
  },
  France: {
    en: { landmark: "Regional federations + sporting estates", boroughLine: "Strong club networks, practical training lanes, and hunting-focused regional operators." },
    hu: { landmark: "Regionális szövetségek és sportbirtokok", boroughLine: "Erős klubhálózatok, gyakorlati képzési lehetőségek és vadászatra fókuszáló regionális üzemeltetők." },
    it: { landmark: "Federazioni regionali e tenute sportive", boroughLine: "Reti di club solide, corsie di allenamento pratiche e operatori regionali orientati alla caccia." },
  },
  Spain: {
    en: { landmark: "Open ranges + dry terrain", boroughLine: "Competition calendars, clay venues, and destination ranges with strong weekend traffic." },
    hu: { landmark: "Nyílt lőterek és száraz terep", boroughLine: "Versenynaptárak, koronglövő helyszínek és hétvégi forgalmú célállomás-lőterek." },
    it: { landmark: "Poligoni aperti e terreno asciutto", boroughLine: "Calendari gara, sedi per piattello e poligoni di destinazione con forte traffico nel weekend." },
  },
  Italy: {
    en: { landmark: "Alpine valleys + historic clubs", boroughLine: "Mixed discipline clubs, scenic hunting territories, and strong regional communities." },
    hu: { landmark: "Alpesi völgyek és történelmi klubok", boroughLine: "Vegyes diszciplínájú klubok, látványos vadászterületek és erős regionális közösségek." },
    it: { landmark: "Valli alpine e club storici", boroughLine: "Club multidisciplinari, territori venatori scenici e comunità regionali forti." },
  },
  Poland: {
    en: { landmark: "Training grounds + membership clubs", boroughLine: "Fast-growing sport shooting infrastructure with accessible training and practical licensing lanes." },
    hu: { landmark: "Képzőterületek és tagsági klubok", boroughLine: "Gyorsan fejlődő lősport-infrastruktúra elérhető képzéssel és gyakorlati engedélyezési útvonalakkal." },
    it: { landmark: "Campi di allenamento e club associativi", boroughLine: "Infrastruttura di tiro sportivo in crescita con allenamenti accessibili e percorsi di licenza pratici." },
  },
};

const CATEGORY_LINES: Record<HeroKind, Record<AppLocale, { eyebrow: string; cityTitle: string; cityDescription: string }>> = {
  Classes: {
    en: {
      eyebrow: "Training directory",
      cityTitle: "Find shooting training across Europe",
      cityDescription: "Compare pistol, rifle, shotgun, and safety courses with filters anchored to country and region.",
    },
    hu: {
      eyebrow: "Képzési katalógus",
      cityTitle: "Találj lősportképzéseket Európában",
      cityDescription: "Hasonlíts össze pisztoly-, puska-, sörétes és biztonsági képzéseket ország- és régióalapú szűrőkkel.",
    },
    it: {
      eyebrow: "Directory allenamenti",
      cityTitle: "Trova allenamenti di tiro in Europa",
      cityDescription: "Confronta corsi di pistola, carabina, fucile e sicurezza con filtri per paese e regione.",
    },
  },
  Camps: {
    en: {
      eyebrow: "Range directory",
      cityTitle: "Compare shooting ranges across Europe",
      cityDescription: "See indoor, outdoor, clay, and long-range facilities by country first, then narrow to the region you can actually reach.",
    },
    hu: {
      eyebrow: "Lőtérkatalógus",
      cityTitle: "Hasonlíts össze európai lőtereket",
      cityDescription: "Nézd át a beltéri, kültéri, korong- és távlövő helyszíneket ország szerint, majd szűkíts a valóban elérhető régióra.",
    },
    it: {
      eyebrow: "Directory poligoni",
      cityTitle: "Confronta poligoni in Europa",
      cityDescription: "Vedi strutture indoor, outdoor, piattello e lunga distanza prima per paese, poi per regione raggiungibile.",
    },
  },
  "Competitions": {
    en: {
      eyebrow: "Competition calendar",
      cityTitle: "Track competitions across Europe",
      cityDescription: "Compare hosted matches, open qualifiers, and club events without bouncing between federation calendars and club pages.",
    },
    hu: {
      eyebrow: "Versenynaptár",
      cityTitle: "Kövess európai lősportversenyeket",
      cityDescription: "Hasonlíts össze versenyeket, nyílt kvalifikációkat és klubeseményeket anélkül, hogy szövetségi naptárak és kluboldalak között ugrálnál.",
    },
    it: {
      eyebrow: "Calendario gare",
      cityTitle: "Segui competizioni di tiro in Europa",
      cityDescription: "Confronta match, qualificazioni aperte ed eventi dei club senza saltare tra calendari federali e pagine dei club.",
    },
  },
  "Drop-In Activities": {
    en: {
      eyebrow: "Hunting access",
      cityTitle: "Find hunting grounds across Europe",
      cityDescription: "Review managed hunting territories, field practice operators, and seasonal access options in one browse flow.",
    },
    hu: {
      eyebrow: "Vadászati hozzáférés",
      cityTitle: "Találj vadászterületeket Európában",
      cityDescription: "Nézd át a kezelt vadászterületeket, terepgyakorlati szolgáltatókat és szezonális hozzáféréseket egy böngészési folyamatban.",
    },
    it: {
      eyebrow: "Accesso venatorio",
      cityTitle: "Trova aree venatorie in Europa",
      cityDescription: "Rivedi territori gestiti, operatori di pratica sul campo e opzioni stagionali in un unico flusso.",
    },
  },
  "Meet-Up Groups": {
    en: {
      eyebrow: "Club network",
      cityTitle: "Find shooting clubs across Europe",
      cityDescription: "Browse sport shooting clubs, hunting associations, and regional member communities with location filters that match real travel patterns.",
    },
    hu: {
      eyebrow: "Klubhálózat",
      cityTitle: "Találj lősportklubokat Európában",
      cityDescription: "Böngéssz sportlövő klubokat, vadászegyesületeket és regionális közösségeket valós utazási mintákhoz igazodó helyszínszűrőkkel.",
    },
    it: {
      eyebrow: "Rete club",
      cityTitle: "Trova club di tiro in Europa",
      cityDescription: "Sfoglia club di tiro sportivo, associazioni venatorie e comunità regionali con filtri coerenti con spostamenti reali.",
    },
  },
};

const NEIGHBORHOOD_LINES: Record<string, string> = {
  Bavaria: "Established clubs, alpine hunting culture, and strong sporting infrastructure.",
  "North Rhine-Westphalia": "Dense population, many member clubs, and practical indoor training options.",
  Saxony: "Regional club culture with cost-effective training access and competition depth.",
  Brandenburg: "Open land, outdoor venues, and strong hunting relevance.",
  Tuscany: "Destination sporting estates, field shooting, and mixed-discipline clubs.",
  Lombardy: "Large club concentration, match density, and broad training supply.",
  Andalusia: "Dry-weather range access, clay venues, and destination hunting operators.",
  Catalonia: "Strong competition culture with regional club clusters.",
  Masovian: "Capital-area training access backed by growing club infrastructure.",
};

function getLocalizedCategoryLine(kind: HeroKind, locale: AppLocale) {
  return CATEGORY_LINES[kind][locale] ?? CATEGORY_LINES[kind][DEFAULT_LOCALE];
}

function getLocalizedBoroughTheme(borough: Borough, locale: AppLocale) {
  return BOROUGH_THEMES[borough][locale] ?? BOROUGH_THEMES[borough][DEFAULT_LOCALE];
}

function getDisplayLabel(kind: HeroKind, locale: AppLocale) {
  if (kind === "Meet-Up Groups") {
    return locale === "hu" ? "Klubok" : locale === "it" ? "Club" : "Clubs";
  }
  return getCategoryLabel(kind, locale);
}

function locationLine(borough: Borough, neighborhood: string | null, locale: AppLocale): string {
  if (neighborhood && NEIGHBORHOOD_LINES[neighborhood]) return NEIGHBORHOOD_LINES[neighborhood];
  return getLocalizedBoroughTheme(borough, locale).boroughLine;
}

function headline(kind: HeroKind, borough: BoroughChoice, neighborhood: string | null, locale: AppLocale): string {
  const label = getDisplayLabel(kind, locale);
  if (borough === "All") return getLocalizedCategoryLine(kind, locale).cityTitle;
  if (neighborhood) return locale === "hu" ? `${label} itt: ${neighborhood}` : locale === "it" ? `${label} a ${neighborhood}` : `${label} in ${neighborhood}`;
  const country = formatBoroughLabel(borough, locale);
  return locale === "hu" ? `${label} itt: ${country}` : locale === "it" ? `${label} in ${country}` : `${label} in ${country}`;
}

function description(kind: HeroKind, borough: BoroughChoice, neighborhood: string | null, locale: AppLocale): string {
  if (borough === "All") return getLocalizedCategoryLine(kind, locale).cityDescription;
  const boroughTheme = getLocalizedBoroughTheme(borough, locale);
  const locLine = locationLine(borough, neighborhood, locale);
  if (kind === "Meet-Up Groups") {
    if (locale === "hu") {
      return neighborhood
        ? `${locLine} Böngéssz közeli klubokat és egyesületeket a régiós kontextus megtartásával.`
        : `${boroughTheme.boroughLine} Hasonlíts össze tagsági közösségeket ${formatBoroughLabel(borough, locale)} régióiban.`;
    }
    if (locale === "it") {
      return neighborhood
        ? `${locLine} Sfoglia club e associazioni vicine senza perdere il contesto regionale.`
        : `${boroughTheme.boroughLine} Confronta comunità associative nelle regioni di ${formatBoroughLabel(borough, locale)}.`;
    }
    return neighborhood
      ? `${locLine} Browse nearby clubs and associations without leaving the regional context behind.`
      : `${boroughTheme.boroughLine} Compare member communities across nearby regions inside ${formatBoroughLabel(borough, locale)}.`;
  }
  if (locale === "hu") {
    return neighborhood
      ? `${locLine} Hasonlítsd össze a célközönséget, időpontokat és diszciplínákat a helyi kontextus megtartásával.`
      : `${boroughTheme.boroughLine} Indulj ${formatBoroughLabel(borough, locale)} szintjén, majd szűkíts a neked megfelelő régióra.`;
  }
  if (locale === "it") {
    return neighborhood
      ? `${locLine} Confronta pubblico, orari e discipline senza perdere il contesto locale.`
      : `${boroughTheme.boroughLine} Parti da ${formatBoroughLabel(borough, locale)}, poi restringi alla regione adatta alla tua routine.`;
  }
  return neighborhood
    ? `${locLine} Compare audience fit, schedules, and discipline mix without losing the local context.`
    : `${boroughTheme.boroughLine} Start with ${formatBoroughLabel(borough, locale)}, then narrow to the region that matches your routine.`;
}

function eyebrow(kind: HeroKind, borough: BoroughChoice, neighborhood: string | null, locale: AppLocale): string {
  const categoryLine = getLocalizedCategoryLine(kind, locale);
  if (neighborhood) return `${neighborhood} • ${formatBoroughLabel(borough, locale)}`;
  if (borough !== "All") return `${formatBoroughLabel(borough, locale)} • ${categoryLine.eyebrow}`;
  return categoryLine.eyebrow;
}

export function getLocationHero(kind: HeroKind, borough: BoroughChoice, neighborhood: string | null, locale: AppLocale = DEFAULT_LOCALE): HeroCopy {
  return {
    eyebrow: eyebrow(kind, borough, neighborhood, locale),
    title: headline(kind, borough, neighborhood, locale),
    description: description(kind, borough, neighborhood, locale),
  };
}

function normalizeNeighborhood(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function matchesLocationHeroImage(
  image: SiteLocationHeroImage,
  view: SiteLocationImageView,
  borough: BoroughChoice,
  neighborhood: string | null,
): boolean {
  return (
    image.view === view &&
    image.borough === borough &&
    normalizeNeighborhood(image.neighborhood) === normalizeNeighborhood(neighborhood)
  );
}

export function getLocationHeroImage(
  site: Pick<SiteDoc, "locationHeroImages"> | null | undefined,
  view: SiteLocationImageView,
  borough: BoroughChoice,
  neighborhood: string | null,
): { imageUrl: string; alt: string } | null {
  const images = site?.locationHeroImages;
  if (!Array.isArray(images) || images.length === 0) return null;
  const match = images.find((image) => matchesLocationHeroImage(image, view, borough, neighborhood));
  if (!match) return null;
  const imageUrl = match.imageUrl.trim();
  if (!imageUrl) return null;
  const alt = match.alt?.trim() || (neighborhood ? `${view} in ${neighborhood}` : `${view} in ${borough}`);
  return { imageUrl, alt };
}
