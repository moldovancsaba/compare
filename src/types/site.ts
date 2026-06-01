import type { Borough, BoroughChoice, Category } from "@/types/provider";
import { CMS_MEDIA } from "@/config/defaultMedia";
import type { AppLocale } from "@/lib/i18n/config";

/** Lucide icon keys used by home marketing blocks (stored in Mongo). */
export type SiteIconKey =
  | "map-pin"
  | "list-checks"
  | "heart"
  | "shield-check"
  | "compass"
  | "users"
  | "calculator";

export type SiteTone = "orange" | "teal" | "pink" | "amber" | "blue";
export type SiteLocationImageView = Category | "Meet-Up Groups";

export interface SiteGuide {
  /** Stable id for React keys and ingest; falls back to title if omitted. */
  id?: string;
  title: string;
  desc: string;
  borough: Borough;
  neighborhood: string;
  imageUrl: string;
  tone: SiteTone;
  /** CTA under the card; default "Explore guide" in UI when empty. */
  ctaLabel?: string;
  /** If set, card navigates here (http(s) opens new tab; otherwise treated as in-app path or hash). */
  ctaHref?: string;
}

export interface SiteHowStep {
  step: number;
  title: string;
  desc: string;
  tone: SiteTone;
  icon: SiteIconKey;
}

export interface SiteLocationHeroImage {
  view: SiteLocationImageView;
  borough: BoroughChoice;
  neighborhood?: string;
  imageUrl: string;
  alt?: string;
}

export interface SiteTrustPillar {
  title: string;
  desc: string;
  tone: SiteTone;
  icon: SiteIconKey;
}

/** Saved-tab filter chip; `categoryFilter` must match `badgeFor(provider).filter` / meetup row. */
export type AccountSavedCategoryFilter = "All" | "Classes" | "Camps" | "Competitions" | "Drop-Ins" | "Meet-Up Groups";

export interface SiteAccountSavedFilterChip {
  label: string;
  categoryFilter: AccountSavedCategoryFilter;
}

export interface SiteAccountPreferenceSection {
  id: string;
  label: string;
  options: string[];
  defaultSelected: string[];
}

export interface SiteAccountNeighborhoodCard {
  tabId: string;
  title: string;
  subtitle: string;
  addressLine1: string;
  addressLine2: string;
  detectedLabelPrefix: string;
  detectedNeighborhood: string;
  detectedBorough: Borough;
  updateAddressCtaLabel: string;
  nearbySectionLabel: string;
  nearbyNeighborhoods: string[];
  /** Borough used when a nearby chip navigates to Discover. */
  nearbyNavigateBorough: Borough;
  browseCtaLabel: string;
  browseNavigateBorough: Borough;
  browseNavigateNeighborhood: string;
  /** Toast when “Update address” is tapped (placeholder until geocoding ships). */
  updateAddressToast: string;
}

export interface SiteAccountSettings {
  page: { title: string; subtitle: string };
  navTabs: { id: string; label: string }[];
  saved: {
    tabId: string;
    title: string;
    subtitle: string;
    viewAllCta: string;
    filterChips: SiteAccountSavedFilterChip[];
    emptyMessage: string;
    card: { viewCta: string; shareCta: string; addToPlanCta: string; removeCta: string };
    toastAddedToPlan: string;
    toastRemoved: string;
    toastSampleRemove: string;
    /** Shown after price for provider cards (e.g. “class”, “week”). */
    priceUnits: { class: string; week: string; party: string; visit: string };
  };
  activityPlan: {
    tabId: string;
    title: string;
    subtitle: string;
    emptyMessage: string;
    estimatedTotalLabel: string;
    viewFullCta: string;
    clearCta: string;
    /** Label after unit price on the account plan preview (same semantics as Discover). */
    priceUnits: { class: string; week: string; party: string; visit: string };
  };
  familyPreferences: {
    tabId: string;
    title: string;
    subtitle: string;
    editCta: string;
    /** Toast after tapping edit/save preferences. */
    savedToast: string;
    sections: SiteAccountPreferenceSection[];
  };
  neighborhood: SiteAccountNeighborhoodCard;
  alerts: {
    tabId: string;
    title: string;
    subtitle: string;
    emailSectionLabel: string;
    options: string[];
    frequencySectionLabel: string;
    frequencyChoices: string[];
    saveCta: string;
    savedToast: string;
  };
  privacy: {
    headline: string;
    supportTextBefore: string;
    supportEmail: string;
    supportTextAfter: string;
  };
}

export interface SiteCalculatorCopy {
  title: string;
  subtitle: string;
  clearAllCta: string;
  emptyTitle: string;
  emptyMessage: string;
  asideTitle: string;
  asideSubtitle: string;
  asideFootnote: string;
  /** Appended to price in each row (e.g. "/class"). */
  providerLinePriceSuffix: string;
  estimatedTotalLabel: string;
}

/**
 * Local-owned public UI dictionary.
 *
 * CHECK Local writes these path-keyed overrides through the authenticated ingest/site document path.
 * Code fallback copy exists only as safety net; live public language should be maintained here.
 */
