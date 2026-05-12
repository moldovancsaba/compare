import { serviceCatalog } from "@/lib/data/service-catalog";
import type { ServiceSpec } from "@/types/service";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, " ")
    .replace(/www\./g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

function buildSearchTerms(service: ServiceSpec): string[] {
  return [service.name, service.slug, service.category, service.pricingModel, service.targetUser, ...service.aliases].map(normalize);
}

function scoreService(input: string, service: ServiceSpec): number {
  const normalizedInput = normalize(input);
  const inputTokens = tokenize(input);
  const searchTerms = buildSearchTerms(service);

  if (!normalizedInput || inputTokens.length === 0) {
    return 0;
  }

  if (searchTerms.includes(normalizedInput)) {
    return 100 + inputTokens.length;
  }

  const searchableTokens = new Set(searchTerms.flatMap((term) => term.split(" ").filter(Boolean)));
  const matchedTokens = inputTokens.filter((token) => searchableTokens.has(token));
  const nameTokens = new Set(tokenize(service.name));
  const matchedNameTokens = inputTokens.filter((token) => nameTokens.has(token));

  return matchedTokens.length * 6 + matchedNameTokens.length * 8;
}

export function resolveService(input: string): ServiceSpec | null {
  const ranked = serviceCatalog
    .map((service) => ({
      service,
      score: scoreService(input, service)
    }))
    .sort((left, right) => right.score - left.score);

  const [best, secondBest] = ranked;

  if (!best || best.score < 16) {
    return null;
  }

  if (secondBest && best.score === secondBest.score) {
    return null;
  }

  return best.service;
}
