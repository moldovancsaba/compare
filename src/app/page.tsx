import { Suspense } from "react";
import ClassScoutShell from "@/components/scout/ClassScoutShell";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <ClassScoutShell />
    </Suspense>
  );
}
