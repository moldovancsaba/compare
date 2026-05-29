import { notFound } from "next/navigation";
import ClassScoutShell from "@/components/scout/ClassScoutShell";
import { PUBLIC_SLUG_ROUTES } from "@/lib/scoutRoutes";

const PUBLIC_ROUTES = new Set([undefined, "", ...PUBLIC_SLUG_ROUTES]);

export default async function LocalizedHome({
  params,
}: Readonly<{ params: Promise<{ slug?: string[] }> }>) {
  const { slug } = await params;
  const requestedSlug = slug?.[0] ?? "";
  if (!PUBLIC_ROUTES.has(requestedSlug)) {
    notFound();
  }

  return <ClassScoutShell />;
}
