import { Suspense } from "react";
import ClassScoutShell from "@/components/scout/ClassScoutShell";

export default function ClubsPage() {
  return (
    <Suspense fallback={null}>
      <ClassScoutShell />
    </Suspense>
  );
}
