"use client";

import { useSyncExternalStore } from "react";

export const ACCENTS = [
  { id: "clay", label: "Clay", swatch: "oklch(0.6 0.14 42)" },
  { id: "cocoa", label: "Cocoa", swatch: "oklch(0.47 0.075 48)" },
  { id: "indigo", label: "Indigo", swatch: "oklch(0.54 0.21 277)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.53 0.22 295)" },
  { id: "blue", label: "Blue", swatch: "oklch(0.55 0.19 250)" },
  { id: "teal", label: "Teal", swatch: "oklch(0.55 0.11 190)" },
  { id: "green", label: "Green", swatch: "oklch(0.55 0.15 150)" },
  { id: "orange", label: "Orange", swatch: "oklch(0.6 0.18 45)" },
  { id: "rose", label: "Rose", swatch: "oklch(0.57 0.21 10)" },
] as const;
export type AccentId = (typeof ACCENTS)[number]["id"];

const KEY = "beyondpm.accent";
const listeners = new Set<() => void>();
const read = (): AccentId => {
  try { return (localStorage.getItem(KEY) as AccentId) || "clay"; } catch { return "clay"; }
};

export function setAccent(id: AccentId) {
  try { localStorage.setItem(KEY, id); } catch { /* per-browser preference only */ }
  if (id === "clay") document.documentElement.removeAttribute("data-accent");
  else document.documentElement.dataset.accent = id;
  listeners.forEach((l) => l());
}

export const useAccent = () =>
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => "clay" as AccentId);

// Runs before first paint (inlined in <head>) so the saved accent never flashes.
export const accentBootScript = `try{var a=localStorage.getItem("${KEY}");if(a&&a!=="clay")document.documentElement.dataset.accent=a}catch(e){}`;
