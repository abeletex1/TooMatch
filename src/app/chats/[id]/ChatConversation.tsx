"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MatchAvatar from "@/components/ui/MatchAvatar";
import UnmatchSheet from "@/components/ui/UnmatchSheet";
import { UNLOCK_AFTER_MESSAGES } from "@/lib/mock/matches";
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
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [unmatchOpen, setUnmatchOpen] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<typeof createClient> extends { channel: (...args: unknown[]) => infer C } ? C : never>(null);
  const partnerTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalMessages = messages.length;
  const unlocked = totalMessages >= UNLOCK_AFTER_MESSAGES;
  const remaining = Math.max(0, UNLOCK_AFTER_MESSAGES - totalMessages);

  function scrollToBottom(smooth = true) {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  }

  useEffect(() => {
    if (isUnmatched) router.push("/match");
  }, [isUnmatched, router]);

  // Realtime: mensajes nuevos + indicador de escritura via broadcast
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const updated = [...prev, newMsg];
            if (
              prev.length < UNLOCK_AFTER_MESSAGES &&
              updated.length >= UNLOCK_AFTER_MESSAGES
            ) {
              setJustUnlocked(true);
              setTimeout(() => setJustUnlocked(false), 4000);
            }
            return updated;
          });
          // Ocultar indicador de escritura cuando llega el mensaje
          setPartnerTyping(false);
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId === currentUserId) return;
        setPartnerTyping(true);
        if (partnerTypingTimer.current) clearTimeout(partnerTypingTimer.current);
        partnerTypingTimer.current = setTimeout(() => setPartnerTyping(false), 3000);
      })
      .subscribe();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (channelRef as any).current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (partnerTypingTimer.current) clearTimeout(partnerTypingTimer.current);
      if (myTypingTimer.current) clearTimeout(myTypingTimer.current);
    };
  }, [match.id, currentUserId]);

  // Scroll al llegar mensajes nuevos o al aparecer el indicador de escritura
  useEffect(() => {
    scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, partnerTyping]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);

    // Broadcast typing con debounce para no saturar
    if (myTypingTimer.current) clearTimeout(myTypingTimer.current);
    myTypingTimer.current = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (channelRef as any).current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId },
      });
    }, 200);
  }

  function handleFocus() {
    // Esperar a que el teclado termine de abrirse antes de hacer scroll
    setTimeout(() => scrollToBottom(), 350);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageRow = {
      id: tempId,
      match_id: match.id,
      sender_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => {
      const updated = [...prev, optimistic];
      if (
        prev.length < UNLOCK_AFTER_MESSAGES &&
        updated.length >= UNLOCK_AFTER_MESSAGES
      ) {
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
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: messageId } : m))
      );
    }

    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function confirmUnmatch(reason: string) {
    setUnmatchOpen(false);
    await unmatchAction(match.id, reason);
    router.push("/match");
  }

  const headerInner = (
    <>
      <MatchAvatar
        matchId={match.id}
        initial={match.initial}
        photoUrl={match.photos[0]}
        size="sm"
        unlocked={unlocked}
      />
      <div className="flex-1 min-w-0">
        <span className="block font-serif text-[16px] text-ink leading-tight">
          {match.name}
        </span>
        <span className="block text-[10px] text-ink-3 font-light">
          {unlocked
            ? "Toca para ver su perfil"
            : `${remaining} mensaje${remaining === 1 ? "" : "s"} para conoceros más`}
        </span>
      </div>
    </>
  );

  return (
    <div className="flex flex-col bg-bg w-full overflow-hidden" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b-[0.5px] border-border bg-bg shrink-0">
        <Link
          href="/chats"
          aria-label="Volver"
          className="text-rose text-[22px] leading-none px-1 -ml-1 hover:opacity-70"
        >
          ←
        </Link>
        {unlocked ? (
          <Link
            href={`/match-profile/${match.id}?unlocked`}
            className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-90"
          >
            {headerInner}
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {headerInner}
          </div>
        )}

        <button
          onClick={() => setUnmatchOpen(true)}
          aria-label="Opciones"
          className="text-ink-3 hover:text-ink-2 px-2 -mr-1 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="6" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="18" cy="12" r="1.6" />
          </svg>
        </button>
      </div>

      {/* Contador */}
      <div className="text-[10px] text-ink-3 text-center py-[5px] bg-bg-2 border-b-[0.5px] border-border shrink-0">
        {totalMessages} / {UNLOCK_AFTER_MESSAGES} mensajes
      </div>

      {/* Unlock badge */}
      {justUnlocked && (
        <div className="px-4 mt-2 shrink-0">
          <div className="animate-fade-up bg-rose-light text-rose-dark border-[0.5px] border-rose-mid rounded-xl px-3.5 py-2.5 text-center font-serif italic text-[14px] leading-[1.4]">
            ¡{UNLOCK_AFTER_MESSAGES} mensajes! Ya podéis veros — toca su nombre.
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

            // Separador de día
            if (dayKey !== lastDay) {
              lastDay = dayKey;
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const label =
                date.toDateString() === today.toDateString()
                  ? "Hoy"
                  : date.toDateString() === yesterday.toDateString()
                  ? "Ayer"
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
              <div
                key={m.id}
                className={`flex flex-col mb-1 ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-[18px] text-[13px] leading-[1.55] font-light ${
                    isMe
                      ? "bg-ink text-bg rounded-br-[4px]"
                      : "bg-bg-2 text-ink rounded-bl-[4px]"
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[10px] text-ink-3 mt-0.5 px-1">{timeStr}</span>
              </div>
            );
          });

          return items;
        })()}

        {/* Indicador de escritura */}
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
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKey}
          onFocus={handleFocus}
          placeholder="Escribe un mensaje…"
          disabled={sending}
          className="flex-1 min-w-0 border-[0.5px] border-border-strong rounded-full px-4 py-2.5 text-[16px] font-light bg-bg text-ink outline-none focus:border-rose disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="shrink-0 w-9 h-9 rounded-full bg-ink text-bg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          aria-label="Enviar"
        >
          {sending ? (
            <span className="text-[15px] leading-none">…</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Sheet de unmatch */}
      <UnmatchSheet
        matchName={match.name}
        open={unmatchOpen}
        onClose={() => setUnmatchOpen(false)}
        onConfirm={confirmUnmatch}
      />
    </div>
  );
}
