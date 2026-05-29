"use client";

import { useState } from "react";
import { GdsProvider } from "@doneisbetter/gds-theme/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { classScoutTheme } from "@/theme/mantineTheme";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GdsProvider theme={classScoutTheme} defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </GdsProvider>
  );
}
