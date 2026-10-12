"use client";

import { BrandLoader } from "@/components/brand/logo";
import { ErrorState } from "@/components/brand/states";
import { Avatar } from "@/components/ticket/bits";
import { Button } from "@/components/ui/button";
import { markMentions, MentionTextarea } from "@/components/ui-plus/mention-textarea";
import { useBoard, useSource } from "@/lib/data";
import type { ChatMessage } from "@/lib/types";
import { useOpenTicket } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { X } from "@/components/icons";
import * as P from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { MD_CODE, MD_PLUGINS } from "@/components/ui-plus/markdown";
import { toast } from "sonner";

// Chat (ClickUp Chat, on GitHub Discussions): channels are discussion
// categories, each message is a discussion and replies are its comments,
// so every conversation is also on GitHub. Refreshes every 15 seconds.

const POLL = 15_000;

export default function ChatPage() {
  const source = useSource();
  const info = useQuery({ queryKey: ["chat-info"], enabled: !!source, queryFn: () => source!.chatInfo() });
  const [channel, setChannel] = useQueryState("ch", parseAsString.withOptions({ history: "replace" }));
  const [thread, setThread] = useQueryState("thread", parseAsString.withOptions({ history: "push" }));

  if (info.error) return <div className="p-6"><ErrorState title="We couldn't load chat" message={(info.error as Error).message} onRetry={() => void info.refetch()} /></div>;
  if (info.isLoading || !info.data) return <div className="grid flex-1 place-items-center"><BrandLoader /></div>;
  if (!info.data.enabled) return <TurnOn url={info.data.settingsUrl} />;
  const channels = info.data.channels;
  const current = channels.find((c) => c.id === channel) ?? channels[0];
  if (!current) return <TurnOn url={info.data.settingsUrl} noCategories />;

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card/50 md:flex" aria-label="Channels">
        <div className="flex items-center gap-2 px-3 pt-3.5 pb-2">
          <P.ChatsCircle size={18} weight="duotone" className="text-primary" />
          <h1 className="text-base font-semibold">Chat</h1>
        </div>
        <p className="px-3 pb-1 text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Channels</p>
        <nav className="scroll-quiet min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2">
          {channels.map((c) => (
            <button key={c.id} onClick={() => { void setChannel(c.id); void setThread(null); }} aria-current={c.id === current.id ? "page" : undefined}
              className={cn("nav-item flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13.5px]", c.id === current.id ? "nav-item-active font-medium" : "text-foreground/85")}>
              <span className="grid size-5 place-items-center text-sm">{c.emoji === "#" ? <span className="text-muted-foreground">#</span> : c.emoji}</span>
              <span className="truncate">{c.name}</span>
            </button>
          ))}
        </nav>
        <p className="border-t px-3 py-2 text-[11px] leading-snug text-muted-foreground">Conversations are GitHub Discussions, so they also show on GitHub.</p>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col" aria-label={`${current.name} channel`}>
        <header className="flex items-center gap-2 border-b px-4 py-2.5">
          <select value={current.id} onChange={(e) => { void setChannel(e.target.value); void setThread(null); }} aria-label="Channel" className="h-8 rounded-lg border bg-card px-2 text-sm md:hidden">
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span className="hidden text-lg md:inline">{current.emoji === "#" ? "#" : current.emoji}</span>
          <h2 className="hidden text-base font-semibold md:block">{current.name}</h2>
          {current.description && <p className="hidden truncate text-sm text-muted-foreground lg:block">· {current.description}</p>}
        </header>
        <Stream channelId={current.id} activeThread={thread} onThread={(id) => void setThread(id)} />
      </section>

      {thread && <Thread key={thread} channelId={current.id} id={thread} onClose={() => void setThread(null)} />}
    </div>
  );
}

function TurnOn({ url, noCategories }: { url: string; noCategories?: boolean }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-accent text-primary"><P.ChatsCircle size={30} weight="duotone" /></span>
        <p className="text-lg font-semibold">{noCategories ? "Add a discussion category" : "Turn on GitHub Discussions"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Chat uses the repository&apos;s GitHub Discussions, so every conversation is kept with your code and tickets.
          {noCategories ? " Create at least one category (for example General) to use as a channel." : " A repository admin can switch it on under Settings → General → Features → Discussions."}
        </p>
        <Button className="mt-4" nativeButton={false} render={<a href={url} target="_blank" rel="noreferrer" />}><P.ArrowSquareOut />Open repository settings</Button>
      </div>
    </div>
  );
}

const dayLabel = (iso: string) => { const d = parseISO(iso); return isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "EEEE d MMMM"); };