export type SitePublicCopy = Partial<Record<AppLocale, Record<string, string>>>;

export interface SiteDoc {
  _id: "main";
  logoUrl: string;
  homeHeroUrl: string;
  discoverHeroUrl: string;
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeHeroPrimaryCta: string;
  homeHeroSecondaryCta: string;
  homeHeroTagline: string;
  homeCategoriesTitle: string;
  neighborhoodSectionTitle: string;
  /** Use {"{borough}"} as placeholder for the selected borough name. */
  popularNeighborhoodsCaption: string;
  guidesSectionTitle: string;
  guidesViewAllLabel: string;
  /** Optional absolute URL; when empty, “View all” uses in-app Discover navigation. */
  guidesViewAllHref?: string;
  guides: SiteGuide[];
  /** Explicit real images for Discover / Meet-Up hero panels by exact view + borough + optional neighborhood. */
  locationHeroImages: SiteLocationHeroImage[];
  howItWorksSectionTitle: string;
  howItWorksSteps: SiteHowStep[];
  trustPillars: SiteTrustPillar[];
  trustLines: string[];
  popularPicksSectionTitle: string;
  popularPicksViewAllLabel: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterPlaceholder: string;
  newsletterCta: string;
  newsletterFinePrint: string;
  sidebarTitle: string;
  sidebarBody: string;
  sidebarCtaLabel: string;
  /** Provider **display names** from the catalog to feature on the home “Popular picks” row (resolved in order). */
  homePopularPickProviderNames: string[];
  /** Optional meet-up `id` from the meetup catalog; empty hides the card. */
  homePopularMeetupGroupId: string;
  calculator: SiteCalculatorCopy;
  /** My Account + related dashboard copy and option lists (CMS). */
  account: SiteAccountSettings;
  /** Local-managed i18n overrides for public labels, helper text, empty states, and action copy. */
  publicCopy?: SitePublicCopy;
  /** Local-managed language set exposed by the public selector for this miniapp. */
  publicLocales?: AppLocale[];
  /** Local-managed default public language for this miniapp. */
  publicDefaultLocale?: AppLocale;
  /** Audit stamp written by CHECK Local when refreshing publicCopy. */
  publicCopyMaintainedAt?: string;
  /** Human-readable owner/source for the last publicCopy refresh. */
  publicCopyMaintainedBy?: string;
}

