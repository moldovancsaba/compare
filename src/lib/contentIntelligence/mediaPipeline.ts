import { isImgBbHttpsImageUrl } from "@/lib/imgbbUrl";
import sharp from "sharp";

export interface ImageProcessingRequest {
  candidateId: string;
  sourceImageUrl: string;
  sourceDocumentUrl: string;
  destinationEntityKind: "provider" | "meetupGroup";
  requestedBy: string;
}

export interface ImageQualificationResult {
  status: "accepted" | "weak" | "rejected" | "upload_failed";
  originalUrl: string;
  uploadedUrl?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  provenance: "official" | "authoritative" | "unknown";
  findings: MediaDiagnostic[];
}

export interface MediaDiagnostic {
  code: string;
  severity: "warning" | "error";
  message: string;
  retryable: boolean;
  remediationHint: string;
}

export interface UploadedImageResult {
  candidateId: string;
  originalUrl: string;
  sourceDocumentUrl: string;
  uploadedUrl: string;
  uploadedAt: string;
  mimeType: string;
  contentHash: string;
  perceptualHash: string;
  width?: number;
  height?: number;
  uploadAttemptCount: number;
  status: "ready" | "failed";
  diagnostics: MediaDiagnostic[];
  qualification?: ImageQualificationResult;
}

async function inspectRasterImage(arrayBuffer: ArrayBuffer) {
  const image = sharp(Buffer.from(arrayBuffer), { failOn: "none" });
  const resized = await image
    .clone()
    .grayscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer();

  let perceptualHash = "";
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const left = resized[row * 9 + column] ?? 0;
      const right = resized[row * 9 + column + 1] ?? 0;
      perceptualHash += left > right ? "1" : "0";
    }
  }

  const metadata = await image.metadata();
  return {
    perceptualHash,
    width: metadata.width,
    height: metadata.height,
  };
}

function normalizeHost(value: string) {
  return value.toLowerCase().replace(/^www\./, "");
}

function classifyProvenance(input: ImageProcessingRequest) {
  try {
    const imageHost = normalizeHost(new URL(input.sourceImageUrl).hostname);
    const documentHost = normalizeHost(new URL(input.sourceDocumentUrl).hostname);
    if (imageHost === documentHost || imageHost.endsWith(`.${documentHost}`) || documentHost.endsWith(`.${imageHost}`)) {
      return "official" as const;
    }
    if (
      imageHost.endsWith(".org") ||
      imageHost.endsWith(".gov") ||
      imageHost.endsWith(".nyc") ||
      imageHost.includes("cdn") ||
      imageHost.includes("static")
    ) {
      return "authoritative" as const;
    }
  } catch {
    return "unknown" as const;
  }
  return "unknown" as const;
}

export function validateOfficialImageCandidate(input: ImageProcessingRequest) {
  const diagnostics: MediaDiagnostic[] = [];
  let parsed: URL | null = null;

  try {
    parsed = new URL(input.sourceImageUrl);
  } catch {
    diagnostics.push({
      code: "invalid_source_url",
      severity: "error",
      message: "The source image URL is invalid.",
      retryable: false,
      remediationHint: "Use a valid official HTTPS image URL.",
    });
  }

  if (parsed && parsed.protocol !== "https:") {
    diagnostics.push({
      code: "non_https_source",
      severity: "error",
      message: "The source image URL must use HTTPS.",
      retryable: false,
      remediationHint: "Find an HTTPS image on the official source.",
    });
  }

  const provenance = classifyProvenance(input);
  if (provenance === "unknown") {
    diagnostics.push({
      code: "unknown_image_provenance",
      severity: "warning",
      message: "The image host does not clearly match the official source host.",
      retryable: false,
      remediationHint: "Prefer an image hosted on the official provider or venue domain.",
    });
  }

  return { ok: diagnostics.length === 0, diagnostics };
}

export function qualifyOfficialImageCandidate(
  input: ImageProcessingRequest,
  fetched: { mimeType: string; byteLength: number },
): ImageQualificationResult {
  const provenance = classifyProvenance(input);
  const findings: MediaDiagnostic[] = [];
  const loweredUrl = input.sourceImageUrl.toLowerCase();

  if (!fetched.mimeType.startsWith("image/")) {
    findings.push({
      code: "non_raster_mime",
      severity: "error",
      message: "The fetched asset is not a raster image.",
      retryable: false,
      remediationHint: "Use an official JPG, PNG, WEBP, or similar raster image URL.",
    });
  }

  if (fetched.byteLength < 4096) {
    findings.push({
      code: "image_too_small",
      severity: "error",
      message: "The fetched image is too small to trust as a production card asset.",
      retryable: false,
      remediationHint: "Choose a larger official photo with better visual detail.",
    });
  }

  if (/\b(screenshot|poster|flyer)\b/.test(loweredUrl)) {
    findings.push({
      code: "suspicious_promotional_asset",
      severity: "error",
      message: "The image URL strongly suggests a screenshot, poster, or flyer instead of a quality activity photo.",
      retryable: false,
      remediationHint: "Prefer a real class or activity photo from the official source.",
    });
  }

  if (/\b(logo)\b/.test(loweredUrl)) {
    findings.push({
      code: "logo_only_signal",
      severity: "warning",
      message: "The image URL suggests a logo asset, which is a weak fallback for discovery cards.",
      retryable: false,
      remediationHint: "Prefer a real activity image whenever the official source provides one.",
    });
  }

  if (provenance === "unknown") {
    findings.push({
      code: "weak_provenance",
      severity: "warning",
      message: "The image provenance is not clearly official.",
      retryable: false,
      remediationHint: "Prefer an official provider or venue-hosted image.",
    });
  }

  const hardFailures = findings.filter((finding) => finding.severity === "error");
  return {
    status: hardFailures.length > 0 ? "rejected" : findings.length > 0 ? "weak" : "accepted",
    originalUrl: input.sourceImageUrl,
    mimeType: fetched.mimeType,
    provenance,
    findings,
  };
}

