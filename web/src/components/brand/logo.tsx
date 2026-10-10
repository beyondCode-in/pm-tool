import { cn } from "@/lib/utils";
import { useId } from "react";

// The BeyondPM mark: a "B" built from a stem and two stacked cards — tickets
// on a board — with a small spark for "beyond". Colours come from the accent
// tokens, so the mark follows the chosen theme.
export function LogoMark({ size = 28, className, animated }: { size?: number; className?: string; animated?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className={cn("shrink-0", animated && "logo-animated", className)}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--brand-to)" }} />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id}-bg)`} />
      <rect width="32" height="32" rx="9" fill={`url(#${id}-shine)`} />
      <rect className="logo-card logo-card-1" x="8" y="7" width="3.6" height="18" rx="1.8" fill="white" />
      <rect className="logo-card logo-card-2" x="12.8" y="7" width="9.4" height="7.6" rx="2.6" fill="white" fillOpacity="0.92" />
      <rect className="logo-card logo-card-3" x="12.8" y="16.4" width="11.2" height="8.6" rx="2.8" fill="white" fillOpacity="0.72" />
      <circle cx="24.6" cy="8.4" r="1.9" style={{ fill: "var(--brand-spark)" }} />
    </svg>
  );
}

export function Logo({ size = 28, subtitle }: { size?: number; subtitle?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="min-w-0 leading-tight">
        <span className="font-display block text-[16px] font-semibold">beyond<span className="text-primary">pm</span></span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}

// Full-screen loading state: the mark's cards rise in turn.
export function BrandLoader({ label = "Loading your board…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid flex-1 place-items-center p-10">
      <div className="flex flex-col items-center gap-4">
        <span className="relative">
          <span className="absolute inset-0 -z-10 rounded-3xl bg-primary/40 blur-2xl" aria-hidden />
          <LogoMark size={56} animated />
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
