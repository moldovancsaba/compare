import type { AppLocale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

type LocaleRecord = Record<AppLocale, string>;

const METADATA = {
  title: {
    en: "RangeScout EU — Discover Sport Shooting Venues Across Europe",
    hu: "RangeScout EU — Fedezd fel a lősport helyszíneket Európában",
    it: "RangeScout EU — Scopri i luoghi per lo shooting sport in Europa",
  },
  description: {
    en: "Curated EU sport shooting training, ranges, competitions, hunting grounds, and clubs by country and region. Save favorites and estimate costs.",
    hu: "Összegyűjtöttünk európai lősport- és vadászati helyszíneket: tréningeket, tartózkodási helyszíneket, versenyeket és klubokat régiónként.",
    it: "Scopri l'élite di allenamenti, poligoni, competizioni, aree venatorie e club europei per regione. Salva i preferiti e stima i costi.",
  },
  openGraphTitle: {
    en: "RangeScout EU — Sport Shooting Directory",
    hu: "RangeScout EU — Lősport címtár",
    it: "RangeScout EU — Directory dello shooting sport",
  },
  openGraphDescription: {
    en: "Curated EU sport shooting training, ranges, competitions, hunting grounds, and clubs by country and region.",
    hu: "Összegyűjtött európai lősport-térképek ország és régió szerint.",
    it: "Selezione curata di allenamenti, poligoni, competizioni, aree venatorie e club per paese e regione.",
  },
} as const satisfies { [K in keyof typeof METADATA | string]: LocaleRecord };

export const siteCopy = {
  shell: {
    brandName: {
      en: "RangeScout EU",
      hu: "RangeScout EU",
      it: "RangeScout EU",
    },
    brandTagline: {
      en: "Curated shooting venues and clubs",
      hu: "Kiválasztott lő- és vadászati helyszínek",
      it: "Strutture e club di tiro selezionati",
    },
    brandSubtitle: {
      en: "Fast country-first browsing for training, ranges, competitions, hunting grounds, and clubs.",
      hu: "Gyors, ország szerint felépülő böngészés tréningekhez, pályákhoz, versenyekhez, vadászati helyekhez és klubokhoz.",
      it: "Navigazione rapida per paese per sessioni, campi da tiro, gare, aree venatorie e club.",
    },
  },
  sidebar: {
    discoverLabel: {
      en: "Discover",
      hu: "Felfedezés",
      it: "Scopri",
    },
    toolsLabel: {
      en: "My tools",
      hu: "Eszközeim",
      it: "Strumenti",
    },
    promoTitle: {
      en: "List your venue",
      hu: "Add fel a helyszínt",
      it: "Registra la tua sede",
    },
    promoBody: {
      en: "Tell us about your range, club, training lane, or hunting venue and we’ll follow up about the right listing path for EU operators.",
      hu: "Írd le a helyszínedet, klubodat vagy a vadászati lehetőségedet, és felvesszük veled a kapcsolatot a megfelelő listázási lépésekhez.",
      it: "Indicaci la tua pista, club o struttura venatoria e ti risponderemo con la corretta procedura di pubblicazione.",
    },
    promoCta: {
      en: "Request listing info",
      hu: "Hirdetési információ kérelme",
      it: "Richiedi informazioni",
    },
    promoCopy: {
      en: "Curated, source-backed sport shooting venues and clubs across the EU.",
      hu: "Ellenőrzött, hitelesített lősport-válogatás Európa-szerte.",
      it: "Sedi e club per lo shooting sport verificati e curati in tutta l'UE.",
    },
  },
  nav: {
    home: {
      en: "Home",
      hu: "Kezdőlap",
      it: "Home",
    },
    classes: {
      en: "Training",
      hu: "Kiképzés",
      it: "Allenamenti",
    },
    camps: {
      en: "Ranges",
      hu: "Pályák",
      it: "Poligoni",
    },
    competitions: {
      en: "Competitions",
      hu: "Versenyek",
      it: "Competizioni",
    },
    hunting: {
      en: "Hunting Grounds",
      hu: "Vadászterületek",
      it: "Aree venatorie",
    },
    thisWeek: {
      en: "This Week",
      hu: "Ezen a héten",
      it: "Questa settimana",
    },
    clubs: {
      en: "Clubs",
      hu: "Klubok",
      it: "Club",
    },
    saved: {
      en: "Saved",
      hu: "Mentett",
      it: "Salvati",
    },
    calculator: {
      en: "Planner",
      hu: "Tervező",
      it: "Planner",
    },
    account: {
      en: "My Account",
      hu: "Fiókom",
      it: "Account",
    },
    neighborhoodGuide: {
      en: "Region Guide",
      hu: "Régiótérkép",
      it: "Guide per zona",
    },
    badges: {
      saved: {
        en: "Saved",
        hu: "Mentett",
        it: "Salvati",
      },
      plan: {
        en: "Plan",
        hu: "Terv",
        it: "Piano",
      },
    },
  },
  common: {
    language: {
      en: "Language",
      hu: "Nyelv",
      it: "Lingua",
    },
    and: {
      en: "and",
      hu: "és",
      it: "e",
    },
    fallbackAll: {
      en: "All",
      hu: "Összes",
      it: "Tutto",
    },
    loading: {
      en: "Loading",
      hu: "Betöltés",
      it: "Caricamento",
    },
  },
  home: {
    explore: {
      en: "Explore",
      hu: "Felfedezés",
      it: "Esplora",
    },
    neighborhoodFallback: {
      en: "All EU",
      hu: "Teljes Európa",
      it: "Tutta l'UE",
    },
  },
  errors: {
    notFoundTitle: {
      en: "Page not found",
      hu: "Az oldal nem található",
      it: "Pagina non trovata",
    },
    notFoundDescription: {
      en: "The page you requested does not exist or may have moved.",
      hu: "A kért oldal nem létezik, vagy áthelyezték.",
      it: "La pagina richiesta non esiste o potrebbe essere stata spostata.",
    },
    backToHome: {
      en: "Return home",
      hu: "Vissza a kezdőlapra",
      it: "Torna alla home",
    },
  },
};

export const uiCopy = {
  ...siteCopy,
};

export function getText<T extends LocaleRecord>(value: T, locale: AppLocale): string {
  return value[locale] ?? value[DEFAULT_LOCALE];
}

export function getMetadata(locale: AppLocale) {
  return {
    title: METADATA.title[locale],
    description: METADATA.description[locale],
    openGraph: {
      title: METADATA.openGraphTitle[locale],
      description: METADATA.openGraphDescription[locale],
    },
  };
}
