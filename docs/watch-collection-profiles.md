# Watch Collection Profiles

{compare} supports a V1 accountless watch collection profile so mechanical-watch comparisons can read basic ownership context without requiring sign-in.

## Storage Model

The profile is stored in the user's browser with `localStorage` under `compare.watchCollectionProfile.v1`.

Stored fields:
- `items`: supported catalog watches marked as `owned`, `wishlist`, or `sold`.
- `preferredBrands`: user-entered brand preferences.
- Optional item notes, capped at 240 characters.
- Optional `updatedAt` timestamps for edited items.

No account, server database write, portfolio value lookup, or cross-device sync is part of this V1.

## Privacy Behavior

Collection data stays local until the user runs a watch comparison. For watch-domain comparisons only, the browser sends the profile as adapter context in the `/api/compare` request so the watch adapter can add collection-aware guidance to that result.

The submitted profile is not a general product-wide user profile. It is request context for the deterministic comparison path. Avoid adding sensitive personal details to item notes.

## Comparison Behavior

When context is present, the watch adapter can:
- show a `Collection context` ownership-intelligence block
- add a collection-aware buyer recommendation
- add a recommendation signal when one compared watch is already owned, wishlist, or sold
- produce local gap/overlap insights for owned watches
- produce upgrade-path guidance for compared watches against the closest owned watch
- produce secondary balance scores with contributors and suggestions

## Gap And Overlap Analysis

The local profile panel runs deterministic collection analysis over owned catalog watches.

Current insight families:
- missing wearing roles by watch style
- redundant style coverage
- brand concentration
- size balance gaps
- date/no-date complication balance

Every insight includes cited watch IDs and traits so the UI can show why the recommendation appeared. Empty collections and one-watch collections degrade into low-confidence setup prompts instead of pretending there is enough data for a full diagnosis.

Collection profiles do not yet perform collection scoring or portfolio valuation. Those belong to later Project 16 issues.

## Upgrade Path Guidance

When a comparison is submitted with owned watches in the local profile, the watch adapter compares each candidate against the closest owned watch and classifies the path as:
- `meaningful`: clear capability, fit, or role improvement
- `lateral`: similar enough that taste and rotation overlap dominate
- `emotional`: mostly a brand/status or preference-led upgrade
- `poor_value`: higher cost without enough capability or fit improvement

The verdict lists changed traits so users can see whether the advice is about capability, wearability, role coverage, or emotional preference. It is ownership guidance, not financial advice or an automated sell recommendation.

## Balance Scoring

The local profile panel shows deterministic balance guidance as a secondary decision aid, not as a collection grade.

Score dimensions:
- `versatility`: style-role coverage and practical water-resistance coverage
- `redundancy`: style and brand concentration
- `formality`: formal-flex versus casual/tool balance
- `complication`: date and no-date diversity
- `ownership_risk`: service-burden, resale-stability, and reliability profile

Each score exposes contributors and a plain-language suggestion. Scores should be used to find concentration, missing contrast, and ownership friction before a purchase; they should not be used for leaderboards, investment ranking, or taste policing.
