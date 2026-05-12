# {compare} Product Roadmap

## Positioning
{compare} is high-trust comparison intelligence for products, services, and other decision domains.

The core product is not a watch app. The core product is a domain-based comparison system:
- Generic comparison infrastructure.
- Domain-specific adapters.
- Evidence-backed verdicts.
- Practical tradeoff reasoning.

Mechanical watches remain the first live adapter and quality benchmark, but they are not the system boundary.

It is not:
- A generic AI comparison tool.
- SEO review spam.
- A universal shopping assistant.

The roadmap is ordered by platform generality, trust creation, differentiation, retention, monetization, and defensibility. The first milestone is simple: users trust the comparison verdict in one adapter while the system can safely add another adapter without rewriting the core.

## Phase 0: Domain Platform Stabilization
Goal: stop the app being product-hardcoded and make the adapter architecture real.

Success criteria:
- The API, UI shell, persistence, Brain queue, feedback, and telemetry operate on generic entities/domains.
- Watches run as the first adapter, not as the core architecture.
- New domains can be added through a documented adapter contract.
- Users understand which comparison domains are currently supported.

### 0.1 Domain Adapter SDK and Conformance Tests
Deliverables:
- Adapter contract.
- Required adapter metadata.
- Resolver conformance tests.
- Result-shape conformance tests.
- Watch adapter as the reference adapter.

Why it matters: without an SDK, every new comparison category becomes a one-off rewrite.

### 0.2 Generic Domain Selector and Adapter-Aware Input UX
Deliverables:
- Domain selector.
- Adapter-provided input labels.
- Adapter-provided examples.
- Generic unsupported-domain states.
- Generic unresolved-input recovery.

Why it matters: users need to understand what {compare} can compare right now without the UI pretending every domain already exists.

### 0.3 Universal Evidence and Confidence Model
Deliverables:
- Claim provenance.
- Source references.
- Data freshness.
- Confidence levels.
- Inference labels.

Why it matters: comparing anything only works if users trust why a conclusion exists.

### 0.4 Domain-Neutral Output Hardening
Deliverables:
- Deterministic comparison sections.
- Adapter-specific section labels.
- Stable verdict structure.
- Duplicate-entity handling.
- Generic persistence and feedback contracts.

Why it matters: the foundation must not regress into watch-specific assumptions.

## Phase 1: Second Domain Proof
Goal: prove {compare} can compare non-watch, non-product domains without weakening trust.

### 1.1 Services/SaaS Adapter
Deliverables:
- Service entity schema.
- Pricing and contract-risk attributes.
- Switching-cost reasoning.
- Support/integration tradeoffs.
- Deterministic services comparison fixtures.

Why it matters: services prove the system can compare beyond physical products.

### 1.2 Domain Data Source Governance
Deliverables:
- Source tiers.
- Freshness rules.
- Manual curation policy.
- Missing-data behavior.
- Adapter data requirements.

Why it matters: broad comparison dies if each adapter invents its own data standards.

### 1.3 Cross-Domain Resolver Disambiguation
Deliverables:
- Fuzzy matching.
- Typo tolerance.
- Entity aliases.
- Ambiguous result prompts.
- Adapter-specific suggestions.

Why it matters: search failure destroys trust in every domain.

### 1.4 Domain-Specific Intelligence Packs
Deliverables:
- Watch ownership intelligence.
- Service switching-cost intelligence.
- Domain-specific tradeoff dimensions.
- Reusable scoring primitives.

Why it matters: the product should be generic in infrastructure, not generic in reasoning.

## Phase 2: Watch Adapter Depth
Goal: keep watches as the quality benchmark while the platform generalizes.

### 2.1 User Collection Profiles
Deliverables:
- Owned watches.
- Wishlist.
- Sold watches.
- Preferred brands.

Why it matters: personalization starts with the collection graph.

### 2.2 Collection Gap Analysis
Deliverables:
- Redundancy detection.
- Missing-category detection.
- Overlap analysis.

