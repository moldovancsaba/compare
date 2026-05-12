import { serviceDomainAdapter } from "@/lib/domains/service-domain";
import { watchDomainAdapter } from "@/lib/domains/watch-domain";
import type {
  ComparisonDomain,
  ComparisonDomainAdapter,
  ComparisonDomainOption,
  ComparisonEntity,
  GenericComparisonResult
} from "@/types/comparison";

const defaultDomain = "watches";
const domainAdapters = new Map<ComparisonDomain, ComparisonDomainAdapter>([
  [watchDomainAdapter.domain, watchDomainAdapter],
  [serviceDomainAdapter.domain, serviceDomainAdapter]
]);

export type CompareInputsResult =
  | {
      status: "completed";
      domain: ComparisonDomain;
      left: ComparisonEntity;
      right: ComparisonEntity;
      comparison: GenericComparisonResult;
    }
  | {
      status: "unsupported_domain";
      domain: ComparisonDomain;
      supportedDomains: string[];
    }
  | {
      status: "unresolved_input";
      domain: ComparisonDomain;
      leftResolved: boolean;
      rightResolved: boolean;
      supportedInputs: string[];
      leftSuggestions: string[];
      rightSuggestions: string[];
    }
  | {
      status: "duplicate_entity";
      domain: ComparisonDomain;
      entity: ComparisonEntity;
    };

export function supportedComparisonDomains(): string[] {
  return Array.from(domainAdapters.keys());
}

export function supportedComparisonDomainOptions(): ComparisonDomainOption[] {
  return Array.from(domainAdapters.values()).map((adapter) => ({
    domain: adapter.domain,
    label: adapter.label,
    description: adapter.description,
    examples: adapter.examples,
    inputHints: adapter.inputHints
  }));
}

export function supportedInputsForDomain(domain: ComparisonDomain = defaultDomain): string[] {
  return domainAdapters.get(domain)?.examples ?? [];
}

export function getComparisonDomainAdapter(domain: ComparisonDomain = defaultDomain): ComparisonDomainAdapter | null {
  return domainAdapters.get(domain) ?? null;
}

export function compareInputs({
  domain = defaultDomain,
  leftInput,
  rightInput
}: {
  domain?: ComparisonDomain;
  leftInput: string;
  rightInput: string;
}): CompareInputsResult {
  const adapter = getComparisonDomainAdapter(domain);

  if (!adapter) {
    return {
      status: "unsupported_domain",
      domain,
      supportedDomains: supportedComparisonDomains()
    };
  }

  const leftResolution = adapter.resolve(leftInput);
  const rightResolution = adapter.resolve(rightInput);

  if (leftResolution.status !== "resolved" || rightResolution.status !== "resolved") {
    const leftSuggestions = leftResolution.status === "unresolved" ? (leftResolution.suggestions ?? []) : [];
    const rightSuggestions = rightResolution.status === "unresolved" ? (rightResolution.suggestions ?? []) : [];
    const supportedInputs = Array.from(new Set([...leftSuggestions, ...rightSuggestions, ...adapter.examples]));

    return {
      status: "unresolved_input",
      domain,
      leftResolved: leftResolution.status === "resolved",
      rightResolved: rightResolution.status === "resolved",
      supportedInputs,
      leftSuggestions,
      rightSuggestions
    };
  }

  const { entity: left } = leftResolution;
  const { entity: right } = rightResolution;

  if (left.id === right.id && left.domain === right.domain) {
    return {
      status: "duplicate_entity",
      domain,
      entity: left
    };
  }

  return {
    status: "completed",
    domain,
    left,
    right,
    comparison: adapter.compare(left, right)
  };
}
