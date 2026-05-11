export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatMm(value: number): string {
  return `${value.toFixed(1).replace(".0", "")} mm`;
}

export function formatHours(value: number): string {
  return `${value}h`;
}
