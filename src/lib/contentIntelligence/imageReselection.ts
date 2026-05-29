import type { CatalogImageUniquenessIndex } from "@/lib/contentIntelligence/catalogImageUniqueness";
import { evaluateCatalogImageUniqueness } from "@/lib/contentIntelligence/catalogImageUniqueness";
import { processOfficialImage, type ImageProcessingRequest, type UploadedImageResult } from "@/lib/contentIntelligence/mediaPipeline";

interface ImageCandidate {
  url: string;
  score: number;
}

function normalizeHost(value: string) {
  return value.toLowerCase().replace(/^www\./, "");
}

function resolveImageUrl(value: string, sourceDocumentUrl: string) {
  try {
    return new URL(value, sourceDocumentUrl).toString();
  } catch {
    return null;
  }
}

function scoreCandidate(url: string, sourceDocumentUrl: string) {
  let score = 0;
  try {
    const imageUrl = new URL(url);
    const pageUrl = new URL(sourceDocumentUrl);
    const imageHost = normalizeHost(imageUrl.hostname);
    const pageHost = normalizeHost(pageUrl.hostname);
    if (imageUrl.protocol === "https:") score += 40;
    if (imageHost === pageHost || imageHost.endsWith(`.${pageHost}`) || pageHost.endsWith(`.${imageHost}`)) score += 40;
    if (/wp-content|uploads|cdn|media|static|content/i.test(imageUrl.pathname)) score += 10;
    if (/logo|icon|avatar|favicon/i.test(url)) score -= 60;
    if (/placeholder|default|poster|flyer|newsletter/i.test(url)) score -= 40;
  } catch {
    return -1000;
  }
  return score;
}

export function extractOfficialImageCandidatesFromHtml(html: string, sourceDocumentUrl: string, currentSourceImageUrl?: string) {
  const discovered = new Map<string, ImageCandidate>();
  const add = (rawValue: string | null | undefined) => {
    const value = String(rawValue ?? "").trim();
    if (!value) return;
    const resolved = resolveImageUrl(value, sourceDocumentUrl);
    if (!resolved || resolved === currentSourceImageUrl) return;
    const score = scoreCandidate(resolved, sourceDocumentUrl);
    if (score < 10) return;
    const existing = discovered.get(resolved);
    if (!existing || score > existing.score) {
      discovered.set(resolved, { url: resolved, score });
    }
  };

  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi,
    /<img[^>]+src=["']([^"']+)["']/gi,
    /<source[^>]+srcset=["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null = null;
    while ((match = pattern.exec(html))) {
      const source = (match[1] || "").split(",")[0]?.trim().split(/\s+/)[0]?.trim();
      add(source);
    }
  }

  return [...discovered.values()].sort((left, right) => right.score - left.score).map((candidate) => candidate.url);
}

export async function findAlternateOfficialImage(input: {
  request: ImageProcessingRequest;
  entityId: string;
  index: CatalogImageUniquenessIndex;
  uploadImage: (file: Blob) => Promise<{ url: string }>;
  fetchImpl?: typeof fetch;
  hashBuffer?: (buffer: ArrayBuffer) => Promise<string> | string;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(input.request.sourceDocumentUrl, {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });
  if (!response.ok) {
    return {
      status: "no_candidate" as const,
      attempted: [],
      reason: `Source document fetch failed with status ${response.status}.`,
    };
  }

  const html = await response.text();
  const candidates = extractOfficialImageCandidatesFromHtml(html, input.request.sourceDocumentUrl, input.request.sourceImageUrl);
  const attempted: string[] = [];

  for (const candidateUrl of candidates) {
    attempted.push(candidateUrl);
    const mediaResult: UploadedImageResult = await processOfficialImage(
      {
        ...input.request,
        sourceImageUrl: candidateUrl,
      },
      {
        fetchImpl,
        uploadImage: input.uploadImage,
        hashBuffer: input.hashBuffer,
      },
    );
    if (mediaResult.status !== "ready") continue;
    const uniqueness = evaluateCatalogImageUniqueness({
      entityKind: input.request.destinationEntityKind,
      entityId: input.entityId,
      uploadedUrl: mediaResult.uploadedUrl,
      contentHash: mediaResult.contentHash,
      perceptualHash: mediaResult.perceptualHash,
      sourceImageUrl: mediaResult.originalUrl,
      index: input.index,
    });
    if (uniqueness.status === "unique") {
      return {
        status: "resolved" as const,
        mediaResult,
        attempted,
      };
    }
  }

  return {
    status: "no_candidate" as const,
    attempted,
    reason: "No alternate official image candidate passed the uniqueness gate.",
  };
}
