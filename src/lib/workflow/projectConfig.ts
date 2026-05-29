export const PROJECT_KEY = "compare" as const;
export const PRODUCT_NAME = "RangeScout EU" as const;
export const CHECKLIST_DESTINATION_KEY =
  process.env.CHECKLIST_DESTINATION_KEY?.trim() || PROJECT_KEY;
export const CHECKLIST_INTELLIGENCE_UNIT_KEY =
  process.env.CHECKLIST_INTELLIGENCE_UNIT_KEY?.trim() || "compare-range-intelligence";
export const CHECKLIST_DEFAULT_COMPANY_ID =
  process.env.CHECKLIST_DEFAULT_COMPANY_ID?.trim() || "efce8e3d-c834-4bd1-8521-ce1e97b29f7c";
export const CHECKLIST_BRIDGE_VERSION = "rangescout-checklist@v1";
export const CHECKLIST_MISSION_KEY = "compare-eu-shooting-ops";
