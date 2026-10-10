"use client";

// A small burst of confetti in the theme's colours when work is finished.
// Skipped entirely for people who prefer reduced motion.
export async function celebrate(origin?: { x: number; y: number }) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const css = getComputedStyle(document.documentElement);
  const colors = ["--brand-from", "--brand-to", "--chart-3", "--chart-4"].map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
  // canvas-confetti needs hex/rgb; resolve CSS colours through a probe element.
  const probe = document.createElement("span");
  document.body.appendChild(probe);
  const rgb = colors.map((c) => { probe.style.color = c; return getComputedStyle(probe).color; });
  probe.remove();
  const hex = rgb.map((c) => {
    const m = c.match(/[\d.]+/g)?.map(Number) ?? [200, 120, 80];
    return `#${m.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, "0")).join("")}`;
  });
  void confetti({ particleCount: 70, spread: 70, startVelocity: 32, gravity: 0.9, ticks: 160, scalar: 0.9, origin: origin ?? { x: 0.5, y: 0.35 }, colors: hex, disableForReducedMotion: true });
}
