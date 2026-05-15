import type { Metadata } from "next";

import { appName, appOrigin } from "@/lib/config/app";
import type { SavedComparisonPage } from "@/lib/services/saved-comparisons";

const maxDescriptionLength = 160;
const schemaContext = "https://schema.org";

type StructuredValue = string | number | boolean | null | StructuredValue[] | { [key: string]: StructuredValue };

function truncate(value: string, maxLength = maxDescriptionLength): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildSavedComparisonMetadata(savedComparison: SavedComparisonPage): Metadata {
  const result = savedComparison.deterministicResult;
  const title = `${result.leftEntity.label} vs ${result.rightEntity.label} comparison | ${appName}`;
  const description = truncate(
    `${result.verdict.headline} Stronger choice: ${result.verdict.strongerChoice}. ${result.verdict.summary}`
  );
  const path = `/compare/${savedComparison.publicSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: appName,
      type: "article"
    },
    twitter: {
      card: "summary",
      title,
      description
    }
  };
}

export function buildSavedComparisonStructuredData(
  savedComparison: SavedComparisonPage
): { [key: string]: StructuredValue } {
  const result = savedComparison.deterministicResult;
  const title = `${result.leftEntity.label} vs ${result.rightEntity.label} comparison | ${appName}`;
  const description = truncate(
    `${result.verdict.headline} Stronger choice: ${result.verdict.strongerChoice}. ${result.verdict.summary}`
  );
  const url = `${appOrigin}/compare/${savedComparison.publicSlug}`;

  return {
    "@context": schemaContext,
    "@type": "WebPage",
    name: title,
    description,
    url,
    inLanguage: "en",
    datePublished: savedComparison.firstSubmittedAt,
    dateModified: savedComparison.lastSubmittedAt,
    isPartOf: {
      "@type": "WebSite",
      name: appName,
      url: appOrigin
    },
    about: [
      {
        "@type": "Thing",
        name: result.leftEntity.label
      },
      {
        "@type": "Thing",
        name: result.rightEntity.label
      }
    ],
    mainEntity: {
      "@type": "ItemList",
      name: `${result.leftEntity.label} vs ${result.rightEntity.label} decision summary`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: result.verdict.headline
        },
        {
          "@type": "ListItem",
          position: 2,
          name: `Stronger choice: ${result.verdict.strongerChoice}`
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `Exception case: ${result.verdict.exceptionCase}`
        }
      ]
    }
  };
}
