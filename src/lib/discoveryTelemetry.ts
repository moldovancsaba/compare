import { discoveryFeatureFlags } from "@/lib/discoveryConfig";
import type { QueryDiagnostics } from "@/lib/providerQuery";

export function emitDiscoveryTelemetry(diagnostics: QueryDiagnostics) {
  if (typeof window === "undefined") return;
  const payload = {
    ...diagnostics,
    recordedAt: new Date().toISOString(),
  };
  window.dispatchEvent(new CustomEvent("classscout:discover-query", { detail: payload }));
  if (discoveryFeatureFlags.debugTelemetry || process.env.NODE_ENV !== "production") {
    // Non-blocking structured diagnostics until a dedicated analytics sink is added.
    console.info("[classscout:discover-query]", payload);
  }
}
