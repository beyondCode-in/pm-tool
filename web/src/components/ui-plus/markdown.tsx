"use client";

import * as P from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useId, useState, type ReactNode } from "react";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Shared Markdown pieces for docs, tickets, comments and chat:
// • ```mermaid blocks become diagrams (Mermaid loads only when one is on screen),
// • other code blocks get syntax colours, a language badge and a copy button.

export const MD_PLUGINS = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [[rehypeHighlight, { plainText: ["mermaid", "text", "txt"] }]] as never,
};

type Hast = { type: string; value?: string; tagName?: string; properties?: { className?: string[] }; children?: Hast[] };
const textOf = (n?: Hast): string => (!n ? "" : n.type === "text" ? n.value ?? "" : (n.children ?? []).map(textOf).join(""));

/** Use as `components={{ ...MD_CODE, a: … }}` on ReactMarkdown. */
export const MD_CODE = {
  pre: ({ node, children }: { node?: Hast; children?: ReactNode }) => {
    const code = node?.children?.find((c) => c.tagName === "code");
    const lang = code?.properties?.className?.find((c) => c.startsWith("language-"))?.slice(9) ?? "";
    const raw = textOf(code).replace(/\n$/, "");
    if (lang === "mermaid") return <Mermaid code={raw} />;
    return <CodeBlock lang={lang} raw={raw}>{children}</CodeBlock>;
  },
};

function CodeBlock({ lang, raw, children }: { lang: string; raw: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { void navigator.clipboard?.writeText(raw).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };
  return (
    <div className="md-code group/code not-prose">
      <div className="md-code-bar">
        <span>{lang || "code"}</span>
        <button type="button" onClick={copy} aria-label="Copy code">{copied ? <><P.Check size={13} weight="bold" />Copied</> : <><P.Copy size={13} />Copy</>}</button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

let mermaidReady: Promise<typeof import("mermaid").default> | null = null;
const loadMermaid = () => (mermaidReady ??= import("mermaid").then((m) => m.default));

// Read the app's theme tokens so diagrams match light, dark and the accent.
function themeVars(dark: boolean) {
  const css = getComputedStyle(document.documentElement);
  // Mermaid's colour maths only understands hex/rgb, and the tokens are oklch,
  // so paint each one on a 1×1 canvas and read the pixel back.
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const hex = (color: string) => {
    if (!ctx) return color;
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  };
  const v = (name: string, fallback: string) => { const raw = css.getPropertyValue(name).trim(); return raw ? hex(raw) : fallback; };
  const fg = v("--foreground", dark ? "#eee" : "#222");
  return {
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
    fontSize: "14px",
    background: "transparent",
    primaryColor: v("--accent", dark ? "#333" : "#f3ece6"),
    primaryTextColor: fg,
    primaryBorderColor: v("--primary", "#c8613d"),
    secondaryColor: v("--muted", dark ? "#2a2a2a" : "#f4f4f5"),
    tertiaryColor: v("--card", dark ? "#1c1c1c" : "#fff"),
    lineColor: v("--muted-foreground", "#888"),
    textColor: fg,
    mainBkg: v("--accent", dark ? "#333" : "#f3ece6"),
    nodeBorder: v("--primary", "#c8613d"),
    clusterBkg: v("--muted", dark ? "#2a2a2a" : "#f7f3ef"),
    clusterBorder: v("--border", "#ddd"),
    edgeLabelBackground: v("--card", dark ? "#1c1c1c" : "#fff"),
    noteBkgColor: v("--muted", "#f4f4f5"),
    noteTextColor: fg,
    noteBorderColor: v("--border", "#ddd"),
    actorBkg: v("--accent", "#f3ece6"),
    actorBorder: v("--primary", "#c8613d"),
    actorTextColor: fg,
    signalColor: fg,
    signalTextColor: fg,
    labelBoxBkgColor: v("--accent", "#f3ece6"),
    labelTextColor: fg,
  };
}

// The SVG comes from Mermaid with securityLevel "strict", which sanitises it
// (DOMPurify) and disables scripts and click handlers in diagrams.
export function Mermaid({ code }: { code: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    let live = true;
    loadMermaid().then(async (mermaid) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "base", themeVariables: themeVars(dark), flowchart: { curve: "basis", htmlLabels: true, padding: 14 }, sequence: { mirrorActors: false } });
      try {
        const out = await mermaid.render(`mmd-${id}-${dark ? "d" : "l"}`, code);
        if (live) { setSvg(out.svg); setError(null); }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message.split("\n")[0] : "This diagram has a syntax error.");
      }
    });
    return () => { live = false; };
  }, [code, dark, id]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const body = error ? (
    <p className="flex items-start gap-2 p-4 text-sm text-destructive"><P.WarningCircle size={18} className="mt-0.5 shrink-0" />Couldn&apos;t draw this diagram: {error}</p>
  ) : svg ? (
    <div className="md-diagram-svg" dangerouslySetInnerHTML={{ __html: svg }} />
  ) : (
    <div className="grid h-32 place-items-center text-xs text-muted-foreground"><span className="flex items-center gap-2"><P.CircleNotch size={16} className="animate-spin" />Drawing diagram…</span></div>
  );

  return (
    <figure className="md-diagram not-prose">
      <div className="md-code-bar">
        <span className="flex items-center gap-1.5"><P.FlowArrow size={14} weight="duotone" />Diagram</span>
        <span className="flex gap-1">
          <button type="button" onClick={() => setShowCode((s) => !s)} aria-pressed={showCode}>{showCode ? <><P.ChartPolar size={13} />Diagram</> : <><P.Code size={13} />Source</>}</button>
          {svg && <button type="button" onClick={() => setFull(true)} aria-label="Expand diagram"><P.ArrowsOut size={13} />Expand</button>}
        </span>
      </div>
      {showCode ? <pre className="md-diagram-src">{code}</pre> : body}
      {full && svg && (
        <div role="dialog" aria-modal aria-label="Diagram" className="md-diagram-full" onClick={() => setFull(false)}>
          <div className={cn("md-diagram-svg md-diagram-svg-full")} onClick={(e) => e.stopPropagation()} dangerouslySetInnerHTML={{ __html: svg }} />
          <button type="button" className="md-diagram-close" onClick={() => setFull(false)} aria-label="Close"><P.X size={18} /></button>
        </div>
      )}
    </figure>
  );
}

/** Drop HTML comments (GitHub templates and BeyondPM's hidden markers) before rendering. */
export const cleanMd = (s: string) => s.replace(/<!--[\s\S]*?(-->|$)/g, "").replace(/^\s*\n/, "");
