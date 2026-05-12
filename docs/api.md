# {compare} API Documentation

Version: `v0.2.0`

## Overview

The public application API is JSON over HTTP. The main comparison endpoint is domain-neutral; adapters own resolution, comparison rules, section labels, and evidence.

Base path examples assume the app is running locally at `http://localhost:3000`.

## POST `/api/compare`

Runs a deterministic comparison.

### Request

```json
{
  "domain": "watches",
  "leftInput": "Rolex Air-King",
  "rightInput": "Rolex Explorer",
  "context": {
    "watchCollectionProfile": {
      "items": [
        {
          "watchId": "rolex-explorer-124270",
          "status": "owned"
        }
      ],
      "preferredBrands": ["Rolex"]
    }
  }
}
```

Fields:
- `domain`: optional comparison domain. Defaults to `watches`.
- `leftInput`: required user input for the first item.
- `rightInput`: required user input for the second item.
- `context`: optional adapter-owned context. Shared platform code treats this as opaque.

The watch adapter currently accepts `context.watchCollectionProfile`.

### Success Response

```json
{
  "comparison": {
    "domain": "watches",
    "canonicalInputA": "Rolex Air-King",
    "canonicalInputB": "Rolex Explorer",
    "leftEntity": {
      "id": "rolex-air-king-126900",
      "domain": "watches",
      "label": "Rolex Air-King",
      "slug": "rolex-air-king-126900",
      "aliases": []
    },
    "rightEntity": {
      "id": "rolex-explorer-124270",
      "domain": "watches",
      "label": "Rolex Explorer",
      "slug": "rolex-explorer-124270",
      "aliases": []
    },
    "verdict": {},
    "sectionLabels": {},
    "evidenceSummary": {},
    "recommendationSignals": [],
    "keyDifferences": [],
    "realWorldImpact": [],
    "ownershipIntelligence": [],
    "whoShouldBuyWhich": [],
    "overpricedFeatures": [],
    "hiddenDownsides": [],
    "betterValueAlternative": [],
    "signalVsFluff": []
  },
  "brain": {
    "status": "disabled",
    "comparisonRef": "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
    "message": "Trinity Brain is not enabled for this environment."
  },
  "savedComparison": {
    "publicSlug": "rolex-air-king-126900-vs-rolex-explorer-124270",
    "path": "/compare/rolex-air-king-126900-vs-rolex-explorer-124270",
    "persisted": false
  }
}
```

The actual `comparison` object contains full verdict, evidence, section, recommendation, and adapter-specific compatibility fields.

### Error Responses

Unsupported domain:

```json
{
  "error": "This comparison domain is not supported yet.",
  "supportedDomains": ["watches", "services"]
}
```

Unresolved input:

```json
{
  "error": "{compare} could not resolve one or both inputs in the selected comparison domain. Use one of the supported examples below or paste a matching source URL.",
  "supportedInputs": ["Rolex Air-King", "Rolex Explorer"],
  "leftSuggestions": [],
  "rightSuggestions": ["Rolex Explorer"]
}
```

Duplicate entity:

```json
{
  "error": "Choose two different things so the comparison surfaces meaningful tradeoffs."
}
```

Rate limited:

```json
{
  "error": "Too many comparison requests. Wait a moment and try again."
}
```

Rate-limited responses include a `Retry-After` header.

## GET `/api/compare/brain`

Reads the optional Brain enrichment state for a comparison.

Query parameter:
- `comparisonRef`: required comparison reference.

Success response:

```json
{
  "brain": {
    "status": "disabled",
    "comparisonRef": "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
    "message": "Trinity Brain is not enabled for this environment."
  }
}
```

Possible statuses include `disabled`, `unavailable`, `queued`, `running`, `failed`, and `completed`.

## POST `/api/compare/feedback`

Records optional user feedback for a comparison.

### Request

```json
{
  "comparisonRef": "compare:rolex-air-king-126900:vs:rolex-explorer-124270",
  "leftEntityId": "rolex-air-king-126900",
  "rightEntityId": "rolex-explorer-124270",
  "leftDomain": "watches",
  "rightDomain": "watches",
  "signal": "helpful",
  "note": "This helped me decide."
}
```

Allowed `signal` values:
- `helpful`
- `not_helpful`
- `chose_left`
- `chose_right`
- `opposite_preferred`
- `bad_recommendation`
- `missing_context`
- `wrong_spec`

Notes are optional and capped at 1,000 characters.

### Success Response

```json
{
  "feedback": {
    "status": "saved",
    "message": "Feedback saved for Trinity learning."
  }
}
```

When MongoDB is unavailable, the endpoint fails gracefully instead of blocking comparison use.

## Versioning

The API version follows the application release in `package.json`. Current API documentation targets `v0.2.0`.
