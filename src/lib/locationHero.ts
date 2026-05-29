import type { Borough, BoroughChoice, Category } from "@/types/provider";
import type { SiteDoc, SiteLocationHeroImage, SiteLocationImageView } from "@/types/site";

type HeroKind = Category | "Meet-Up Groups";

type HeroCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

const DISPLAY_LABELS: Record<HeroKind, string> = {
  Classes: "Training",
  Camps: "Ranges",
  "Birthday Parties": "Competitions",
  "Drop-In Activities": "Hunting Grounds",
  "Meet-Up Groups": "Clubs",
};

type BoroughTheme = {
  landmark: string;
  boroughLine: string;
};

const BOROUGH_THEMES: Record<Borough, BoroughTheme> = {
  Manhattan: {
    landmark: "Legacy city catalog",
    boroughLine: "Legacy catalog geography retained only for compatibility with older curation helpers.",
  },
  Brooklyn: {
    landmark: "Legacy city catalog",
    boroughLine: "Legacy catalog geography retained only for compatibility with older curation helpers.",
  },
  Queens: {
    landmark: "Legacy city catalog",
    boroughLine: "Legacy catalog geography retained only for compatibility with older curation helpers.",
  },
  Bronx: {
    landmark: "Legacy city catalog",
    boroughLine: "Legacy catalog geography retained only for compatibility with older curation helpers.",
  },
  "Staten Island": {
    landmark: "Legacy city catalog",
    boroughLine: "Legacy catalog geography retained only for compatibility with older curation helpers.",
  },
  Germany: {
    landmark: "Forest ranges + clubhouses",
    boroughLine: "Dense club infrastructure, strong safety culture, and a deep mix of indoor and outdoor shooting venues.",
  },
  France: {
    landmark: "Regional federations + sporting estates",
    boroughLine: "Strong club networks, practical training lanes, and hunting-focused regional operators.",
  },
  Spain: {
    landmark: "Open ranges + dry terrain",
    boroughLine: "Competition calendars, clay venues, and destination ranges with strong weekend traffic.",
  },
  Italy: {
    landmark: "Alpine valleys + historic clubs",
    boroughLine: "Mixed discipline clubs, scenic hunting territories, and strong regional communities.",
  },
  Poland: {
    landmark: "Training grounds + membership clubs",
    boroughLine: "Fast-growing sport shooting infrastructure with accessible training and practical licensing lanes.",
  },
};

const CATEGORY_LINES: Record<HeroKind, { eyebrow: string; cityTitle: string; cityDescription: string }> = {
  Classes: {
    eyebrow: "Training directory",
    cityTitle: "Find shooting training across Europe",
    cityDescription:
      "Compare pistol, rifle, shotgun, and safety courses with filters anchored to country and region.",
  },
  Camps: {
    eyebrow: "Range directory",
    cityTitle: "Compare shooting ranges across Europe",
    cityDescription:
      "See indoor, outdoor, clay, and long-range facilities by country first, then narrow to the region you can actually reach.",
  },
  "Birthday Parties": {
    eyebrow: "Competition calendar",
    cityTitle: "Track competitions across Europe",
    cityDescription:
      "Compare hosted matches, open qualifiers, and club events without bouncing between federation calendars and club pages.",
  },
  "Drop-In Activities": {
    eyebrow: "Hunting access",
    cityTitle: "Find hunting grounds across Europe",
    cityDescription:
      "Review managed hunting territories, field practice operators, and seasonal access options in one browse flow.",
  },
  "Meet-Up Groups": {
    eyebrow: "Club network",
    cityTitle: "Find shooting clubs across Europe",
    cityDescription:
      "Browse sport shooting clubs, hunting associations, and regional member communities with location filters that match real travel patterns.",
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

function locationLine(borough: Borough, neighborhood: string | null): string {
  if (neighborhood && NEIGHBORHOOD_LINES[neighborhood]) return NEIGHBORHOOD_LINES[neighborhood];
  return BOROUGH_THEMES[borough].boroughLine;
}

function headline(kind: HeroKind, borough: BoroughChoice, neighborhood: string | null): string {
  if (borough === "All") return CATEGORY_LINES[kind].cityTitle;
  if (neighborhood) return `${DISPLAY_LABELS[kind]} in ${neighborhood}`;
  return `${DISPLAY_LABELS[kind]} in ${borough}`;
}

function description(kind: HeroKind, borough: BoroughChoice, neighborhood: string | null): string {
  if (borough === "All") return CATEGORY_LINES[kind].cityDescription;
  const boroughTheme = BOROUGH_THEMES[borough];
  const locLine = locationLine(borough, neighborhood);
  if (kind === "Meet-Up Groups") {
    return neighborhood
      ? `${locLine} Browse nearby clubs and associations without leaving the regional context behind.`
      : `${boroughTheme.boroughLine} Compare member communities across nearby regions inside ${borough}.`;
  }
  return neighborhood
    ? `${locLine} Compare audience fit, schedules, and discipline mix without losing the local context.`
    : `${boroughTheme.boroughLine} Start with ${borough}, then narrow to the region that matches your routine.`;
}

function eyebrow(kind: HeroKind, borough: BoroughChoice, neighborhood: string | null): string {
  if (neighborhood) return `${neighborhood} • ${borough}`;
  if (borough !== "All") return `${borough} • ${CATEGORY_LINES[kind].eyebrow}`;
  return CATEGORY_LINES[kind].eyebrow;
}

export function getLocationHero(kind: HeroKind, borough: BoroughChoice, neighborhood: string | null): HeroCopy {
  return {
    eyebrow: eyebrow(kind, borough, neighborhood),
    title: headline(kind, borough, neighborhood),
    description: description(kind, borough, neighborhood),
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
