/**
 * Turn stored provider/meetup image strings into a usable absolute https URL
 * for <img src>. Handles protocol-relative URLs, http→https, and paths relative
 * to the venue website (common in CMS / og:image).
 */
export function resolveImageUrl(raw?: string | null, baseWebsite?: string | null): string | undefined {
  const s = raw?.trim();
  if (!s) return undefined;

  if (/^(data:|blob:)/i.test(s)) return s;

  if (s.startsWith("//")) return `https:${s}`;

  if (s.startsWith("https://")) return s;

  if (s.startsWith("http://")) return `https://${s.slice("http://".length)}`;

  if (s.startsWith("/")) {
    const base = baseWebsite?.trim();
    if (!base) return s;
    const origin = /^https?:\/\//i.test(base) ? base : `https://${base}`;
    try {
      return new URL(s, origin).href;
    } catch {
      return undefined;
    }
  }

  if (/^www\./i.test(s)) {
    return `https://${s}`;
  }

  const base = baseWebsite?.trim();
  if (!base) return undefined;

  const looksPathLike =
    s.includes("/") ||
    s.startsWith("./") ||
    s.startsWith("../") ||
    /\.(jpe?g|png|gif|webp|svg|avif|ico)(\?[^/]*)?(#.*)?$/i.test(s);

  if (looksPathLike) {
    const origin = /^https?:\/\//i.test(base) ? base : `https://${base}`;
    try {
      return new URL(s, origin).href;
    } catch {
      return undefined;
    }
  }

  return undefined;
}
