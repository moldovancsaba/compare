import { resolveWatch } from "@/lib/utils/resolve-watch";

export type ComparisonInputValidation =
  | {
      valid: true;
    }
  | {
      valid: false;
      message: string;
    };

function normalizeInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, " ")
    .replace(/www\./g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function validateComparisonInputs(leftInput: string, rightInput: string): ComparisonInputValidation {
  const left = leftInput.trim();
  const right = rightInput.trim();

  if (left.length < 2 || right.length < 2) {
    return {
      valid: false,
      message: "Enter two supported watch names or catalog URLs."
    };
  }

  if (normalizeInput(left) === normalizeInput(right)) {
    return {
      valid: false,
      message: "Choose two different watches so the comparison surfaces meaningful tradeoffs."
    };
  }

  const leftWatch = resolveWatch(left);
  const rightWatch = resolveWatch(right);

  if (leftWatch && rightWatch && leftWatch.id === rightWatch.id) {
    return {
      valid: false,
      message: `Both inputs resolve to ${leftWatch.brand} ${leftWatch.model}. Choose a different second watch.`
    };
  }

  return {
    valid: true
  };
}
