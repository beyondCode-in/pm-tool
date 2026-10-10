"use client";

import { useSyncExternalStore } from "react";

// Two independent, per-browser appearance choices, applied to <html> before
// first paint: the palette (neutrals and brand) and the accent colour.
export const PALETTES = [
  { id: "clay", label: "Clay", hint: "Warm paper and terracotta", swatch: "linear-gradient(135deg, #f6efe4 0 50%, #c8613d 50% 100%)" },
  { id: "bright", label: "Bright", hint: "Crisp white with vivid colour", swatch: "linear-gradient(135deg, #ffffff 0 50%, #7c3aed 50% 100%)" },
] as const;
export type PaletteId = (typeof PALETTES)[number]["id"];

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

const KEYS = { accent: "beyondpm.accent", palette: "beyondpm.palette" };
const DEFAULTS = { accent: "clay", palette: "clay" };
const listeners = new Set<() => void>();
const read = (k: keyof typeof KEYS) => () => {
  try { return localStorage.getItem(KEYS[k]) || DEFAULTS[k]; } catch { return DEFAULTS[k]; }
};

function apply(k: keyof typeof KEYS, id: string) {
  try { localStorage.setItem(KEYS[k], id); } catch { /* per-browser preference only */ }
  const attr = k === "accent" ? "accent" : "palette";
  if (id === DEFAULTS[k]) document.documentElement.removeAttribute(`data-${attr}`);
  else document.documentElement.dataset[attr] = id;
  listeners.forEach((l) => l());
}

export const setAccent = (id: AccentId) => apply("accent", id);
export const setPalette = (id: PaletteId) => apply("palette", id);

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useAccent = () => useSyncExternalStore(subscribe, read("accent"), () => DEFAULTS.accent) as AccentId;
export const usePalette = () => useSyncExternalStore(subscribe, read("palette"), () => DEFAULTS.palette) as PaletteId;

// Runs before first paint (inlined in <head>) so saved choices never flash.
export const accentBootScript = `try{var d=document.documentElement,a=localStorage.getItem("${KEYS.accent}"),p=localStorage.getItem("${KEYS.palette}");if(a&&a!=="clay")d.dataset.accent=a;if(p&&p!=="clay")d.dataset.palette=p}catch(e){}`;
