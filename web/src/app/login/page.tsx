"use client";

import { Aurora } from "@/components/brand/aurora";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { checkMembership, setToken, startDemo, startLogin } from "@/lib/auth";
import { config, oauthEnabled } from "@/lib/config";
import { ArrowRight, KanbanSquare, KeyRound, MousePointerClick, Sparkles, Zap } from "@/components/icons";
import { motion } from "motion/react";
import { useState } from "react";

const go = (path: string) => window.location.assign(`${config.basePath}${path}`);

const GitHubMark = () => (
  <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
);

const FEATURES = [
  { icon: MousePointerClick, title: "Ask in three clicks", text: "Pick a card, write a sentence, done." },
  { icon: KanbanSquare, title: "Drag work forward", text: "Boards, sprints, roadmap and calendar." },
  { icon: Zap, title: "Live on GitHub", text: "Every ticket is a real issue the team sees." },
];

const rise = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Login() {
  const [token, setTokenValue] = useState("");
  const [showToken, setShowToken] = useState(!oauthEnabled);
  return (
    <main className="relative grid min-h-dvh overflow-hidden lg:grid-cols-[1.1fr_1fr]">
      <Aurora />

      <section className="relative hidden flex-col justify-between p-12 lg:flex">
        <motion.div {...rise(0)} className="flex items-center gap-2.5"><LogoMark size={32} /><span className="text-lg font-semibold tracking-tight">Beyond<span className="text-primary">PM</span></span></motion.div>
        <div className="max-w-lg">
          <motion.h1 {...rise(1)} className="text-5xl leading-[1.05] font-semibold tracking-tight">
            Work, <span className="text-gradient">beautifully</span> organised.
          </motion.h1>
          <motion.p {...rise(2)} className="mt-4 text-lg text-muted-foreground">
            The friendliness of ClickUp and the power of Jira, on top of the GitHub board your team already uses.
          </motion.p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map((f, i) => (
              <motion.li key={f.title} {...rise(3 + i)} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border bg-card/70 text-primary shadow-sm backdrop-blur"><f.icon className="size-4" /></span>
                <span><span className="block font-medium">{f.title}</span><span className="text-sm text-muted-foreground">{f.text}</span></span>
              </motion.li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">{config.owner ? <>Connected to {config.owner} · board #{config.projectNumber}</> : "Works with any GitHub organisation and project board."}</p>
      </section>

      <section className="relative grid place-items-center p-4 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="border-glow surface-glass glow-soft w-full max-w-md rounded-3xl border p-7 sm:p-9">
          <div className="mb-7 text-center">
            <span className="relative mx-auto mb-5 block w-fit">
              <span className="absolute inset-0 -z-10 rounded-2xl bg-primary/50 blur-xl" aria-hidden />
              <LogoMark size={52} />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{config.owner ? <>Sign in to see {config.owner}&apos;s board.</> : "Sign in with GitHub, then pick your team's board."}</p>
          </div>

          <div className="space-y-3">
            {oauthEnabled && (
              <Button size="lg" className="glow h-12 w-full rounded-xl text-base" onClick={startLogin}><GitHubMark />Continue with GitHub</Button>
            )}
            <Button size="lg" variant="outline" className="group h-12 w-full rounded-xl text-base" onClick={() => { startDemo(); go("/home/"); }}>
              <Sparkles className="text-primary transition-transform group-hover:rotate-12" />Explore the demo board
            </Button>
            <p className="text-center text-xs text-muted-foreground">No account needed for the demo. Nothing you do there is saved.</p>
          </div>

          <div className="mt-6">
            {!showToken ? (
              <button className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={() => setShowToken(true)}>
                Use a GitHub access token instead
              </button>
            ) : (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2.5 overflow-hidden border-t pt-5"
                onSubmit={(e) => { e.preventDefault(); const t = token.trim(); if (t) void checkMembership(t).then(() => { setToken(t); go("/home/"); }, (err: Error) => toast.error(err.message)); }}>
                <label htmlFor="token" className="flex items-center gap-1.5 text-sm font-medium"><KeyRound className="size-4" />GitHub access token</label>
                <input id="token" type="password" autoComplete="off" value={token} onChange={(e) => setTokenValue(e.target.value)} placeholder="github_pat_…"
                  className="h-11 w-full rounded-xl border bg-background/70 px-3 font-mono text-sm outline-none transition-shadow focus:border-ring focus:ring-4 focus:ring-ring/15" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Create one at <a className="text-primary underline" href="https://github.com/settings/tokens/new?scopes=repo,read:org,project&description=BeyondPM" target="_blank" rel="noreferrer">GitHub → Settings → Tokens</a> with
                  the <b>repo</b>, <b>read:org</b> and <b>project</b> scopes. It stays in this browser only.
                </p>
                <Button type="submit" className="h-11 w-full rounded-xl" disabled={!token.trim()}>Continue<ArrowRight /></Button>
              </motion.form>
            )}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
