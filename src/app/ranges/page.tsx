import { Suspense } from "react";
import ClassScoutShell from "@/components/scout/ClassScoutShell";

export default function RangesPage() {
  return (
    <Suspense fallback={null}>
      <ClassScoutShell />
    </Suspense>
  );
}
