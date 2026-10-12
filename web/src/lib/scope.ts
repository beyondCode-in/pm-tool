import { isDemo } from "./auth";
import { currentTenant, encodeTenant } from "./tenant";

// Per-board storage keys. Notifications, reminders and the timer point at
// ticket numbers, which only mean something on one board, so each board (and
// the demo) keeps its own copy instead of leaking into the others.
export function scoped(base: string): string {
  if (typeof window === "undefined") return base;
  if (isDemo()) return `${base}@demo`;
  const t = currentTenant();
  return t ? `${base}@${encodeTenant(t)}` : base;
}
