"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/lib/data";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <NuqsAdapter>
        <DataProvider>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </DataProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
