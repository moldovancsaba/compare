import { createPublicBrandTheme } from "@doneisbetter/gds-theme/server";

// ClassScout uses the official GDS brand-theme composer instead of a local
// theme fork so spacing, radii, and tokens stay aligned with shipped GDS lanes.
export const classScoutTheme = createPublicBrandTheme({
  flatSurfaces: true,
});