function Body({ text }: { text: string }) {
  const { data: board } = useBoard();
  const [, open] = useOpenTicket();
  const md = markMentions(text.replace(/(^|[\s(])#(\d+)\b/g, (_, pre, n) => `${pre}[#${n}](#ticket-${n})`), board?.people.map((p) => p.login) ?? []);
  return (
    <div className="prose-ticket chat-body text-[14.5px]">
      <ReactMarkdown {...MD_PLUGINS} components={{
        ...MD_CODE,
        a: ({ href, children }) => href?.startsWith("#mention-") ? <span className="mention">{children}</span>
          : href?.startsWith("#ticket-") ? <button className="ticket-ref" onClick={() => void open(Number(href.slice(8)))}>{children}</button>
          : <a href={href} target="_blank" rel="noreferrer">{children}</a>,
      }}>{md}</ReactMarkdown>
    </div>
  );
}

function Line({ m, children, compact }: { m: ChatMessage; children?: ReactNode; compact?: boolean }) {
  return (
    <div className={cn("group/msg flex gap-3 rounded-xl px-3 transition-colors hover:bg-muted/40", compact ? "py-0.5" : "pt-2 pb-1")}>
      <span className="w-9 shrink-0">{!compact && (m.author ? <Avatar person={m.author} size={36} /> : <span className="block size-9 rounded-full bg-muted" />)}</span>
      <div className="min-w-0 flex-1">
        {!compact && (
          <p className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{m.author?.name || m.author?.login || "Someone"}</span>
            <span className="text-[11px] text-muted-foreground" title={format(parseISO(m.createdAt), "PPpp")}>{format(parseISO(m.createdAt), "h:mm a")}</span>
          </p>
        )}
        <Body text={m.body} />
        {children}
      </div>
    </div>
  );
}

function Stream({ channelId, activeThread, onThread }: { channelId: string; activeThread: string | null; onThread: (id: string) => void }) {
  const source = useSource();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["chat", channelId], enabled: !!source, queryFn: () => source!.chatMessages(channelId), refetchInterval: POLL });
  const end = useRef<HTMLDivElement>(null);
  const count = q.data?.length ?? 0;
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [count, channelId]);
  const send = async (body: string) => {
    await source!.postMessage(channelId, body);
    await qc.invalidateQueries({ queryKey: ["chat", channelId] });
  };
  const list = q.data ?? [];
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {q.isLoading ? <BrandLoader /> : !list.length ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No messages yet. Say hello 👋</p>
        ) : list.map((m, i) => {
          const prev = list[i - 1];
          const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
          // Messages from the same person within 5 minutes stack without repeating the header.
          const compact = !newDay && !!prev && prev.author?.login === m.author?.login && Date.parse(m.createdAt) - Date.parse(prev.createdAt) < 5 * 60_000 && !(prev.replies ?? 0);
          return (
            <div key={m.id}>
              {newDay && <div className="my-3 flex items-center gap-3 px-3 text-[11px] font-semibold text-muted-foreground"><span className="h-px flex-1 bg-border" />{dayLabel(m.createdAt)}<span className="h-px flex-1 bg-border" /></div>}
              <Line m={m} compact={compact}>
                <div className="mt-1 flex items-center gap-2">
                  {(m.replies ?? 0) > 0 && (
                    <button onClick={() => onThread(m.id)} className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10", activeThread === m.id && "bg-primary/10")}>
                      <P.ChatCircleText size={14} weight="duotone" />{m.replies} repl{m.replies === 1 ? "y" : "ies"}
                    </button>
                  )}
                  <button onClick={() => onThread(m.id)} className="text-xs text-muted-foreground opacity-0 group-hover/msg:opacity-100 hover:text-foreground focus-visible:opacity-100 [@media(hover:none)]:opacity-100">Reply in thread</button>
                </div>
              </Line>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <Composer placeholder="Message the channel… @ to mention, #123 for a ticket" onSend={send} />
    </>
  );
}

function Thread({ channelId, id, onClose }: { channelId: string; id: string; onClose: () => void }) {
  const source = useSource();
  const qc = useQueryClient();
  const parent = (qc.getQueryData<ChatMessage[]>(["chat", channelId]) ?? []).find((m) => m.id === id);
  const q = useQuery({ queryKey: ["chat-thread", id], enabled: !!source, queryFn: () => source!.chatReplies(id), refetchInterval: POLL });
  const send = async (body: string) => {
    await source!.postReply(id, body);
    await Promise.all([qc.invalidateQueries({ queryKey: ["chat-thread", id] }), qc.invalidateQueries({ queryKey: ["chat", channelId] })]);
  };
  return (
    <aside className="flex w-full max-w-sm shrink-0 flex-col border-l bg-card/40" aria-label="Thread">
      <header className="flex items-center gap-2 border-b px-4 py-2.5">
        <P.ChatCircleText size={18} weight="duotone" className="text-primary" />
        <h2 className="text-sm font-semibold">Thread</h2>
        {parent?.url && <a href={parent.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground">on GitHub ↗</a>}
        <Button size="icon-sm" variant="ghost" className="ml-auto" aria-label="Close thread" onClick={onClose}><X /></Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-3">
        {parent && <Line m={parent} />}
        <div className="my-2 flex items-center gap-3 px-4 text-[11px] text-muted-foreground"><span className="h-px flex-1 bg-border" />{q.data?.length ?? 0} repl{q.data?.length === 1 ? "y" : "ies"}<span className="h-px flex-1 bg-border" /></div>
        {(q.data ?? []).map((r) => <Line key={r.id} m={r} />)}
      </div>
      <Composer placeholder="Reply…" onSend={send} />
    </aside>
  );
}

function Composer({ placeholder, onSend }: { placeholder: string; onSend: (body: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try { await onSend(body); setText(""); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't send.", { duration: 10000 }); }
    finally { setBusy(false); }
  };
  return (
    <div className="border-t p-3">
      <div className="field-frame flex items-end gap-2 rounded-xl border bg-card p-2 shadow-card">
        <MentionTextarea placement="above" wrapperClassName="min-w-0 flex-1" value={text} onValueChange={setText} rows={1} placeholder={placeholder} aria-label={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
          className="field-bare block max-h-40 w-full resize-none bg-transparent px-1.5 py-1 text-sm outline-none field-sizing-content" />
        <Button size="icon-sm" disabled={!text.trim() || busy} onClick={() => void send()} aria-label="Send"><P.PaperPlaneRight weight="fill" /></Button>
      </div>
      <p className="mt-1 px-1 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}
