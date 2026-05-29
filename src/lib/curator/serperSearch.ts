export type SerperOrganic = { title?: string; link?: string; snippet?: string };

export async function serperSearch(query: string): Promise<SerperOrganic[]> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) throw new Error("SERPER_API_KEY is not set");

  const r = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 8 }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Serper HTTP ${r.status}: ${t.slice(0, 200)}`);
  }
  const j = (await r.json()) as { organic?: SerperOrganic[] };
  return Array.isArray(j.organic) ? j.organic : [];
}
