import type { CapabilityAuditFinding, MommyPoppinsCapabilityAuditReport } from "@/lib/mommyPoppins/types";
import { fetchText, firstSentence, slugify, stripHtml } from "@/lib/mommyPoppins/shared";

type SourcePage = {
  key: CapabilityAuditFinding["sourceSurface"];
  url: string;
  html: string;
  text: string;
};

type CapabilitySeed = Omit<CapabilityAuditFinding, "capabilityId" | "recordedAt" | "recommendation" | "scores"> & {
  scores: Omit<CapabilityAuditFinding["scores"], "classScoutGap" | "total">;
};

const SOURCE_URLS: Array<{ key: CapabilityAuditFinding["sourceSurface"]; url: string }> = [
  { key: "navigation", url: "https://mommypoppins.com/" },
  { key: "events", url: "https://mommypoppins.com/events/1670/anywhere/all/tag/all/age/all/all/all/type/0/deals/0/near/all" },
  { key: "directory", url: "https://mommypoppins.com/directory/1670/anywhere/all/type/all/age/0/deals/all" },
  { key: "find", url: "https://mommypoppins.com/find/1670/anywhere/all/cat/all/age/all" },
  { key: "submission", url: "https://mommypoppins.com/mommy-poppins-business-listings" },
];

function compareRecommendation(total: number): CapabilityAuditFinding["recommendation"] {
  if (total >= 0.75) return "adopt";
  if (total >= 0.5) return "maybe";
  return "skip";
}

function determineClassScoutGap(classScoutEquivalent: string | null, gapStatus: CapabilityAuditFinding["gapStatus"]) {
  if (gapStatus === "missing") return 1;
  if (gapStatus === "partial") return 0.65;
  return 0.2;
}

function buildFinding(seed: CapabilitySeed): CapabilityAuditFinding {
  const total =
    seed.scores.userValue * 0.4 +
    determineClassScoutGap(seed.classScoutEquivalent, seed.gapStatus) * 0.25 +
    seed.scores.deliveryFit * 0.2 +
    seed.scores.operationalSafety * 0.15;
  return {
    ...seed,
    capabilityId: slugify(seed.capabilityName),
    recordedAt: new Date().toISOString(),
    recommendation: compareRecommendation(total),
    scores: {
      ...seed.scores,
      classScoutGap: determineClassScoutGap(seed.classScoutEquivalent, seed.gapStatus),
      total: Number(total.toFixed(4)),
    },
  };
}

