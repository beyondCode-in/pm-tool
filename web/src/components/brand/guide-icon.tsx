import { cn } from "@/lib/utils";

// The Guide's own icon: a signpost, one board pointing on (in the brand
// orange) and one pointing back. Drawn for BeyondPM rather than taken from an
// icon set, and stroked in currentColor so it fits any button or menu.
export function GuideIcon({ className, board = "var(--brand-mark)" }: { className?: string; board?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-4 shrink-0", className)}>
      <path d="M12 3v18M9 21h6" />
      <path d="M12 5.5h6.2l2.3 2.25-2.3 2.25H12" fill={board} fillOpacity={0.9} />
      <path d="M12 12H5.8l-2.3 2.25 2.3 2.25H12" />
    </svg>
  );
}
