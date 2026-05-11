import type { BrainState, ComparisonResult } from "@/types/watch";

const GENERIC_COMPARE_ERROR = "The comparison request failed. Try again.";

export interface ComparisonResponse {
  comparison: ComparisonResult;
  brain: BrainState;
}

export type ComparisonClientResult = ComparisonResponse | { error: string };

type FetchCompare = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isErrorPayload(value: unknown): value is { error: string } {
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
    return {
      error: isErrorPayload(payload) ? payload.error : GENERIC_COMPARE_ERROR
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