function detectCapabilities(pages: SourcePage[]) {
  const pageByKey = new Map(pages.map((page) => [page.key, page]));
  const navigation = pageByKey.get("navigation");
  const events = pageByKey.get("events");
  const directory = pageByKey.get("directory");
  const find = pageByKey.get("find");
  const submission = pageByKey.get("submission");
  const findings: CapabilityAuditFinding[] = [];

  if (events?.html.includes("datebar-calendar-modal")) {
    findings.push(
      buildFinding({
        sourceUrl: events.url,
        sourceSurface: "events",
        capabilityName: "Date-first event browsing",
        observedBehavior: "Mommy Poppins exposes an event date bar with forward date browsing and calendar pickers for event discovery.",
        classScoutEquivalent: "ClassScout has `This Week` and upcoming rendering but not a first-class date-bar event browser.",
        gapStatus: "missing",
        recommendationReason: "High family-discovery value with bounded implementation scope if built as a GDS-compliant public browse extension.",
        implementationScope: "medium",
        gdsImpact: "new_public_surface",
        accessibilityRisk: "medium",
        sourceEvidence: ["datebar", "calendar modal", "date-button"],
        scores: { userValue: 0.9, deliveryFit: 0.7, operationalSafety: 0.8 },
      }),
    );
  }

  if (events?.html.includes("/type/1/") && events.html.includes("/free/0/")) {
    findings.push(
      buildFinding({
        sourceUrl: events.url,
        sourceSurface: "events",
        capabilityName: "Event deals and free filters",
        observedBehavior: "Mommy Poppins exposes explicit route-level filters for free events and deals inside the calendar surface.",
        classScoutEquivalent: "ClassScout does not expose price-sensitive event filters as a first-class discovery control.",
        gapStatus: "missing",
        recommendationReason: "Useful for parent planning, but should only land after a real event surface exists.",
        implementationScope: "medium",
        gdsImpact: "surface_extension",
        accessibilityRisk: "low",
        sourceEvidence: ["/type/1/", "/free/0/"],
        scores: { userValue: 0.8, deliveryFit: 0.55, operationalSafety: 0.75 },
      }),
    );
  }

  if (directory?.html.includes("map_markers") || directory?.html.includes("parachute_location")) {
    findings.push(
      buildFinding({
        sourceUrl: directory.url,
        sourceSurface: "directory",
        capabilityName: "Map-backed directory discovery",
        observedBehavior: "Mommy Poppins directory pages ship map-marker payloads for browseable business discovery.",
        classScoutEquivalent: "ClassScout has provider map support inside profiles, but not map-first directory discovery.",
        gapStatus: "partial",
        recommendationReason: "Potentially useful, but lower priority than event/date browsing because ClassScout already has limited map support.",
        implementationScope: "large",
        gdsImpact: "new_public_surface",
        accessibilityRisk: "high",
        sourceEvidence: ["map_markers", "parachute_location.png"],
        scores: { userValue: 0.65, deliveryFit: 0.35, operationalSafety: 0.55 },
      }),
    );
  }

  if (submission?.text.includes("Get Listed") || submission?.html.includes("business-listings")) {
    findings.push(
      buildFinding({
        sourceUrl: submission.url,
        sourceSurface: "submission",
        capabilityName: "Structured provider self-submission funnel",
        observedBehavior: firstSentence(submission.text, 260) || "Mommy Poppins exposes business-listing/self-submission entry points for providers.",
        classScoutEquivalent: "ClassScout has ingest/admin tooling but no public provider self-submission funnel.",
        gapStatus: "missing",
        recommendationReason: "Operationally valuable for future supply growth, but only after moderation and quality gates are explicit.",
        implementationScope: "large",
        gdsImpact: "new_public_surface",
        accessibilityRisk: "medium",
        sourceEvidence: ["Get Listed", "business listings"],
        scores: { userValue: 0.7, deliveryFit: 0.45, operationalSafety: 0.6 },
      }),
    );
  }

  if (find?.html.includes("pager__item") && find.html.includes("filtersforsearchingarticles")) {
    findings.push(
      buildFinding({
        sourceUrl: find.url,
        sourceSurface: "find",
        capabilityName: "Editorial-to-discovery article search",
        observedBehavior: "Mommy Poppins provides a dedicated article/search surface with paged discovery and filtered guides.",
        classScoutEquivalent: "ClassScout has neighborhood-guide pages but not a dedicated editorial search surface.",
        gapStatus: "partial",
        recommendationReason: "Useful once ClassScout accumulates enough editorial volume; not a near-term priority over catalog operations.",
        implementationScope: "large",
        gdsImpact: "new_public_surface",
        accessibilityRisk: "medium",
        sourceEvidence: ["filtersforsearchingarticles", "pager__item"],
        scores: { userValue: 0.45, deliveryFit: 0.3, operationalSafety: 0.7 },
      }),
    );
  }

  if (navigation?.html.includes("searchurls") && navigation.html.includes("regionMap")) {
    findings.push(
      buildFinding({
        sourceUrl: navigation.url,
        sourceSurface: "navigation",
        capabilityName: "Structured route taxonomy for search surfaces",
        observedBehavior: "Mommy Poppins publishes explicit route-level search targets and region maps in client-side settings.",
        classScoutEquivalent: "ClassScout has discovery feature flags and scarcity targets but not a documented route-taxonomy contract for external source capture.",
        gapStatus: "missing",
        recommendationReason: "Useful mainly as an internal data/operations idea, not a direct end-user feature.",
        implementationScope: "small",
        gdsImpact: "none",
        accessibilityRisk: "low",
        sourceEvidence: ["searchurls", "regionMap"],
        scores: { userValue: 0.35, deliveryFit: 0.9, operationalSafety: 0.95 },
      }),
    );
  }

  return findings.sort((a, b) => b.scores.total - a.scores.total || a.capabilityName.localeCompare(b.capabilityName));
}

export async function buildMommyPoppinsCapabilityAudit(): Promise<MommyPoppinsCapabilityAuditReport> {
  const pages = await Promise.all(
    SOURCE_URLS.map(async ({ key, url }) => {
      const html = await fetchText(url);
      return { key, url, html, text: stripHtml(html) };
    }),
  );

  return {
    generatedAt: new Date().toISOString(),
    findings: detectCapabilities(pages),
  };
}

export function renderCapabilityAuditMarkdown(report: MommyPoppinsCapabilityAuditReport) {
  const lines: string[] = [];
  lines.push("# Mommy Poppins Capability Audit");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Recommended shortlist");
  for (const [index, finding] of report.findings.entries()) {
    lines.push(`${index + 1}. ${finding.capabilityName} — ${finding.recommendation.toUpperCase()}`);
    lines.push(`   Source: ${finding.sourceSurface} (${finding.sourceUrl})`);
    lines.push(`   Gap: ${finding.gapStatus}`);
    lines.push(`   Scope: ${finding.implementationScope}`);
    lines.push(`   Why: ${finding.recommendationReason}`);
  }

  lines.push("");
  lines.push("## Full findings");
  for (const finding of report.findings) {
    lines.push(`### ${finding.capabilityName}`);
    lines.push(`- Recommendation: ${finding.recommendation}`);
    lines.push(`- Gap status: ${finding.gapStatus}`);
    lines.push(`- ClassScout equivalent: ${finding.classScoutEquivalent ?? "(none)"}`);
    lines.push(`- Observed behavior: ${finding.observedBehavior}`);
    lines.push(`- Scores: user=${finding.scores.userValue.toFixed(2)}, gap=${finding.scores.classScoutGap.toFixed(2)}, delivery=${finding.scores.deliveryFit.toFixed(2)}, ops=${finding.scores.operationalSafety.toFixed(2)}, total=${finding.scores.total.toFixed(2)}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
