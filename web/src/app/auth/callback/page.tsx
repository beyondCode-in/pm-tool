"use client";

import { Button } from "@/components/ui/button";
import { finishLogin } from "@/lib/auth";
import { config } from "@/lib/config";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Callback() {
  const [error, setError] = useState<string | null>(null);
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    finishLogin(new URLSearchParams(window.location.search))
      // Full reload so the data layer starts with the new token.
      .then(() => window.location.replace(`${config.basePath}/my-work/`))
      .catch((e: Error) => setError(e.message));
  }, []);
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      {error ? (
        <div className="max-w-sm space-y-3">
          <p className="text-lg font-semibold">Sign-in didn&apos;t work</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button render={<a href={`${config.basePath}/login/`} />}>Back to sign in</Button>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" />Signing you in…</p>
      )}
    </main>
  );
}
