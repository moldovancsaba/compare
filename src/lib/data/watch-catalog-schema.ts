import { z } from "zod";

import type { WatchSpec } from "@/types/watch";

const watchCatalogDocumentVersion = 1;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const watchMarketPositioningSchema = z.strictObject({
  hypeLevel: z.enum(["low", "moderate", "high"]),
  collectorRespect: z.enum(["niche", "solid", "strong"]),
  marketSaturation: z.enum(["low", "moderate", "high"]),
  brandCachet: z.enum(["quiet", "recognized", "status"]),
  substanceSignals: z.array(z.string().min(1)).min(1),
  cautionSignals: z.array(z.string().min(1)).min(1),
  positioningSummary: z.string().min(1)
});

const watchSecondaryMarketSchema = z.strictObject({
  estimatedMarketPriceUsd: z.number().positive(),
  marketPriceDate: z.string().regex(isoDatePattern, "Expected YYYY-MM-DD market price date."),
  oneYearTrendPercent: z.number(),
  liquidityTier: z.enum(["low", "medium", "high"]),
  sourceLabel: z.string().min(1),
  sourceUrl: z.string().url(),
  confidence: z.enum(["low", "medium", "high"])
});

const watchOwnershipProfileSchema = z.strictObject({
  serviceExpectation: z.enum(["low", "medium", "high"]),
  comfort: z.enum(["compact", "balanced", "substantial"]),
  durability: z.enum(["dress", "everyday", "tool"]),
  reliability: z.enum(["standard", "strong", "exceptional"]),
  resaleStability: z.enum(["soft", "stable", "strong"]),
  braceletQuality: z.enum(["basic", "solid", "excellent"]),
  strapVersatility: z.enum(["limited", "moderate", "high"])
});

const watchOwnershipSchema = z.strictObject({
  dailyExperience: z.string().min(1),
  emotionalCharacter: z.string().min(1),
  serviceReality: z.string().min(1),
  resaleBehaviour: z.string().min(1),
  scratchRisk: z.string().min(1),
  enthusiastBias: z.string().min(1),
  marketingReality: z.string().min(1)
});

export const watchSpecSchema: z.ZodType<WatchSpec> = z
  .strictObject({
    id: z.string().regex(slugPattern, "Expected kebab-case watch id."),
    brand: z.string().min(1),
    model: z.string().min(1),
    reference: z.string().min(1),
    slug: z.string().regex(slugPattern, "Expected kebab-case watch slug."),
    aliases: z.array(z.string().min(1)).min(1),
    productUrl: z.string().url(),
    movementFamily: z.string().min(1).optional(),
    msrpUsd: z.number().positive(),
    caseDiameterMm: z.number().positive(),
    caseThicknessMm: z.number().positive(),
    lugToLugMm: z.number().positive(),
    lugWidthMm: z.number().positive(),
    caseMaterial: z.enum(["steel", "titanium", "gold", "ceramic", "two-tone"]).optional(),
    bezelType: z.enum(["smooth", "timing", "count-up", "fixed-24h", "rotating-60", "internal"]).optional(),
    crystal: z.enum(["sapphire", "acrylic", "mineral"]).optional(),
    waterResistanceM: z.number().nonnegative(),
    movement: z.string().min(1),
    powerReserveHours: z.number().positive(),
    frequencyVph: z.number().positive(),
    bracelet: z.string().min(1),
    claspType: z.string().min(1).optional(),
    strapOptions: z.array(z.string().min(1)).min(1).optional(),
    accuracyClaimSecondsPerDay: z.string().min(1).optional(),
    microAdjust: z.boolean(),
    dateWindow: z.boolean(),
    lumeProfile: z.string().min(1),
    antiMagneticGauss: z.number().positive().optional(),
    style: z.enum(["field", "explorer", "dive", "dress-sport"]),
    weightFeel: z.enum(["light", "balanced", "substantial"]),
    heritageProfile: z.string().min(1).optional(),
    notes: z.array(z.string().min(1)).min(1),
    marketingClaims: z.array(z.string().min(1)).min(1),
    marketPositioning: watchMarketPositioningSchema.optional(),
    secondaryMarket: watchSecondaryMarketSchema.optional(),
    ownershipProfile: watchOwnershipProfileSchema.optional(),
    ownership: watchOwnershipSchema
  })
  .superRefine((watch, ctx) => {
    const normalizedAliases = new Set<string>();

    watch.aliases.forEach((alias, index) => {
      const normalized = alias.trim().toLowerCase();

      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aliases", index],
          message: "Aliases must not be blank after trimming."
        });
        return;
      }

      if (normalizedAliases.has(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aliases", index],
          message: `Duplicate alias in watch entry: ${alias}`
        });
        return;
      }

      normalizedAliases.add(normalized);
    });
  });

export const watchCatalogDocumentSchema = z
  .strictObject({
    version: z.literal(watchCatalogDocumentVersion),
    watches: z.array(watchSpecSchema).min(1)
  })
  .superRefine((document, ctx) => {
    const ids = new Map<string, number>();
    const slugs = new Map<string, number>();
    const aliases = new Map<string, number>();

    document.watches.forEach((watch, index) => {
      const priorId = ids.get(watch.id);
      if (priorId !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["watches", index, "id"],
          message: `Duplicate watch id already used by watches[${priorId}].id`
        });
      } else {
        ids.set(watch.id, index);
      }

      const priorSlug = slugs.get(watch.slug);
      if (priorSlug !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["watches", index, "slug"],
          message: `Duplicate watch slug already used by watches[${priorSlug}].slug`
        });
      } else {
        slugs.set(watch.slug, index);
      }

      watch.aliases.forEach((alias, aliasIndex) => {
        const normalized = alias.trim().toLowerCase();
        const priorAlias = aliases.get(normalized);

        if (priorAlias !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["watches", index, "aliases", aliasIndex],
            message: `Duplicate alias already used by watches[${priorAlias}]`
          });
        } else {
          aliases.set(normalized, index);
        }
      });
    });
  });

export type WatchCatalogDocument = z.infer<typeof watchCatalogDocumentSchema>;

function formatPath(path: PropertyKey[]): string {
  return path.length ? path.map(String).join(".") : "<root>";
}

function formatIssues(issues: z.ZodIssue[]): string {
  return issues.map((issue) => `- ${formatPath(issue.path)}: ${issue.message}`).join("\n");
}

export function parseWatchCatalogDocument(input: unknown): WatchCatalogDocument {
  const parsed = watchCatalogDocumentSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(`Invalid watch catalog document:\n${formatIssues(parsed.error.issues)}`);
  }

  return parsed.data;
}

export function parseWatchSpec(input: unknown): WatchSpec {
  const parsed = watchSpecSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(`Invalid watch entry:\n${formatIssues(parsed.error.issues)}`);
  }

  return parsed.data;
}

export function buildWatchCatalogDocument(watches: WatchSpec[]): WatchCatalogDocument {
  return parseWatchCatalogDocument({
    version: watchCatalogDocumentVersion,
    watches
  });
}

export { watchCatalogDocumentVersion };
