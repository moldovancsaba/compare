import type { Category } from "@/types/provider";

export const CATEGORY_DISPLAY_LABELS: Record<Category, string> = {
  Classes: "Training",
  Camps: "Ranges",
  "Competitions": "Competitions",
  "Drop-In Activities": "Hunting & Outdoor",
};

export function formatCategoryLabel(category: Category | string | null | undefined) {
  if (!category) return "";
  return CATEGORY_DISPLAY_LABELS[category as Category] ?? String(category);
}