Example: "Your collection lacks a lightweight casual daily watch."

### 2.3 Upgrade Path Intelligence
Deliverables:
- Meaningful upgrade detection.
- Lateral-move detection.
- Emotional-upgrade-only detection.
- Poor-value-upgrade detection.

Example: "This is mostly a branding upgrade, not an ownership upgrade."

### 2.4 Collection Balance Scoring
Deliverables:
- Versatility balance.
- Redundancy score.
- Formality balance.
- Complication diversity.

Why it matters: collectors obsess over optimization.

## Phase 3: Purchase Confidence Platform
Goal: become the fastest path to expensive purchase confidence.

### 3.1 Should I Buy This?
Deliverables:
- Single-watch evaluation.
- Value assessment.
- Overlap analysis.
- Emotional fit.
- Ownership risk.
- Alternatives.

### 3.2 Long-Term Ownership Simulator
Deliverables:
- Five-year ownership cost.
- Service intervals.
- Resale trajectory.
- Ownership friction.

Why it matters: this is a major differentiator.

### 3.3 Market Positioning Engine
Deliverables:
- Hype vs substance.
- Enthusiast perception.
- Collector reputation.
- Brand positioning.

Example: "Overvalued due to hype cycle rather than ownership quality."

### 3.4 Marketing vs Reality
Deliverables:
- Spec-inflation detection.
- Enthusiast-myth detection.
- Meaningless-upgrade detection.

Why it matters: this is potentially viral and deeply aligned with trust.

## Phase 4: Premium Subscription
Goal: monetize only after trust exists.

Free tier:
- Limited comparisons.
- Limited collection size.
- Basic analysis.

Premium tier:
- Advanced ownership analytics.
- Personalized recommendations.
- Smart discovery.
- Collector dashboard.

### 4.1 Advanced Ownership Analytics
Deliverables:
- Detailed ownership predictions.
- Collector scoring.
- Market intelligence.

### 4.2 Personalized Recommendations
Deliverables:
- Aesthetic taste learning.
- Sizing preference learning.
- Ownership pattern learning.

Example: "You consistently prefer understated integrated-bracelet sports watches."

### 4.3 Smart Discovery
Deliverables:
- Overlooked alternatives.
- Hidden gems.
- Value plays.

### 4.4 Collector Dashboard
Deliverables:
- Portfolio value.
- Rotation analysis.
- Wear frequency.
- Collection evolution.

## Phase 5: Defensibility
Goal: build a moat.

### 5.1 Proprietary Ownership Dataset
Deliverables:
- Comfort data.
- Ownership feedback.
- Service patterns.
- Resale behavior.

### 5.2 Community Intelligence
Deliverables:
- Weighted owner experience.
- Regret patterns.
- Hidden frustrations.
- Long-term satisfaction.

Not generic reviews.

### 5.3 Expert-Tuned Recommendation Models
Deliverables:
- Dress-watch reasoning.
- Diver reasoning.
- GADA-watch reasoning.
- Vintage-ownership reasoning.
- High-horology reasoning.

### 5.4 Semantic Watch Graph
Deliverables:
- Aesthetic similarity.
- Ownership similarity.
- Emotional similarity.
- Collection overlap.

## Phase 6: Expansion
Only after watches are excellent.

Possible categories:
- Cameras.
- Keyboards.
- Fountain pens.
- Raw denim.
- Audio gear.
- Running shoes.
- Luggage.

## Technical Roadmap
Tier 1:
- Resolver.
- Comparison quality.
- Output structure.
- Reliability.
- Testing.

Tier 2:
- User profiles.
- Collection persistence.
- Ownership metadata.

Tier 3:
- Recommendation models.
- Personalization.
- Semantic ranking.

## Strategic Constraint
Do not expand features faster than reasoning quality improves.

Bad reasoning plus more features equals a larger bad product.
