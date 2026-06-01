import { NEIGHBORHOODS } from "@/data/locations";
import {
  CURATOR_BADGES,
  CURATOR_BOROUGHS,
  CURATOR_CATEGORIES,
  CURATOR_AGE_RANGES,
  CURATOR_DAY_TAGS,
} from "@/lib/curator/constants";
import { curatedProviderSchema, type CuratedProvider } from "@/lib/curator/providerSchema";
import { isImgBbHttpsImageUrl } from "@/lib/imgbbUrl";

type LlmOut = { skip?: boolean; reason?: string; provider?: unknown };

function buildSystemPrompt(): string {
  const hoods = JSON.stringify(NEIGHBORHOODS, null, 0);
  return `You are a careful data curator for Compare, a Hungary-first sport shooting and hunting directory.

Your job: decide if the page describes ONE concrete sport shooting provider, event, or organizer-facing listing in an official source context (competition host, range, club, course, hunting ground, training venue, or related federation page). If not, return {"skip":true,"reason":"..."}.

Rules:
- ONLY output JSON. No markdown.
- If skip is false, include key "provider" with a single object matching the Compare provider schema EXACTLY.
- Reject directory hubs, generic portals, social profiles without organizer details, and unrelated commercial pages.
- Never invent prices, hours, addresses, or phone numbers. Use only facts supported by the PAGE TEXT and SOURCE URL.
- If a field is unknown, use sensible empties: email may be "". image must be "" unless you have an **https ImgBB** direct image URL (see project rules); never put a venue CDN URL in image. rating 0 and reviewCount 0 unless explicit ratings appear in the text.
- pricePerClass: if a fee is stated, prefer the clearest single fee from source text. If only a range is provided, pick the lower bound and mention uncertainty in longDescription.
- id MUST match ^prov-[a-z0-9-]+$ (lowercase slug, unique), e.g. prov-cmom-visit.
- category MUST be one of: ${CURATOR_CATEGORIES.join(", ")}
- borough MUST be one of: ${CURATOR_BOROUGHS.join(", ")}.
- neighborhood MUST be one of the canonical neighborhoods for that borough in this JSON (pick closest match): ${hoods}
- ageRanges: each entry one of: ${CURATOR_AGE_RANGES.join(", ")}
- dayTimeTags: each entry one of: ${CURATOR_DAY_TAGS.join(", ")}
- Include Weekend only if the page explicitly supports Saturday/Sunday availability.
- Include Morning, Afternoon, or Evening when the source text supports those time windows.
- badges: subset of: ${CURATOR_BADGES.join(", ")} (0-3 items, do not spam).
- Weekend Friendly is allowed only when Weekend is supported by the same provider page.
- website: official https URL for the venue (prefer the source page origin if it is the official site).
- galleryImages: only include if every URL is an accepted ImgBB-hosted https URL; otherwise omit.
- If the page publishes a repeating weekly / monthly / weekday / weekend schedule, store it in recurringPrograms instead of prose alone.
- longDescription MUST end with a line: Sources: <source url>
- If you cannot satisfy the schema truthfully, return {"skip":true,"reason":"..."} instead of guessing.`;
}

export async function extractProviderWithLlm(args: {
  sourceUrl: string;
  pageText: string;
  ogImage?: string;
}): Promise<{ ok: true; provider: CuratedProvider } | { ok: false; reason: string }> {
  const key = process.env.CURATOR_OPENAI_API_KEY?.trim();
  if (!key) return { ok: false, reason: "CURATOR_OPENAI_API_KEY not set" };

  const base = (process.env.CURATOR_OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.CURATOR_OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const user = `SOURCE_URL: ${args.sourceUrl}
OG_IMAGE_HINT: ${args.ogImage || "(none)"}

PAGE_TEXT:
${args.pageText}`;

  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: user },
      ],
    }),
  });

  if (!r.ok) {
    const t = await r.text();
    return { ok: false, reason: `OpenAI HTTP ${r.status}: ${t.slice(0, 300)}` };
  }

  const j = (await r.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = j.choices?.[0]?.message?.content;
  if (!content) return { ok: false, reason: "empty LLM response" };

  let parsed: LlmOut;
  try {
    parsed = JSON.parse(content) as LlmOut;
  } catch {
    return { ok: false, reason: "LLM returned non-JSON" };
  }

  if (parsed.skip) {
    return { ok: false, reason: typeof parsed.reason === "string" ? parsed.reason : "skipped" };
  }

  const prov = parsed.provider;
  const z = curatedProviderSchema.safeParse(prov);
  if (!z.success) {
    return { ok: false, reason: `schema: ${z.error.errors.map((e) => e.path.join(".") + ":" + e.message).join("; ")}` };
  }

  let out = z.data;
  if ((!out.image || !out.image.trim()) && args.ogImage?.startsWith("https://") && isImgBbHttpsImageUrl(args.ogImage)) {
    out = { ...out, image: args.ogImage };
  }

  const z2 = curatedProviderSchema.safeParse(out);
  if (!z2.success) {
    return { ok: false, reason: `schema after og:image: ${z2.error.message}` };
  }
  return { ok: true, provider: z2.data };
}
