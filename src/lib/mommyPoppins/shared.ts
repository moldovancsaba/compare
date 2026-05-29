const DEFAULT_USER_AGENT = "RangeScoutResearchBot/1.0 (+https://rangescout.vercel.app)";

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export async function fetchText(url: string, timeoutMs = 25_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept: "text/html,application/xml,text/plain;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function stripHtml(value: string) {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function extractJsonScript(html: string, marker: string) {
  const pattern = new RegExp(`<script[^>]*${marker}[^>]*>([\\s\\S]*?)<\\/script>`, "i");
  return html.match(pattern)?.[1]?.trim() ?? null;
}

export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function extractMetaContent(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return null;
}

export function firstSentence(text: string, maxLength = 220) {
  return text.split(/(?<=[.?!])\s+/)[0]?.trim().slice(0, maxLength) ?? "";
}

export function renderMarkdownTable(rows: string[][]) {
  if (rows.length === 0) return "";
  const [header, ...body] = rows;
  const lines = [`|${header.join("|")}|`, `|${header.map(() => "---").join("|")}|`];
  for (const row of body) lines.push(`|${row.join("|")}|`);
  return `${lines.join("\n")}\n`;
}
