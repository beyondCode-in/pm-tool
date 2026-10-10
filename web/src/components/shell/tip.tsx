"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactElement } from "react";

// Tooltip with an optional shortcut. `show` turns it off where a visible label
// already says the same thing (e.g. the expanded sidebar).
export function Tip({ label, kbd, show = true, side = "right", children }: { label: string; kbd?: string; show?: boolean; side?: "right" | "top" | "bottom" | "left"; children: ReactElement }) {
  if (!show) return children;
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} className="flex items-center gap-2">
        {label}{kbd && <kbd className="rounded border border-background/30 px-1 font-mono text-[10px] opacity-80">{kbd}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}
