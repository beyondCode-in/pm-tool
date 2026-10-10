"use client";

import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLayout } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { Plus, RotateCcw } from "@/components/icons";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV } from "./nav";

// ClickUp-style view tabs: every way of looking at the same work, one click
// apart, each with its own coloured icon. "+ View" pins or unpins tabs; the
// choice is remembered in this browser. Filters carry over between tabs.
const VIEWS = NAV.filter((n) => !["/my-work/", "/inbox/", "/settings/"].includes(n.href));
// Spread the views around the colour wheel so each tab has its own hue.
const hueOf = (i: number) => (260 + i * (360 / VIEWS.length)) % 360;

export function ViewTabs() {
  const path = usePathname();
  const params = useSearchParams();
  const layout = useLayout("view-tabs", VIEWS.map((v) => v.href));
  const keep = new URLSearchParams([...params].filter(([k]) => ["q", "type", "priority", "assignee", "label", "done"].includes(k))).toString();
  const shown = layout.visible.map((h) => VIEWS.find((v) => v.href === h)!).filter(Boolean);
  if (!VIEWS.some((v) => path.startsWith(v.href.slice(0, -1)))) return null;

  return (
    <nav aria-label="Views" className="-mx-1 flex min-w-0 items-center gap-0.5 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none]">
      {shown.map((v) => {
        const i = VIEWS.indexOf(v);
        const on = path.startsWith(v.href.slice(0, -1));
        const Icon = v.icon;
        return (
          <Link key={v.href} href={`${v.href}${keep ? `?${keep}` : ""}`} aria-current={on ? "page" : undefined}
            className={cn("relative flex shrink-0 items-center gap-1.5 rounded-t-md px-2.5 pt-1.5 pb-2 text-sm transition-colors",
              on ? "font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
            <span className="view-tab-icon grid size-[18px] place-items-center rounded-[5px]" style={{ ["--vh" as string]: hueOf(i) }}>
              <Icon size={12} />
            </span>
            {v.label}
            {on && <motion.span layoutId="view-tab-underline" className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-primary" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
          </Link>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger className="ml-1 flex shrink-0 items-center gap-1 rounded-md px-2 pt-1.5 pb-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground">
          <Plus className="size-3.5" />View
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuLabel>Show these views as tabs</DropdownMenuLabel>
          {VIEWS.map((v, i) => {
            const Icon = v.icon;
            return (
              <DropdownMenuCheckboxItem key={v.href} checked={!layout.isHidden(v.href)} onCheckedChange={() => layout.toggleHidden(v.href)}>
                <span className="view-tab-icon grid size-[18px] place-items-center rounded-[5px]" style={{ ["--vh" as string]: hueOf(i) }}><Icon size={12} /></span>
                <span className="flex-1">{v.label}</span>
                <span className="text-xs text-muted-foreground">{v.hint}</span>
              </DropdownMenuCheckboxItem>
            );
          })}
          {layout.customised && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={layout.reset}><RotateCcw />Show all views</DropdownMenuItem></>)}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
