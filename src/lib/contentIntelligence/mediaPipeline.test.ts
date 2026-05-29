import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { processOfficialImage, qualifyOfficialImageCandidate, validateOfficialImageCandidate } from "@/lib/contentIntelligence/mediaPipeline";

describe("media pipeline", () => {
  it("rejects invalid source URLs", () => {
    const result = validateOfficialImageCandidate({
      candidateId: "cand-1",
      sourceImageUrl: "notaurl",
      sourceDocumentUrl: "https://example.com",
      destinationEntityKind: "provider",
      requestedBy: "tester",
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("invalid_source_url");
  });

  it("processes an official image into a verified imgbb URL", async () => {
    const width = 128;
    const height = 128;
    const pixels = Buffer.alloc(width * height * 3);
    for (let index = 0; index < pixels.length; index += 3) {
      const seed = index / 3;
      pixels[index] = seed % 255;
      pixels[index + 1] = (seed * 7) % 255;
      pixels[index + 2] = (seed * 13) % 255;
    }
    const imageBytes = await sharp(pixels, { raw: { width, height, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();

    const result = await processOfficialImage(
      {
        candidateId: "cand-1",
        sourceImageUrl: "https://example.com/image.jpg",
        sourceDocumentUrl: "https://example.com",
        destinationEntityKind: "provider",
        requestedBy: "tester",
      },
      {
        fetchImpl: async () =>
          new Response(imageBytes, {
            status: 200,
            headers: { "content-type": "image/jpeg" },
          }),
        uploadImage: async () => ({ url: "https://i.ibb.co/example-upload.jpg" }),
      },
    );

    expect(result.status).toBe("ready");
    expect(result.uploadedUrl).toContain("i.ibb.co");
    expect(result.qualification?.status).toBe("accepted");
    expect(result.perceptualHash).toHaveLength(64);
  });

  it("rejects suspicious or tiny promotional assets before upload", () => {
    const result = qualifyOfficialImageCandidate(
      {
        candidateId: "cand-2",
        sourceImageUrl: "https://example.com/poster-logo.jpg",
        sourceDocumentUrl: "https://example.com/program",
        destinationEntityKind: "provider",
        requestedBy: "tester",
      },
      {
        mimeType: "image/jpeg",
        byteLength: 1024,
      },
    );

    expect(result.status).toBe("rejected");
    expect(result.findings.some((finding) => finding.code === "image_too_small")).toBe(true);
  });
});
