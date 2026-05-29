import { Suspense } from "react";
import ClassScoutShell from "@/components/scout/ClassScoutShell";

export default function NeighborhoodGuidesPage() {
  return (
    <Suspense fallback={null}>
      <ClassScoutShell />
    </Suspense>
  );
}
