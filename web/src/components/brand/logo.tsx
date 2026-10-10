import { cn } from "@/lib/utils";

// The BeyondPM mark: three cards stepping forward — work moving across a board.
// Colours come from the accent tokens, so the logo follows the chosen theme.
export function LogoMark({ size = 28, className, animated }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className={cn("shrink-0", animated && "logo-animated", className)}>
      <defs>
        <linearGradient id="bpm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--brand-to)" }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#bpm-g)" />
      <rect className="logo-card logo-card-1" x="6.5" y="9" width="6" height="14" rx="2" fill="white" opacity="0.45" />
      <rect className="logo-card logo-card-2" x="13" y="7" width="6" height="18" rx="2" fill="white" opacity="0.7" />
      <rect className="logo-card logo-card-3" x="19.5" y="11" width="6" height="10" rx="2" fill="white" />
    </svg>
  );
}

export function Logo({ size = 28, subtitle }: { size?: number; subtitle?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="min-w-0 leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight">Beyond<span className="text-primary">PM</span></span>
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
