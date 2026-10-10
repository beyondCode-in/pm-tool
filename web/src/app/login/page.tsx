"use client";

import { Button } from "@/components/ui/button";
import { setToken, startDemo, startLogin } from "@/lib/auth";
import { config, oauthEnabled } from "@/lib/config";
import { ArrowRight, KeyRound, Sparkles } from "lucide-react";

const GitHubMark = () => (
  <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>
);
import { useState } from "react";

const go = (path: string) => window.location.assign(`${config.basePath}${path}`);

export default function Login() {
  const [token, setTokenValue] = useState("");
  const [showToken, setShowToken] = useState(!oauthEnabled);
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-4">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg">B</span>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to BeyondPM</h1>
          <p className="mt-2 text-muted-foreground">Ask for things, plan work and see progress, all on {config.owner}&apos;s board.</p>
        </div>
        <div className="space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
          {oauthEnabled && (
            <Button size="lg" className="h-11 w-full text-base" onClick={startLogin}><GitHubMark />Sign in with GitHub</Button>
          )}
          <Button size="lg" variant="outline" className="h-11 w-full text-base" onClick={() => { startDemo(); go("/my-work/"); }}>
            <Sparkles />Try it with sample data
          </Button>
          <p className="text-center text-xs text-muted-foreground">The sample board needs no account, and nothing you do in it is saved.</p>

          <div className="pt-2">
            {!showToken ? (
              <button className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline" onClick={() => setShowToken(true)}>
                Sign in with a GitHub token instead
              </button>
            ) : (
              <form className="space-y-2 border-t pt-4" onSubmit={(e) => { e.preventDefault(); if (token.trim()) { setToken(token.trim()); go("/my-work/"); } }}>
                <label htmlFor="token" className="flex items-center gap-1.5 text-sm font-medium"><KeyRound className="size-4" />GitHub token</label>
                <input id="token" type="password" autoComplete="off" value={token} onChange={(e) => setTokenValue(e.target.value)} placeholder="github_pat_…"
                  className="h-10 w-full rounded-lg border bg-background px-3 font-mono text-sm outline-none focus:border-ring" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Create one at <a className="underline" href="https://github.com/settings/tokens/new?scopes=repo,read:org,project&description=BeyondPM" target="_blank" rel="noreferrer">GitHub → Settings → Tokens</a> with
                  the <b>repo</b>, <b>read:org</b> and <b>project</b> scopes. It stays in this browser only.
                </p>
                <Button type="submit" className="w-full" disabled={!token.trim()}>Continue<ArrowRight /></Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
