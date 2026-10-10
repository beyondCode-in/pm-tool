"use client";

import { useBoard } from "@/lib/data";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type TextareaHTMLAttributes } from "react";
import { Avatar } from "../ticket/bits";

// A textarea with @mentions: typing "@" lists the team (the people GitHub
// lets you assign in this repository), filtered as you type. ↑ ↓ to move,
// Enter or Tab to insert "@login", Esc to close. GitHub notifies whoever is
// mentioned in a comment, so this is a real ping, not just text.

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (v: string) => void;
  /** Where the list opens: above (composers at the bottom) or below. */
  placement?: "above" | "below";
  /** Classes for the wrapper, e.g. to let the textarea fill a column. */
  wrapperClassName?: string;
};

const QUERY = /(^|[\s(])@([\w-]*)$/;

export const MentionTextarea = forwardRef<HTMLTextAreaElement, Props>(function MentionTextarea({ value, onValueChange, placement = "below", wrapperClassName, onKeyDown, className, ...rest }, outer) {
  const { data: board } = useBoard();
  const ref = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(outer, () => ref.current!);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const people = board?.people ?? [];
    if (query === null) return [];
    const q = query.toLowerCase();
    return people.filter((p) => p.login.toLowerCase().includes(q) || (p.name ?? "").toLowerCase().includes(q))
      .sort((a, b) => Number(!a.login.toLowerCase().startsWith(q)) - Number(!b.login.toLowerCase().startsWith(q)))
      .slice(0, 8);
  }, [board, query]);

  const sync = (el: HTMLTextAreaElement) => {
    const m = QUERY.exec(el.value.slice(0, el.selectionStart ?? 0));
    setQuery(m ? m[2] : null);
    setActive(0);
  };

  const insert = (p: Person) => {
    const el = ref.current; if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(QUERY, (_, pre) => `${pre}@${p.login} `);
    const next = before + value.slice(caret);
    onValueChange(next);
    setQuery(null);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(before.length, before.length); });
  };

  const open = query !== null && matches.length > 0;
  return (
    <div className={cn("relative", wrapperClassName)}>
      <textarea ref={ref} value={value} {...rest} className={className}
        role="combobox" aria-expanded={open} aria-autocomplete="list" aria-controls={open ? "mention-list" : undefined}
        onChange={(e) => { onValueChange(e.target.value); sync(e.target); }}
        onClick={(e) => sync(e.currentTarget)}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
        onKeyDown={(e) => {
          if (open) {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % matches.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + matches.length) % matches.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insert(matches[active]); return; }
            if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setQuery(null); return; }
          }
          onKeyDown?.(e);
        }} />
      {open && (
        <ul id="mention-list" role="listbox" aria-label="Mention someone"
          className={cn("absolute left-2 z-50 w-64 overflow-hidden rounded-xl border bg-popover p-1 shadow-pop", placement === "above" ? "bottom-full mb-2" : "top-full mt-1")}>
          <li className="px-2.5 pt-1.5 pb-1 text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Mention</li>
          {matches.map((p, i) => (
            <li key={p.login} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); insert(p); }} onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm", i === active && "bg-primary/10")}>
              <Avatar person={p} size={22} />
              <span className="min-w-0 flex-1 truncate">{p.name || p.login}</span>
              <span className="truncate text-xs text-muted-foreground">@{p.login}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

/** Show "@login" in rendered text as a highlighted mention. */
export const markMentions = (md: string, logins: string[]) =>
  logins.length ? md.replace(new RegExp(`(^|[\\s(])@(${logins.map((l) => l.replace(/[-]/g, "\\-")).join("|")})\\b`, "g"), (_, pre, l) => `${pre}[@${l}](#mention-${l})`) : md;
