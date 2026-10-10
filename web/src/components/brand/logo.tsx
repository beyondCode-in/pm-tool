import { cn } from "@/lib/utils";
import { useId } from "react";

// The BeyondPM mark: a lowercase "b" whose bowl is a progress ring, three
// quarters closed, with a spark where it opens — work moving towards done,
// and a little beyond. Colours come from the theme tokens.
export function LogoMark({ size = 28, className, animated }: { size?: number; className?: string; animated?: boolean }) {
  const id = useId();
  // Ring: centre (19, 19.5), radius 6. Circumference ≈ 37.7; draw 78% of it.
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
      {/* stem */}
      <rect x="7.2" y="5.6" width="3.8" height="20.4" rx="1.9" fill="white" />
      {/* bowl as a progress ring */}
      <circle className="logo-ring" cx="19" cy="19.5" r="6" fill="none" stroke="white" strokeWidth="3.8" strokeLinecap="round"
        strokeDasharray="29.4 37.7" transform="rotate(-50 19 19.5)" />
      {/* spark at the open end */}
      <path className="logo-spark" d="M24.9 8.2 l0.9 2.2 2.2 0.9 -2.2 0.9 -0.9 2.2 -0.9 -2.2 -2.2 -0.9 2.2 -0.9z" style={{ fill: "var(--brand-spark)" }} />
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

// Loading state: the ring fills and the spark twinkles.
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
