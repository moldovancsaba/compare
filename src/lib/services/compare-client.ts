import type { GenericComparisonResult } from "@/types/comparison";
import type { BrainState } from "@/types/watch";

const GENERIC_COMPARE_ERROR = "The comparison request failed. Try again.";

export interface ComparisonResponse {
  comparison: GenericComparisonResult;
  brain: BrainState;
  savedComparison?: {
    publicSlug: string;
    path: string;
    persisted: boolean;
  };
}

export interface ComparisonErrorResponse {
  error: string;
  supportedInputs?: string[];
}

export type ComparisonClientResult = ComparisonResponse | ComparisonErrorResponse;

type FetchCompare = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isErrorPayload(value: unknown): value is ComparisonErrorResponse {
  return isRecord(value) && typeof value.error === "string";
}

function isComparisonPayload(value: unknown): value is ComparisonResponse {
  return isRecord(value) && isRecord(value.comparison) && isRecord(value.brain);
}

async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function readComparisonResponse(response: Response): Promise<ComparisonClientResult> {
  const payload = await readJsonSafely(response);

  if (!response.ok) {
    const supportedInputs = isRecord(payload) && isStringArray(payload.supportedInputs) ? payload.supportedInputs : undefined;

    return {
      error: isErrorPayload(payload) ? payload.error : GENERIC_COMPARE_ERROR,
      ...(supportedInputs ? { supportedInputs } : {})
    };
  }

  if (isErrorPayload(payload)) {
    return payload;
  }

  if (!isComparisonPayload(payload)) {
    return {
      error: GENERIC_COMPARE_ERROR
    };
  }

  return payload;
}

export async function requestComparison(
  leftInput: string,
  rightInput: string,
  fetchCompare: FetchCompare = fetch
): Promise<ComparisonClientResult> {
  try {
    const response = await fetchCompare("/api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        leftInput,
        rightInput
      })
    });

    return readComparisonResponse(response);
  } catch {
    return {
      error: GENERIC_COMPARE_ERROR
    };
  }
}
