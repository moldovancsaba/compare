import { getComparisonDomainAdapter } from "@/lib/services/compare";

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
      message: "Enter two supported names, references, or source URLs."
    };
  }

  if (normalizeInput(left) === normalizeInput(right)) {
    return {
      valid: false,
      message: "Choose two different things so the comparison surfaces meaningful tradeoffs."
    };
  }

  const adapter = getComparisonDomainAdapter();
  const leftEntity = adapter?.resolve(left);
  const rightEntity = adapter?.resolve(right);

  if (
    leftEntity?.status === "resolved" &&
    rightEntity?.status === "resolved" &&
    leftEntity.entity.id === rightEntity.entity.id &&
    leftEntity.entity.domain === rightEntity.entity.domain
  ) {
    return {
      valid: false,
      message: `Both inputs resolve to ${leftEntity.entity.label}. Choose something different for the second input.`
    };
  }

  return {
    valid: true
  };
}
