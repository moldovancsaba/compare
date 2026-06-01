const MAX_BYTES = 450_000;
const MAX_CHARS = 28_000;

function sameSiteHostname(pageUrl: string, allowedHost: string): boolean {
  let host: string;
  try {
    host = new URL(pageUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }
  const allow = allowedHost.toLowerCase().replace(/^www\./, "");
  return host === allow || host.endsWith(`.${allow}`);
}

/** Fetch HTML from `url` only if its host matches `allowedHost` (anti-SSRF). */
export async function fetchPageText(url: string, allowedHost: string): Promise<{ text: string; ogImage?: string }> {
  if (!url.startsWith("https://")) throw new Error("only https URLs");
  try {
    void new URL(url);
  } catch {
    throw new Error("invalid URL");
  }
  if (!sameSiteHostname(url, allowedHost)) throw new Error("host mismatch");

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25_000);
  const r = await fetch(url, {
    signal: ctrl.signal,
    headers: {
      "User-Agent": "CompareCuratorBot/1.0",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });
  clearTimeout(t);
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  const buf = await r.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) throw new Error("page too large");
  const raw = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  const og =
    raw.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
    raw.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i)?.[1];
  const firstImage = raw.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  const imageCandidate = og || firstImage;
  const absoluteImageCandidate = imageCandidate
    ? new URL(imageCandidate, url).toString()
    : undefined;
  const stripped = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    text: stripped.slice(0, MAX_CHARS),
    ogImage: absoluteImageCandidate?.startsWith("https://") ? absoluteImageCandidate : undefined,
  };
}
