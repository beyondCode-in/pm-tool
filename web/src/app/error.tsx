"use client";

import { ErrorState } from "@/components/brand/states";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <ErrorState title="Something broke on this page" message={`${error.message || "An unexpected error happened."} Your work on GitHub is safe.`} onRetry={reset} />
    </main>
  );
}
