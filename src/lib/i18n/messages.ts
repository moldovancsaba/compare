import type { AppLocale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE, locales } from "@/lib/i18n/config";
import type { Category } from "@/types/provider";
import type { SiteDoc } from "@/types/site";

type LocaleRecord = Record<AppLocale, string>;
type PublicCopyDictionary = Partial<Record<AppLocale, Record<string, string>>>;
type PublicCopyFields = {
  publicCopy?: PublicCopyDictionary;
  publicLocales?: AppLocale[];
  publicDefaultLocale?: AppLocale;
};

const METADATA = {
  title: {
    en: "RANGESCOUT EU — Discover Shooting and Hunting Venues Across Europe",
    hu: "RangeScout EU — Fedezd fel a lősport helyszíneket Európában",
    it: "RANGESCOUT EU — Scopri le migliori location per tiro sportivo e caccia in Europa",
  },
  description: {
    en: "Find curated sport shooting venues, competitions, ranges, hunting grounds, and clubs across Europe with country-first browsing for EU operators and members.",
    hu: "Összegyűjtöttünk európai lősport- és vadászati helyszíneket: tréningeket, tartózkodási helyszíneket, versenyeket és klubokat régiónként.",
    it: "Scopri palestre e campi per lo shooting sport, club e accessi venatori in tutta Europa con filtro per paese e regione.",
  },
  openGraphTitle: {
    en: "RANGESCOUT EU — Shooting & Hunting Directory",
    hu: "RangeScout EU — Lősport címtár",
    it: "RANGESCOUT EU — Directory sportivo venatorio",
  },
  openGraphDescription: {
    en: "A curated EU catalog of shooting training, ranges, competitions, hunting areas, and clubs arranged country-first.",
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
      en: "Your EU catalog for shooting and hunting venues.",
      hu: "Kiválasztott lő- és vadászati helyszínek",
      it: "Il tuo catalogo UE per luoghi di tiro e caccia",
    },
    brandSubtitle: {
      en: "Rangescout EU — Fast, country-first browsing for training, ranges, competitions, hunting access, and clubs.",
      hu: "RANGESCOUT EU\nGyors, ország szerint felépülő böngészés tréningekhez, pályákhoz, versenyekhez, vadászati helyekhez és klubokhoz.",
      it: "Rangescout EU — Navigazione rapida per paese per allenamenti, poligoni, gare, accessi venatori e club.",
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
      en: "Curated shooting and hunting venues and clubs across the EU.",
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
      en: "Hunting & Outdoor",
      hu: "Vadászat és outdoor",
      it: "Caccia e outdoor",
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
  discover: {
    browseEyebrow: {
      en: "Browse listings",
      hu: "Listák böngészése",
      it: "Sfoglia gli annunci",
    },
    locationLabel: {
      en: "Location",
      hu: "Helyszín",
      it: "Località",
    },
    categoryLabels: {
      Classes: {
        en: "Training",
        hu: "Képzések",
        it: "Allenamenti",
      },
      Camps: {
        en: "Ranges",
        hu: "Lőterek",
        it: "Poligoni",
      },
      "Competitions": {
        en: "Competitions",
        hu: "Versenyek",
        it: "Competizioni",
      },
      "Drop-In Activities": {
        en: "Hunting & Outdoor",
        hu: "Vadászat és outdoor",
        it: "Caccia e outdoor",
      },
    },
    thisWeekEyebrow: {
      en: "This Week",
      hu: "Ezen a héten",
      it: "Questa settimana",
    },
    thisWeekAllTitle: {
      en: "Sessions in the next 7 days across the EU catalog",
      hu: "Programok a következő 7 napban az EU-katalógusban",
      it: "Sessioni nei prossimi 7 giorni nel catalogo UE",
    },
    thisWeekCountryTitle: {
      en: "Sessions in the next 7 days in {country}",
      hu: "Programok a következő 7 napban itt: {country}",
      it: "Sessioni nei prossimi 7 giorni in {country}",
    },
    thisWeekRegionTitle: {
      en: "Sessions coming up in {region}",
      hu: "Közelgő programok itt: {region}",
      it: "Sessioni in arrivo a {region}",
    },
    thisWeekDescription: {
      en: "Browse upcoming training sessions, range events, competitions, and hunting access windows happening within the next seven days.",
      hu: "Forrással igazolt közelgő képzések, lőtéri események, versenyek és vadászati lehetőségek a következő hét napból.",
      it: "Sfoglia allenamenti, eventi di poligono, gare e finestre di accesso venatorio supportati da fonti nei prossimi sette giorni.",
    },
    browseDescription: {
      en: "",
      hu: "",
      it: "",
    },
    thisWeekBrowseDescription: {
      en: "Results only include providers with upcoming dates in the next seven days.",
      hu: "A találatok csak olyan szolgáltatókat tartalmaznak, amelyeknél a következő hét napban szerepel dátum.",
      it: "I risultati includono solo operatori con date nei prossimi sette giorni.",
    },
    resultLabel: {
      en: "results",
      hu: "találat",
      it: "risultati",
    },
    countryLabel: {
      en: "Country",
      hu: "Ország",
      it: "Paese",
    },
    regionLabel: {
      en: "Region",
      hu: "Régió",
      it: "Regione",
    },
    searchLabel: {
      en: "Search listings",
      hu: "Keresés a listákban",
      it: "Cerca annunci",
    },
    searchPlaceholder: {
      en: "Try rifle, clay, Budapest, beginner...",
      hu: "Például puska, koronglövészet, Budapest, kezdő...",
      it: "Prova carabina, tiro al piattello, Budapest, principianti...",
    },
    thisWeekSearchPlaceholder: {
      en: "Try IPSC, clay, hunter safety, Saturday...",
      hu: "Például IPSC, koronglövészet, vadászvizsga, szombat...",
      it: "Prova IPSC, piattello, sicurezza venatoria, sabato...",
    },
    sortLabel: {
      en: "Sort",
      hu: "Rendezés",
      it: "Ordina",
    },
    sortBestMatch: {
      en: "Best match",
      hu: "Legjobb egyezés",
      it: "Migliore corrispondenza",
    },
    sortNewest: {
      en: "Newest first",
      hu: "Legújabb elöl",
      it: "Più recenti prima",
    },
    sortOldest: {
      en: "Oldest first",
      hu: "Legrégebbi elöl",
      it: "Meno recenti prima",
    },
    sortSoonest: {
      en: "Soonest upcoming",
      hu: "Legközelebbi időpont",
      it: "Più imminenti",
    },
    sortedBestMatch: {
      en: "Sorted by best match",
      hu: "Rendezés: legjobb egyezés szerint",
      it: "Ordinati per migliore corrispondenza",
    },
    sortedOldest: {
      en: "Sorted oldest to newest",
      hu: "Rendezés: legrégebbitől a legújabbig",
      it: "Ordinati dal meno recente al più recente",
    },
    sortedNewest: {
      en: "Sorted newest to oldest",
      hu: "Rendezés: legújabbtól a legrégebbiig",
      it: "Ordinati dal più recente al meno recente",
    },
    sortedUpcoming: {
      en: "Real upcoming dates only",
      hu: "Csak valódi közelgő dátumok",
      it: "Solo date future reali",
    },
    activeScope: {
      en: "Active scope and filters",
      hu: "Aktív kör és szűrők",
      it: "Ambito e filtri attivi",
    },
    currentScope: {
      en: "Current browse scope",
      hu: "Aktuális böngészési kör",
      it: "Ambito di navigazione attuale",
    },
    clearBrowseState: {
      en: "Clear browse state",
      hu: "Böngészési állapot törlése",
      it: "Cancella lo stato di ricerca",
    },
    allEu: {
      en: "All EU",
      hu: "Teljes EU",
      it: "Tutta l'UE",
    },
    nextSevenDays: {
      en: "Next 7 days only",
      hu: "Csak a következő 7 nap",
      it: "Solo i prossimi 7 giorni",
    },
    featuredProviders: {
      en: "Featured providers",
      hu: "Kiemelt szolgáltatók",
      it: "Operatori in evidenza",
    },
    oneListing: {
      en: "1 listing",
      hu: "1 találat",
      it: "1 annuncio",
    },
    listingCount: {
      en: "{count} listings",
      hu: "{count} találat",
      it: "{count} annunci",
    },
    loadingListings: {
      en: "Loading listings...",
      hu: "Listák betöltése...",
      it: "Caricamento annunci...",
    },
    loadErrorTitle: {
      en: "Can't load listings",
      hu: "A listák nem tölthetők be",
      it: "Impossibile caricare gli annunci",
    },
    loadErrorMessage: {
      en: "Listings did not load right now. Refresh the page or try again in a moment. If the problem keeps happening, the venue catalog connection needs attention.",
      hu: "A listák most nem töltődtek be. Frissítsd az oldalt, vagy próbáld újra később. Ha a hiba marad, a katalóguskapcsolatot kell ellenőrizni.",
      it: "Gli annunci non sono stati caricati. Aggiorna la pagina o riprova tra poco. Se il problema continua, serve controllare la connessione al catalogo.",
    },
    refreshPage: {
      en: "Refresh page",
      hu: "Oldal frissítése",
      it: "Aggiorna pagina",
    },
    emptyDatabaseTitle: {
      en: "No verified listings are published yet",
      hu: "Még nincs publikált, ellenőrzött találat",
      it: "Non ci sono ancora annunci verificati pubblicati",
    },
    emptyDatabaseMessage: {
      en: "No listings are available yet for this area. Please check back soon.",
      hu: "Még nincsenek elérhető listák ezen a területen. Nézz vissza hamarosan.",
      it: "Non ci sono ancora annunci disponibili per questa area. Torna presto.",
    },
    noUpcomingTitle: {
      en: "No upcoming sessions in this window",
      hu: "Nincs közelgő program ebben az időablakban",
      it: "Nessuna sessione in arrivo in questa finestra",
    },
    noMatchTitle: {
      en: "No venues match this search",
      hu: "Nincs találat erre a keresésre",
      it: "Nessuna sede corrisponde a questa ricerca",
    },
    noUpcomingMessage: {
      en: "No sessions are scheduled in the next seven days for this location and filter set. Try another country, loosen a filter, or switch back to all listings.",
      hu: "Ehhez a helyhez és szűréshez nincs program a következő hét napban. Próbálj másik régiót, lazíts a szűrőkön, vagy térj vissza az összes listához.",
      it: "Non ci sono sessioni nei prossimi sette giorni per questa località e questi filtri. Prova un'altra area, allarga i filtri o torna a tutti gli annunci.",
    },
    noQueryMatchMessage: {
      en: "No venues matched \"{query}\". Try a broader keyword, another region, or clear one of the active filters.",
      hu: "Nincs találat erre: \"{query}\". Próbálj tágabb kulcsszót, másik régiót, vagy töröld az egyik aktív szűrőt.",
      it: "Nessuna sede corrisponde a \"{query}\". Prova una parola più ampia, un'altra regione o rimuovi uno dei filtri attivi.",
    },
    noFilterMatchMessage: {
      en: "No verified venues are showing for this combination yet. Try another nearby region or broaden your filters.",
      hu: "Ehhez a kombinációhoz még nincs ellenőrzött találat. Próbálj másik közeli régiót, vagy tágítsd a szűrőket.",
      it: "Non ci sono ancora sedi verificate per questa combinazione. Prova un'altra regione vicina o allarga i filtri.",
    },
    clearSearchFilters: {
      en: "Clear search and filters",
      hu: "Keresés és szűrők törlése",
      it: "Cancella ricerca e filtri",
    },
    browseAllEu: {
      en: "Browse all EU",
      hu: "Teljes EU böngészése",
      it: "Sfoglia tutta l'UE",
    },
    searchBadgePrefix: {
      en: "Search",
      hu: "Keresés",
      it: "Ricerca",
    },
  },
  filters: {
    button: {
      en: "Filters",
      hu: "Szűrők",
      it: "Filtri",
    },
    clearAll: {
      en: "Clear all",
      hu: "Összes törlése",
      it: "Cancella tutto",
    },
    audience: {
      en: "Audience",
      hu: "Célközönség",
      it: "Pubblico",
    },
    availability: {
      en: "Availability",
      hu: "Elérhetőség",
      it: "Disponibilità",
    },
    activity: {
      en: "Activity",
      hu: "Tevékenység",
      it: "Attività",
    },
    any: {
      en: "Any",
      hu: "Bármelyik",
      it: "Qualsiasi",
    },
  },
  providerCard: {
    priceUnitSession: {
      en: "session",
      hu: "alkalom",
      it: "sessione",
    },
    nextPrefix: {
      en: "Next",
      hu: "Következő",
      it: "Prossimo",
    },
    upcoming: {
      en: "Upcoming",
      hu: "Közelgő",
      it: "In arrivo",
    },
    disciplines: {
      en: "Disciplines",
      hu: "Diszciplínák",
      it: "Discipline",
    },
    audience: {
      en: "Audience",
      hu: "Célközönség",
      it: "Pubblico",
    },
    tags: {
      en: "Tags",
      hu: "Címkék",
      it: "Tag",
    },
    rating: {
      en: "Rating",
      hu: "Értékelés",
      it: "Valutazione",
    },
    bookNow: {
      en: "Book now",
      hu: "Foglalás",
      it: "Prenota",
    },
    viewDetails: {
      en: "View details",
      hu: "Részletek",
      it: "Vedi dettagli",
    },
    addToPlanner: {
      en: "Add to planner",
      hu: "Hozzáadás a tervezőhöz",
      it: "Aggiungi al planner",
    },
    saveProvider: {
      en: "Save provider",
      hu: "Szolgáltató mentése",
      it: "Salva operatore",
    },
    removeSaved: {
      en: "Remove from saved",
      hu: "Eltávolítás a mentettekből",
      it: "Rimuovi dai salvati",
    },
    shareProvider: {
      en: "Share provider",
      hu: "Szolgáltató megosztása",
      it: "Condividi operatore",
    },
    savedToast: {
      en: "Saved",
      hu: "Mentve",
      it: "Salvato",
    },
    removedToast: {
      en: "Removed from saved",
      hu: "Eltávolítva a mentettekből",
      it: "Rimosso dai salvati",
    },
    imageUnavailable: {
      en: "Image not available",
      hu: "Kép nem elérhető",
      it: "Immagine non disponibile",
    },
    addedToast: {
      en: "{name} added to planner",
      hu: "{name} hozzáadva a tervezőhöz",
      it: "{name} aggiunto al planner",
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

export type LocalCopySource = (object & { publicCopy?: PublicCopyDictionary }) | null | undefined;

function getPublicCopyValue(source: LocalCopySource, locale: AppLocale, path: string): string | null {
  const localeCopy = source?.publicCopy?.[locale] ?? source?.publicCopy?.[DEFAULT_LOCALE];
  const value = localeCopy?.[path];
  return typeof value === "string" && value.trim() ? value : null;
}

export function getLocalText<T extends LocaleRecord>(
  source: LocalCopySource,
  locale: AppLocale,
  path: string,
  fallback: T,
): string {
  return getPublicCopyValue(source, locale, path) ?? getText(fallback, locale);
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
}

export function getCategoryLabel(category: Category, locale: AppLocale): string {
  return getText(siteCopy.discover.categoryLabels[category], locale);
}

export function getLocalCategoryLabel(source: LocalCopySource, category: Category, locale: AppLocale): string {
  return getPublicCopyValue(source, locale, `discover.categoryLabels.${category}`) ?? getCategoryLabel(category, locale);
}

const FILTER_VALUE_LABELS: Record<string, LocaleRecord> = {
  Youth: { en: "Youth", hu: "Ifjúsági", it: "Giovani" },
  Beginner: { en: "Beginner", hu: "Kezdő", it: "Principianti" },
  "Licensed Adult": { en: "Licensed Adult", hu: "Engedéllyel rendelkező felnőtt", it: "Adulto autorizzato" },
  Competition: { en: "Competition", hu: "Versenyző", it: "Competizione" },
  "Hunter Prep": { en: "Hunter Prep", hu: "Vadászati felkészítés", it: "Preparazione venatoria" },
  Weekday: { en: "Weekday", hu: "Hétköznap", it: "Giorni feriali" },
  Weekend: { en: "Weekend", hu: "Hétvége", it: "Weekend" },
  Morning: { en: "Morning", hu: "Délelőtt", it: "Mattina" },
  Afternoon: { en: "Afternoon", hu: "Délután", it: "Pomeriggio" },
  Evening: { en: "Evening", hu: "Este", it: "Sera" },
  Seasonal: { en: "Seasonal", hu: "Szezonális", it: "Stagionale" },
  "After-school": { en: "After-school", hu: "Délutáni", it: "Dopo scuola" },
  Rifle: { en: "Rifle", hu: "Puska", it: "Carabina" },
  Pistol: { en: "Pistol", hu: "Pisztoly", it: "Pistola" },
  Shotgun: { en: "Shotgun", hu: "Sörétes", it: "Fucile a canna liscia" },
  "Clay Shooting": { en: "Clay Shooting", hu: "Koronglövészet", it: "Tiro al piattello" },
  Airgun: { en: "Airgun", hu: "Légfegyver", it: "Aria compressa" },
  IPSC: { en: "IPSC", hu: "IPSC", it: "IPSC" },
  "Long Range": { en: "Long Range", hu: "Távlövészet", it: "Lunga distanza" },
  "Biathlon Prep": { en: "Biathlon Prep", hu: "Biatlon felkészítés", it: "Preparazione biathlon" },
  "Hunter Safety": { en: "Hunter Safety", hu: "Vadászbiztonság", it: "Sicurezza venatoria" },
  "Field Shooting": { en: "Field Shooting", hu: "Tereplövészet", it: "Tiro sul campo" },
  "Range Training": { en: "Range Training", hu: "Lőtéri képzés", it: "Allenamento al poligono" },
  Competitions: { en: "Competitions", hu: "Versenyek", it: "Competizioni" },
  Target: { en: "Target", hu: "Céllövészet", it: "Bersaglio" },
  Coach: { en: "Coach", hu: "Edző", it: "Istruttore" },
  Hunt: { en: "Hunt", hu: "Vadászat", it: "Caccia" },
  Archery: { en: "Archery", hu: "Íjászat", it: "Tiro con l'arco" },
  Gunsmithing: { en: "Gunsmithing", hu: "Fegyvermesteri szolgáltatás", it: "Armeria" },
  "Junior Academy": { en: "Junior Academy", hu: "Junior akadémia", it: "Accademia junior" },
  "Women-Only Sessions": { en: "Women-Only Sessions", hu: "Női alkalmak", it: "Sessioni solo donne" },
  "Licence Preparation": { en: "Licence Preparation", hu: "Engedélyfelkészítés", it: "Preparazione licenza" },
  "Corporate Range Days": { en: "Corporate Range Days", hu: "Céges lőtéri napok", it: "Giornate aziendali al poligono" },
  "Night Shooting": { en: "Night Shooting", hu: "Éjszakai lövészet", it: "Tiro notturno" },
  "Dog Handling": { en: "Dog Handling", hu: "Vadászkutya-kezelés", it: "Gestione cani" },
};

export function getFilterValueLabel(value: string, locale: AppLocale): string {
  const label = FILTER_VALUE_LABELS[value];
  return label ? getText(label, locale) : value;
}

export function getLocalFilterValueLabel(source: LocalCopySource, value: string, locale: AppLocale): string {
  return getPublicCopyValue(source, locale, `filters.values.${value}`) ?? getFilterValueLabel(value, locale);
}

export function localizeSiteDocument(site: SiteDoc & PublicCopyFields, locale: AppLocale): SiteDoc & PublicCopyFields {
  const guidesViewAllLabel = typeof site.guidesViewAllLabel === "string" ? site.guidesViewAllLabel : "";
  const publicLocales = Array.isArray(site.publicLocales)
    ? site.publicLocales.filter((value): value is AppLocale => (locales as readonly string[]).includes(value))
    : [];
  const base = {
    ...site,
    guidesViewAllLabel: guidesViewAllLabel.toLowerCase().includes("neighborhood") ? "Browse all regions" : guidesViewAllLabel,
    publicLocales: publicLocales.length > 0 ? publicLocales : [...locales],
    publicDefaultLocale: site.publicDefaultLocale ?? DEFAULT_LOCALE,
  };

  if (locale === DEFAULT_LOCALE) return base;

  return {
    ...base,
    homeHeroTitle: locale === "hu"
      ? "Találj ellenőrzött lősport-, klub- és vadászati helyszíneket Magyarországon"
      : "Trova sedi verificate per tiro sportivo, club e accessi venatori in Ungheria",
    homeHeroSubtitle: locale === "hu"
      ? "Böngéssz képzéseket, lőtereket, versenyeket, vadászterületeket és klubokat forrásalapú, ország- és régióközpontú szűrőkkel."
      : "Sfoglia allenamenti, poligoni, gare, aree venatorie e club con filtri per paese e regione basati su fonti.",
    homeHeroPrimaryCta: locale === "hu" ? "Böngészés indítása" : "Inizia a esplorare",
    homeHeroSecondaryCta: locale === "hu" ? "Régiók böngészése" : "Sfoglia per regione",
    homeHeroTagline: locale === "hu" ? "Országközpontú. Ellenőrzött. Forrásalapú." : "Per paese. Verificato. Basato su fonti.",
    homeCategoriesTitle: locale === "hu" ? "Mit keresel?" : "Che cosa cerchi?",
    neighborhoodSectionTitle: locale === "hu" ? "Keress helyszínt régió szerint" : "Trova sedi per regione",
    popularNeighborhoodsCaption: locale === "hu" ? "Népszerű régiók itt: {borough}" : "Regioni popolari in {borough}",
    guidesSectionTitle: locale === "hu" ? "Hasznos régiós útmutatók" : "Guide regionali utili",
    guidesViewAllLabel: locale === "hu" ? "Összes régió böngészése" : "Sfoglia tutte le regioni",
    howItWorksSectionTitle: locale === "hu" ? "Hogyan működik a RangeScout EU" : "Come funziona RangeScout EU",
    popularPicksSectionTitle: locale === "hu" ? "Kiemelt induló találatok" : "Scelte consigliate per iniziare",
    popularPicksViewAllLabel: locale === "hu" ? "Összes megtekintése" : "Vedi tutto",
    newsletterTitle: locale === "hu" ? "Kapj friss lősport-helyszín híreket a régiódból" : "Ricevi aggiornamenti sulle sedi di tiro nella tua regione",
    newsletterSubtitle: locale === "hu"
      ? "Új képzések, lőterek, vadászati lehetőségek és klubesemények egy helyen."
      : "Nuovi allenamenti, poligoni, opportunità venatorie ed eventi dei club in un unico posto.",
    newsletterPlaceholder: locale === "hu" ? "E-mail címed" : "Inserisci la tua email",
    newsletterCta: locale === "hu" ? "Feliratkozás" : "Iscrivimi",
    newsletterFinePrint: locale === "hu" ? "Nincs spam. Bármikor leiratkozhatsz." : "Niente spam. Puoi annullare l'iscrizione quando vuoi.",
    sidebarTitle: getText(siteCopy.sidebar.promoTitle, locale),
    sidebarBody: getText(siteCopy.sidebar.promoBody, locale),
    sidebarCtaLabel: getText(siteCopy.sidebar.promoCta, locale),
  };
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
