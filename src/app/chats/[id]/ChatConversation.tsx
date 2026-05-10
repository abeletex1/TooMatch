"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MatchAvatar from "@/components/ui/MatchAvatar";
import UnmatchSheet from "@/components/ui/UnmatchSheet";
function ReadMoreText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 120;
  return (
    <div>
      <p className={`text-[14px] text-ink font-light leading-[1.6] break-words whitespace-pre-line ${!expanded && isLong ? "line-clamp-3" : ""}`}>
        {text}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="text-[12px] text-rose mt-2 hover:opacity-70 transition-opacity">
          {expanded ? "Ver menos ↑" : "Ver más →"}
        </button>
      )}
    </div>
  );
}
import { MIN_MESSAGES_PER_USER } from "@/lib/mock/matches";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction, unmatchAction } from "./actions";
import type { RealMatch, MessageRow } from "@/lib/types";

export default function ChatConversation({
  match,
  currentUserId,
  initialMessages,
  isUnmatched,
}: {
  match: RealMatch;
  currentUserId: string;
  initialMessages: MessageRow[];
  isUnmatched: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"chat" | "perfil">("chat");
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [unmatchOpen, setUnmatchOpen] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const partnerTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myCount = messages.filter((m) => m.sender_id === currentUserId).length;
  const partnerCount = messages.filter((m) => m.sender_id !== currentUserId).length;
  const unlocked = myCount >= MIN_MESSAGES_PER_USER && partnerCount >= MIN_MESSAGES_PER_USER;
  const nameVisible = myCount >= 1 && partnerCount >= 1;
  const myRemaining = Math.max(0, MIN_MESSAGES_PER_USER - myCount);
  const partnerRemaining = Math.max(0, MIN_MESSAGES_PER_USER - partnerCount);

  function scrollToBottom() {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  useEffect(() => {
    if (isUnmatched) router.push("/match");
  }, [isUnmatched, router]);


  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${match.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `match_id=eq.${match.id}`,
      }, (payload) => {
        const newMsg = payload.new as MessageRow;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          const wasUnlocked = prev.filter((m) => m.sender_id === currentUserId).length >= MIN_MESSAGES_PER_USER && prev.filter((m) => m.sender_id !== currentUserId).length >= MIN_MESSAGES_PER_USER;
          const isUnlocked = updated.filter((m) => m.sender_id === currentUserId).length >= MIN_MESSAGES_PER_USER && updated.filter((m) => m.sender_id !== currentUserId).length >= MIN_MESSAGES_PER_USER;
          if (!wasUnlocked && isUnlocked) {
            setJustUnlocked(true);
            setTimeout(() => setJustUnlocked(false), 4000);
          }
          return updated;
        });
        setPartnerTyping(false);
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId === currentUserId) return;
        setPartnerTyping(true);
        if (partnerTypingTimer.current) clearTimeout(partnerTypingTimer.current);
        partnerTypingTimer.current = setTimeout(() => setPartnerTyping(false), 3000);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (partnerTypingTimer.current) clearTimeout(partnerTypingTimer.current);
      if (myTypingTimer.current) clearTimeout(myTypingTimer.current);
    };
  }, [match.id, currentUserId]);

  useEffect(() => { scrollToBottom(); }, [messages.length, partnerTyping]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (myTypingTimer.current) clearTimeout(myTypingTimer.current);
    myTypingTimer.current = setTimeout(() => {
      channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId } });
    }, 200);
  }

  function handleFocus() {
    setTimeout(() => scrollToBottom(), 350);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageRow = {
      id: tempId, match_id: match.id, sender_id: currentUserId,
      content: text, created_at: new Date().toISOString(),
    };
    setMessages((prev) => {
      const updated = [...prev, optimistic];
      const wasUnlocked = prev.filter((m) => m.sender_id === currentUserId).length >= MIN_MESSAGES_PER_USER && prev.filter((m) => m.sender_id !== currentUserId).length >= MIN_MESSAGES_PER_USER;
      const isUnlocked = updated.filter((m) => m.sender_id === currentUserId).length >= MIN_MESSAGES_PER_USER && updated.filter((m) => m.sender_id !== currentUserId).length >= MIN_MESSAGES_PER_USER;
      if (!wasUnlocked && isUnlocked) {
        setJustUnlocked(true);
        setTimeout(() => setJustUnlocked(false), 4000);
      }
      return updated;
    });

    const { error, messageId } = await sendMessageAction(match.id, text);
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    } else if (messageId) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: messageId } : m)));
    }
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const partnerPronoun =
    match.gender === "female" ? "Ella" : match.gender === "male" ? "Él" : "Él/ella";

  async function confirmUnmatch(reason: string) {
    setUnmatchOpen(false);
    await unmatchAction(match.id, reason);
    router.push("/match");
  }

  return (
    <div className="flex flex-col bg-bg overflow-hidden fixed inset-0">

      {/* ── Header (siempre visible) ── */}
      <div className="shrink-0 bg-bg border-b-[0.5px] border-border">
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <Link href="/chats" aria-label="Volver"
            className="text-rose text-[22px] leading-none px-1 -ml-1 hover:opacity-70">
            ←
          </Link>
          <MatchAvatar matchId={match.id} initial={match.initial} photoUrl={match.photos[0]}
            size="sm" unlocked={unlocked} />
          <div className="flex-1 min-w-0">
            {nameVisible ? (
              <span className="block font-serif text-[16px] text-ink leading-tight">{match.name}</span>
            ) : (
              <div className="h-[18px] w-24 bg-ink/10 rounded-full blur-[3px] my-0.5" />
            )}
            {unlocked && (
              <span className="block text-[10px] text-ink-3 font-light">Desbloqueado</span>
            )}
          </div>
          <button onClick={() => setUnmatchOpen(true)} aria-label="Opciones"
            className="text-ink-3 hover:text-ink-2 px-2 -mr-1 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="6" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18" cy="12" r="1.6" />
            </svg>
          </button>
        </div>

        {/* Tabs Chat / Perfil */}
        <div className="flex">
          {(["chat", "perfil"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-[13px] font-medium tracking-wide capitalize transition-colors relative ${
                tab === t ? "text-ink" : "text-ink-3"
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {tab === t && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-rose rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: CHAT ── */}
      {tab === "chat" && (
        <>
          {/* Contador — desaparece al desbloquear */}
          {!unlocked && (
            <div className="text-[10px] text-ink-3 text-center py-[5px] bg-bg-2 border-b-[0.5px] border-border shrink-0">
              {myRemaining > 0 && `Tú: ${myCount}/${MIN_MESSAGES_PER_USER}`}
              {myRemaining > 0 && partnerRemaining > 0 && " · "}
              {partnerRemaining > 0 && `Tu match: ${partnerCount}/${MIN_MESSAGES_PER_USER}`}
              {myRemaining === 0 && partnerRemaining > 0 && " · Esperando que tu match escriba más"}
              {myRemaining > 0 && partnerRemaining === 0 && " · Tu match ya está listo"}
            </div>
          )}

          {justUnlocked && (
            <div className="px-4 mt-2 shrink-0">
              <div className="animate-fade-up bg-rose-light text-rose-dark border-[0.5px] border-rose-mid rounded-xl px-3.5 py-2.5 text-center font-serif italic text-[14px] leading-[1.4]">
                ¡Ya podéis veros! Las fotos están desbloqueadas.
              </div>
            </div>
          )}

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="flex flex-col justify-end min-h-full px-4 pt-3 pb-2">
              {(() => {
                const items: React.ReactNode[] = [];
                let lastDay = "";
                messages.forEach((m) => {
                  const date = new Date(m.created_at);
                  const dayKey = date.toDateString();
                  const isMe = m.sender_id === currentUserId;
                  if (dayKey !== lastDay) {
                    lastDay = dayKey;
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    const label = date.toDateString() === today.toDateString() ? "Hoy"
                      : date.toDateString() === yesterday.toDateString() ? "Ayer"
                      : date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
                    items.push(
                      <div key={`day-${dayKey}`} className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-[0.5px] bg-bg-3" />
                        <span className="text-[10px] text-ink-3 font-light">{label}</span>
                        <div className="flex-1 h-[0.5px] bg-bg-3" />
                      </div>
                    );
                  }
                  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                  items.push(
                    <div key={m.id} className={`flex flex-col mb-1 ${isMe ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[78%] px-3.5 py-2.5 rounded-[18px] text-[13px] leading-[1.55] font-light ${
                        isMe ? "bg-ink text-bg rounded-br-[4px]" : "bg-bg-2 text-ink rounded-bl-[4px]"
                      }`}>{m.content}</div>
                      <span className="text-[10px] text-ink-3 mt-0.5 px-1">{timeStr}</span>
                    </div>
                  );
                });
                return items;
              })()}

              {partnerTyping && (
                <div className="flex flex-col items-start mb-1">
                  <div className="flex items-center gap-[3px] px-3.5 py-3 bg-bg-2 rounded-[18px] rounded-bl-[4px]">
                    <span className="w-[6px] h-[6px] rounded-full bg-ink-3 animate-typing-dot" style={{ animationDelay: "0ms" }} />
                    <span className="w-[6px] h-[6px] rounded-full bg-ink-3 animate-typing-dot" style={{ animationDelay: "160ms" }} />
                    <span className="w-[6px] h-[6px] rounded-full bg-ink-3 animate-typing-dot" style={{ animationDelay: "320ms" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] border-t-[0.5px] border-border bg-bg shrink-0">
            <input value={input} onChange={handleInputChange} onKeyDown={handleKey} onFocus={handleFocus}
              placeholder="Escribe un mensaje…" disabled={sending}
              className="flex-1 min-w-0 border-[0.5px] border-border-strong rounded-full px-4 py-2.5 text-[16px] font-light bg-bg text-ink outline-none focus:border-rose disabled:opacity-60" />
            <button onClick={send} disabled={!input.trim() || sending} aria-label="Enviar"
              className="shrink-0 w-9 h-9 rounded-full bg-ink text-bg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
              {sending ? <span className="text-[15px] leading-none">…</span> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── Tab: PERFIL ── */}
      {tab === "perfil" && (
        <div className="flex-1 overflow-y-auto pb-6">
          {/* Foto */}
          <div className="relative w-full aspect-[3/4] bg-bg-2 overflow-hidden">
            {match.photos[0] ? (
              <img src={match.photos[0]} alt={match.name}
                className={`w-full h-full object-cover transition-all duration-700 ${unlocked ? "" : "blur-2xl scale-105"}`} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif text-[80px] text-ink-3">{match.initial}</span>
              </div>
            )}
            {!unlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="bg-bg/80 backdrop-blur-sm rounded-2xl px-5 py-3 text-center">
                  <p className="font-serif italic text-[14px] text-ink">Foto bloqueada</p>
                  <p className="text-[11px] text-ink-3 mt-1">Tú {myCount}/{MIN_MESSAGES_PER_USER} · {partnerPronoun} {partnerCount}/{MIN_MESSAGES_PER_USER}</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-5 pb-5 pt-12">
              {nameVisible ? (
                <p className="font-serif text-[24px] text-white font-medium">{match.name}</p>
              ) : (
                <div className="h-7 w-32 bg-white/20 rounded-full blur-[4px] mb-1" />
              )}
              {match.short && <p className="text-[13px] text-white/70 font-light">{match.short}</p>}
            </div>
          </div>

          <div className="px-5 pt-5 flex flex-col gap-4">
            {/* Compatibilidad */}
            {match.compatibility > 0 && (
              <div className="bg-rose-light border-[0.5px] border-rose-mid rounded-2xl px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-rose-dark mb-2">Compatibilidad</p>
                <div className="flex items-center gap-3">
                  <span className="font-serif text-[32px] text-rose font-medium leading-none">{match.compatibility}%</span>
                  <div className="flex-1 flex flex-col gap-1.5">
                    {match.breakdown.map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-[10px] text-rose-dark mb-0.5">
                          <span>{b.label}</span><span>{b.pct}%</span>
                        </div>
                        <div className="h-1 bg-rose-mid rounded-full overflow-hidden">
                          <div className="h-full bg-rose rounded-full" style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sobre él/ella */}
            {match.self_description && (
              <div className="bg-bg-2 rounded-2xl px-4 py-4 overflow-hidden">
                <p className="text-[10px] uppercase tracking-widest text-ink-3 mb-2">{nameVisible ? `Sobre ${match.name.split(" ")[0]}` : "Sobre este perfil"}</p>
                <ReadMoreText text={match.self_description} />
              </div>
            )}

            {/* Valores */}
            {match.values.length > 0 && (
              <div className="bg-bg-2 rounded-2xl px-4 py-4">
                <p className="text-[10px] uppercase tracking-widest text-ink-3 mb-3">Valores</p>
                <div className="flex flex-wrap gap-2">
                  {match.values.map((v) => (
                    <span key={v} className={`px-3 py-1 rounded-full text-[12px] border-[0.5px] ${
                      match.sharedTags.includes(v)
                        ? "bg-rose-light text-rose-dark border-rose-mid font-medium"
                        : "bg-bg border-border text-ink-2"
                    }`}>{v}</span>
                  ))}
                </div>
                {match.sharedTags.length > 0 && (
                  <p className="text-[10px] text-rose-dark mt-2">
                    {match.sharedTags.length} valor{match.sharedTags.length > 1 ? "es" : ""} en común
                  </p>
                )}
              </div>
            )}

            {/* Lo que busca */}
            {match.partner_description && (
              <div className="bg-bg-2 rounded-2xl px-4 py-4 overflow-hidden">
                <p className="text-[10px] uppercase tracking-widest text-ink-3 mb-2">Lo que busca</p>
                <ReadMoreText text={match.partner_description} />
              </div>
            )}
          </div>
        </div>
      )}

      <UnmatchSheet matchName={nameVisible ? match.name : "Tu match"} open={unmatchOpen}
        onClose={() => setUnmatchOpen(false)} onConfirm={confirmUnmatch} />
    </div>
  );
}
