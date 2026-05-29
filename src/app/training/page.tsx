import { Suspense } from "react";
import ClassScoutShell from "@/components/scout/ClassScoutShell";

export default function TrainingPage() {
  return (
    <Suspense fallback={null}>
      <ClassScoutShell />
    </Suspense>
  );
}
