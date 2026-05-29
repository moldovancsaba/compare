import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const curatedPayloadQuality = require("../../../scripts/lib/curated-payload-quality.cjs") as {
  checkPayloadQuality: (payload: unknown, options?: { label?: string }) => string[];
};

export function checkCuratedPayloadQuality(payload: unknown, options?: { label?: string }) {
  return curatedPayloadQuality.checkPayloadQuality(payload, options);
}
