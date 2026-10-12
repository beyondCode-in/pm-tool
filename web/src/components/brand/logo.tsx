import { cn } from "@/lib/utils";

// The BeyondPM mark: a heavy lowercase "b" with a ticket card flying off its
// shoulder. The "b" is the name; the card is work moving on, a little beyond.
// Flat, two colours, no gradients: it has to hold up at 16 px and in one ink.
// Ink and paper swap in dark mode; the card is always the brand orange.
export function LogoMark({ size = 28, className, animated }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden className={cn("shrink-0", animated && "logo-animated", className)}>
      <rect width="32" height="32" rx="8" style={{ fill: "var(--brand-ink)" }} />
      <path fillRule="evenodd" style={{ fill: "var(--brand-paper)" }}
        d="M10.3 5.5a2.3 2.3 0 0 1 2.3 2.3v4.7h4.9a6.75 6.75 0 0 1 0 13.5H9.9A1.9 1.9 0 0 1 8 24.1V7.8a2.3 2.3 0 0 1 2.3-2.3ZM12.6 16.6v5.3h4.9a2.65 2.65 0 0 0 0-5.3Z" />
      <rect className="logo-card" x="19.6" y="4.6" width="7.2" height="5.6" rx="1.5" transform="rotate(14 23.2 7.4)" style={{ fill: "var(--brand-mark)" }} />
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

// Loading state: the card lifts off and settles, over and over.
export function BrandLoader({ label = "Loading your board…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid flex-1 place-items-center p-10">
      <div className="flex flex-col items-center gap-4">
        <span className="relative">
          <LogoMark size={56} animated />
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