export const DEFAULT_SITE: Omit<SiteDoc, "_id"> = {
  logoUrl: "",
  homeHeroUrl: CMS_MEDIA.homeHero,
  discoverHeroUrl: CMS_MEDIA.discoverHero,
  homeHeroTitle: "Find sport shooting venues, clubs, and hunting access across Europe",
  homeHeroSubtitle:
    "Browse training, ranges, competitions, hunting grounds, and clubs with country-first filters built for operators, members, and hunting communities in the EU.",
  homeHeroPrimaryCta: "Start exploring",
  homeHeroSecondaryCta: "Browse by region",
  homeHeroTagline: "Country-first. Curated. Operator-useful.",
  homeCategoriesTitle: "What are you looking for?",
  neighborhoodSectionTitle: "Find venues in your region",
  popularNeighborhoodsCaption: "Popular regions in {borough}",
  guidesSectionTitle: "Regional guides worth opening",
  guidesViewAllLabel: "Browse all regions",
  guidesViewAllHref: "",
  guides: [],
  locationHeroImages: [],
  howItWorksSectionTitle: "How RangeScout EU works",
  howItWorksSteps: [
    {
      step: 1,
      title: "Choose your country and region",
      desc: "Start with where your members, guests, or teams can actually travel.",
      tone: "orange",
      icon: "map-pin",
    },
    {
      step: 2,
      title: "Compare licensed options",
      desc: "See audience fit, pricing, schedules, disciplines, and operator notes.",
      tone: "teal",
      icon: "list-checks",
    },
    {
      step: 3,
      title: "Save, share & plan",
      desc: "Keep favorites, send options to your team, and estimate total spend.",
      tone: "pink",
      icon: "heart",
    },
  ],
  trustPillars: [],
  trustLines: [],
  popularPicksSectionTitle: "Popular picks to get you started",
  popularPicksViewAllLabel: "View all",
  newsletterTitle: "Get the latest shooting venue updates for your region",
  newsletterSubtitle: "New training lanes, ranges, hunting opportunities, and club events — delivered to your inbox.",
  newsletterPlaceholder: "Enter your email",
  newsletterCta: "Sign me up!",
  newsletterFinePrint: "No spam. Unsubscribe anytime.",
  sidebarTitle: "List your venue",
  sidebarBody: "Reach more EU shooters and hunting communities with a featured listing, club profile, or regional discovery presence.",
  sidebarCtaLabel: "Request listing info",
  homePopularPickProviderNames: [],
  homePopularMeetupGroupId: "",
  calculator: {
    title: "Activity cost planner",
    subtitle: "Estimate your total monthly spend across venues and providers.",
    clearAllCta: "Clear all",
    emptyTitle: "Calculator is empty",
    emptyMessage: "Add venues to estimate your total activity cost.",
    asideTitle: "Estimated monthly cost",
    asideSubtitle: "Based on the venues and sessions you've added.",
    asideFootnote: "Estimates for planning only. Confirm rates, access rules, and licensing requirements with each operator.",
    providerLinePriceSuffix: "/session",
    estimatedTotalLabel: "Estimated total",
  },
  account: {
    page: {
      title: "My Account",
      subtitle: "Manage your saved items, plan visits, and personalize your experience.",
    },
    navTabs: [
      { id: "saved", label: "Saved Venues & Clubs" },
      { id: "plan", label: "My Activity Plan" },
      { id: "prefs", label: "Shooting Preferences" },
      { id: "neighborhood", label: "My Region" },
      { id: "alerts", label: "Alerts & Email Settings" },
    ],
    saved: {
      tabId: "saved",
      title: "Saved Venues & Clubs",
      subtitle: "Everything you've saved in one place.",
      viewAllCta: "View all saved",
      filterChips: [
        { label: "All", categoryFilter: "All" },
        { label: "Training", categoryFilter: "Classes" },
        { label: "Ranges", categoryFilter: "Camps" },
        { label: "Competitions", categoryFilter: "Competitions" },
        { label: "Hunting Grounds", categoryFilter: "Drop-Ins" },
        { label: "Clubs", categoryFilter: "Meet-Up Groups" },
      ],
      emptyMessage: "No saved items in this category yet.",
      card: { viewCta: "View", shareCta: "Share", addToPlanCta: "Add to Plan", removeCta: "Remove" },
      toastAddedToPlan: "Added {name} to your plan",
      toastRemoved: "Removed {name}",
      toastSampleRemove: "Save providers from Discover to manage them here.",
      priceUnits: { class: "session", week: "membership", party: "entry", visit: "access" },
    },
    activityPlan: {
      tabId: "plan",
      title: "My Activity Plan",
      subtitle: "Estimate your total cost.",
      emptyMessage: "Add providers from Discover to your calculator to see them here.",
      estimatedTotalLabel: "Estimated total",
      viewFullCta: "View full plan",
      clearCta: "Clear plan",
      priceUnits: { class: "session", week: "membership", party: "entry", visit: "access" },
    },
    familyPreferences: {
      tabId: "prefs",
      title: "Shooting Preferences",
      subtitle: "Update your interests and training goals.",
      editCta: "Edit preferences",
      savedToast: "Preferences saved",
      sections: [
        {
          id: "age",
          label: "Audience",
          options: ["Youth", "Beginner", "Licensed Adult", "Competition", "Hunter Prep"],
          defaultSelected: ["Licensed Adult"],
        },
        {
          id: "interests",
          label: "Interests",
          options: [
            "Training",
            "Ranges",
            "Competitions",
            "Hunting Grounds",
            "Clubs",
            "Rifle",
            "Pistol",
            "Shotgun",
            "Clay Shooting",
            "IPSC",
            "Hunter Safety",
            "Licence Preparation",
          ],
          defaultSelected: ["Training", "Ranges", "Clubs", "Pistol", "Hunter Safety"],
        },
        {
          id: "times",
          label: "Preferred times",
          options: ["Weekday", "Weekend", "Morning", "Afternoon", "Evening", "Seasonal"],
          defaultSelected: ["Weekend", "Morning", "Seasonal"],
        },
      ],
    },
    neighborhood: {
      tabId: "neighborhood",
      title: "My Region",
      subtitle: "Your home base for local picks.",
      addressLine1: "",
      addressLine2: "",
      detectedLabelPrefix: "Detected region:",
      detectedNeighborhood: "",
      detectedBorough: "Hungary",
      updateAddressCtaLabel: "Update address",
      nearbySectionLabel: "Nearby neighborhoods",
      nearbyNeighborhoods: [],
      nearbyNavigateBorough: "Hungary",
      browseCtaLabel: "Browse venues near me",
      browseNavigateBorough: "Hungary",
      browseNavigateNeighborhood: "",
      updateAddressToast: "Update address coming soon",
    },
    alerts: {
      tabId: "alerts",
      title: "Alerts & Email Settings",
      subtitle: "Choose what you want to hear about.",
      emailSectionLabel: "Email alerts",
      options: [
        "Weekly regional picks",
        "New training near me",
        "Range updates",
        "Competition alerts",
        "Seasonal hunting access",
        "New clubs",
        "Updates from saved venues and clubs",
      ],
      frequencySectionLabel: "Email frequency",
      frequencyChoices: ["Weekly", "Only important updates", "Pause emails"],
      saveCta: "Save settings",
      savedToast: "Settings saved",
    },
    privacy: {
      headline: "We respect your privacy and handle inquiry data under EU GDPR expectations.",
      supportTextBefore: "Questions about listings, consent, or data requests? Email us at",
      supportEmail: "privacy@rangescout.eu",
      supportTextAfter: "",
    },
  },
  publicCopy: {},
  publicLocales: ["en", "hu", "it"],
  publicDefaultLocale: "en",
  publicCopyMaintainedAt: "",
  publicCopyMaintainedBy: "",
};
