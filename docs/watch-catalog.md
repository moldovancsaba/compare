# Watch Catalog

The mechanical-watch adapter now uses a versioned JSON catalog at `src/lib/data/watch-catalog.v1.json`.

## Source Of Truth

- `version`: catalog document version. Current value is `1`.
- `watches`: array of normalized `WatchSpec` rows consumed by the watch adapter.

`src/lib/data/watch-catalog.ts` is now only a validated loader. The JSON document is the authoritative catalog source.

## Validation Rules

The loader fails fast through `src/lib/data/watch-catalog-schema.ts`.

Validation currently enforces:
- document version must match the supported loader version
- every watch row must satisfy the full `WatchSpec` contract
- watch `id` and `slug` must be kebab-case and unique across the catalog
- aliases must be non-empty, unique within a watch row, and unique across the catalog
- URLs must be valid URLs
- secondary-market dates must use `YYYY-MM-DD`

Maintainer check:

```bash
npm run catalog:validate
```

## Adding A Watch Manually

1. Add a new row to `src/lib/data/watch-catalog.v1.json` inside `watches`.
2. Keep the row normalized to the `WatchSpec` contract.
3. Run `npm run catalog:validate`.
4. Run `npm run test`.

If validation fails, the error output points to the exact document path that needs correction.

## Ingestion Workflow

The repository now includes a repeatable maintainer workflow for new-watch drafts from curated source URLs.

Create a manifest JSON file shaped like this:

```json
{
  "officialProductUrl": "https://example.com/official-watch-page",
  "secondaryMarketUrl": "https://example.com/secondary-market-page",
  "draft": {
    "id": "example-watch-id",
    "brand": "Example Brand",
    "model": "Example Model",
    "reference": "REF-123",
    "slug": "example-watch-id",
    "aliases": ["example watch"],
    "productUrl": "https://example.com/official-watch-page",
    "msrpUsd": 1000,
    "caseDiameterMm": 38,
    "caseThicknessMm": 11,
    "lugToLugMm": 46,
    "lugWidthMm": 20,
    "waterResistanceM": 100,
    "movement": "Example Caliber",
    "powerReserveHours": 70,
    "frequencyVph": 28800,
    "bracelet": "Example bracelet",
    "microAdjust": true,
    "dateWindow": false,
    "lumeProfile": "Example lume profile",
    "style": "field",
    "weightFeel": "balanced",
    "notes": ["Example maintainer note"],
    "marketingClaims": ["Example claim"],
    "secondaryMarket": {
      "estimatedMarketPriceUsd": 900,
      "marketPriceDate": "2026-05-15",
      "oneYearTrendPercent": -2.5,
      "liquidityTier": "medium",
      "sourceLabel": "Curated secondary-market snapshot",
      "sourceUrl": "https://example.com/secondary-market-page",
      "confidence": "medium"
    },
    "ownership": {
      "dailyExperience": "Example daily experience.",
      "emotionalCharacter": "Example emotional character.",
      "serviceReality": "Example service reality.",
      "resaleBehaviour": "Example resale behaviour.",
      "scratchRisk": "Example scratch risk.",
      "enthusiastBias": "Example enthusiast bias.",
      "marketingReality": "Example marketing reality."
    }
  }
}
```

Then run:

```bash
npm run catalog:ingest -- --manifest ./watch-draft.json --output ./tmp/watch-entry.json
```

What the ingestion script does:
- validates the manifest structure
- validates the watch draft against the same schema used by the app loader
- confirms the draft URLs match the curated source URLs in the manifest
- checks the draft against the live catalog for duplicate ids, slugs, and aliases
- attempts to fetch the official and secondary-market URLs and records the resolved URL and HTML title when available
- writes a normalized watch row JSON artifact for review

The maintainer remains the final approval step. The script is a normalization and verification tool, not an autonomous publishing path.
