import { notFound } from "next/navigation";
import ClassScoutShell from "@/components/scout/ClassScoutShell";

const PUBLIC_ROUTES = new Set([
  undefined,
  "",
  "classes",
  "class",
  "ranges",
  "range",
  "competitions",
  "hunting-grounds",
  "this-week",
  "clubs",
  "meet-up-groups",
  "saved",
  "calculator",
  "neighborhood-guides",
  "my-account",
]);

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
