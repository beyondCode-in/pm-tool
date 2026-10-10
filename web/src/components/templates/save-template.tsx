"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBoard } from "@/lib/data";
import { closeSaveTemplate, saveTemplate, useSaveTemplateTarget } from "@/lib/templates";
import type { Ticket } from "@/lib/types";
import { Copy } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { cleanTitle } from "../ticket/bits";

// "Save as template": name it, choose whether to keep the people.
export function SaveTemplateDialog() {
  const t = useSaveTemplateTarget();
  return (
    <Dialog open={!!t} onOpenChange={(o: boolean) => { if (!o) closeSaveTemplate(); }}>
      <DialogContent className="sm:max-w-md">{t && <Form key={t.url} ticket={t} />}</DialogContent>
    </Dialog>
  );
}

function Form({ ticket: t }: { ticket: Ticket }) {
  const { data: board } = useBoard();
  const [name, setName] = useState(cleanTitle(t.title));
  const [people, setPeople] = useState(false);
  const save = () => {
    if (!board || !name.trim()) return;
    saveTemplate(board.projectId, name.trim(), t, people);
    toast.success(`Saved template "${name.trim()}"`, { description: "Find it under New ticket → Templates." });
    closeSaveTemplate();
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Copy weight="duotone" className="size-5 text-primary" />Save as template</DialogTitle>
        <DialogDescription>Keeps the title, description, checklist, tags, priority, type, size, component and points. Dates and sprint start fresh.</DialogDescription>
      </DialogHeader>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" aria-label="Template name"
        className="h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-ring" />
      {t.assignees.length > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={people} onChange={(e) => setPeople(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          Keep the people ({t.assignees.map((a) => a.name || a.login).join(", ")})
        </label>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={closeSaveTemplate}>Cancel</Button>
        <Button type="submit" disabled={!name.trim()}>Save template</Button>
      </div>
    </form>
  );
}
