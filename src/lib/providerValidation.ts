import type { Provider } from "@/types/provider";
import { curatedProviderSchema } from "@/lib/curator/providerSchema";

export function validateProviderDocument(doc: Provider | Partial<Provider>): string | null {
  const parsed = curatedProviderSchema.safeParse(doc);
  if (parsed.success) return null;
  return parsed.error.issues[0]?.message ?? "Invalid provider document";
}