export async function processOfficialImage(
  input: ImageProcessingRequest,
  deps: {
    fetchImpl?: typeof fetch;
    uploadImage: (file: Blob) => Promise<{ url: string }>;
    hashBuffer?: (buffer: ArrayBuffer) => Promise<string> | string;
  },
): Promise<UploadedImageResult> {
  const validation = validateOfficialImageCandidate(input);
  if (!validation.ok) {
    return {
      candidateId: input.candidateId,
      originalUrl: input.sourceImageUrl,
      sourceDocumentUrl: input.sourceDocumentUrl,
      uploadedUrl: "",
      uploadedAt: new Date().toISOString(),
      mimeType: "",
      contentHash: "",
      perceptualHash: "",
      uploadAttemptCount: 0,
      status: "failed",
      diagnostics: validation.diagnostics,
      qualification: {
        status: "rejected",
        originalUrl: input.sourceImageUrl,
        provenance: classifyProvenance(input),
        findings: validation.diagnostics,
      },
    };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const response = await fetchImpl(input.sourceImageUrl);
  if (!response.ok) {
    return {
      candidateId: input.candidateId,
      originalUrl: input.sourceImageUrl,
      sourceDocumentUrl: input.sourceDocumentUrl,
      uploadedUrl: "",
      uploadedAt: new Date().toISOString(),
      mimeType: "",
      contentHash: "",
      perceptualHash: "",
      uploadAttemptCount: 1,
      status: "failed",
      diagnostics: [
        {
          code: "image_fetch_failed",
          severity: "error",
          message: `Official image download failed with status ${response.status}.`,
          retryable: response.status >= 500,
          remediationHint: "Retry if the source is temporarily unavailable or choose another official image.",
        },
      ],
      qualification: {
        status: "upload_failed",
        originalUrl: input.sourceImageUrl,
        provenance: classifyProvenance(input),
        findings: [
          {
            code: "image_fetch_failed",
            severity: "error",
            message: `Official image download failed with status ${response.status}.`,
            retryable: response.status >= 500,
            remediationHint: "Retry if the source is temporarily unavailable or choose another official image.",
          },
        ],
      },
    };
  }

  const mimeType = response.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  const qualification = qualifyOfficialImageCandidate(input, {
    mimeType,
    byteLength: arrayBuffer.byteLength,
  });
  if (qualification.status === "rejected") {
    return {
      candidateId: input.candidateId,
      originalUrl: input.sourceImageUrl,
      sourceDocumentUrl: input.sourceDocumentUrl,
      uploadedUrl: "",
      uploadedAt: new Date().toISOString(),
      mimeType,
      contentHash: "",
      perceptualHash: "",
      uploadAttemptCount: 1,
      status: "failed",
      diagnostics: qualification.findings,
      qualification,
    };
  }

  const blob = new Blob([arrayBuffer], { type: mimeType });
  const uploaded = await deps.uploadImage(blob);
  const uploadedUrl = uploaded.url;

  if (!isImgBbHttpsImageUrl(uploadedUrl)) {
    return {
      candidateId: input.candidateId,
      originalUrl: input.sourceImageUrl,
      sourceDocumentUrl: input.sourceDocumentUrl,
      uploadedUrl,
      uploadedAt: new Date().toISOString(),
      mimeType,
      contentHash: "",
      perceptualHash: "",
      uploadAttemptCount: 1,
      status: "failed",
      diagnostics: [
        {
          code: "invalid_uploaded_url",
          severity: "error",
          message: "The uploaded image URL is not a valid HTTPS ImgBB URL.",
          retryable: false,
          remediationHint: "Use the compare upload path that returns canonical ImgBB URLs.",
        },
      ],
      qualification: {
        ...qualification,
        status: "upload_failed",
        uploadedUrl,
      },
    };
  }

  const contentHash = deps.hashBuffer
    ? await deps.hashBuffer(arrayBuffer)
    : `bytes-${arrayBuffer.byteLength}`;
  const imageMetadata = await inspectRasterImage(arrayBuffer);

  return {
    candidateId: input.candidateId,
    originalUrl: input.sourceImageUrl,
    sourceDocumentUrl: input.sourceDocumentUrl,
    uploadedUrl,
    uploadedAt: new Date().toISOString(),
    mimeType,
    contentHash,
    perceptualHash: imageMetadata.perceptualHash,
    width: imageMetadata.width,
    height: imageMetadata.height,
    uploadAttemptCount: 1,
    status: "ready",
    diagnostics: qualification.findings,
    qualification: {
      ...qualification,
      uploadedUrl,
    },
  };
}
