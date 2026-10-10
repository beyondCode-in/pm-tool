import { cn } from "@/lib/utils";

// Soft drifting colour "smoke" behind hero surfaces. Pure CSS: blurred blobs
// moved with transforms only (GPU), plus a fine grain layer. Respects
// prefers-reduced-motion via the global rule in globals.css.
export function Aurora({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ opacity: intensity }}>
      <span className="aurora-blob left-[-10%] top-[-20%] h-[55vmax] w-[55vmax] bg-[var(--brand-from)] [animation-duration:22s]" />
      <span className="aurora-blob right-[-15%] top-[10%] h-[45vmax] w-[45vmax] bg-[var(--brand-to)] [animation-delay:-6s] [animation-duration:26s]" />
      <span className="aurora-blob bottom-[-25%] left-[20%] h-[50vmax] w-[50vmax] bg-[var(--chart-2)] opacity-60 [animation-delay:-12s] [animation-duration:30s]" />
      <span className="aurora-grain absolute inset-0" />
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_75%)]" />
    </div>
  );
}
