import { cn } from "@/lib/utils";
import { useId } from "react";

// The BeyondPM mark: three board columns rising left to right, like work
// moving across a board, with a spark just past the last one: done, and a
// little beyond. Reads at 16 px; colours come from the theme tokens.
export function LogoMark({ size = 28, className, animated }: { size?: number; className?: string; animated?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className={cn("shrink-0", animated && "logo-animated", className)}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--brand-to)" }} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.25" cy="0.15" r="0.9">
          <stop offset="0" stopColor="white" stopOpacity="0.32" />
          <stop offset="0.6" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="9.5" fill={`url(#${id}-bg)`} />
      <rect width="32" height="32" rx="9.5" fill={`url(#${id}-glow)`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="none" stroke="white" strokeOpacity="0.18" />
      <rect className="logo-bar" x="6.5" y="17" width="4.6" height="8.5" rx="2.3" fill="white" fillOpacity="0.62" />
      <rect className="logo-bar" x="13.7" y="12.5" width="4.6" height="13" rx="2.3" fill="white" fillOpacity="0.82" style={{ animationDelay: "0.12s" }} />
      <rect className="logo-bar" x="20.9" y="8" width="4.6" height="17.5" rx="2.3" fill="white" style={{ animationDelay: "0.24s" }} />
      <path className="logo-spark" d="M26.6 3.6 l0.75 1.85 1.85 0.75 -1.85 0.75 -0.75 1.85 -0.75 -1.85 -1.85 -0.75 1.85 -0.75z" style={{ fill: "var(--brand-spark)" }} />
    </svg>
  );
}

export function Logo({ size = 28, subtitle }: { size?: number; subtitle?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="min-w-0 leading-tight">
        <span className="font-display block text-[17px] tracking-tight">beyond<span className="text-primary">pm</span></span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}

// Loading state: the columns rise and the spark twinkles.
export function BrandLoader({ label = "Loading your board…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid flex-1 place-items-center p-10">
      <div className="flex flex-col items-center gap-4">
        <span className="relative">
          <span className="absolute inset-0 -z-10 rounded-3xl bg-primary/35 blur-2xl" aria-hidden />
          <LogoMark size={56} animated />
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
