"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/ui/MobileShell";
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const totalMessages = messages.length;
  const unlocked = totalMessages >= UNLOCK_AFTER_MESSAGES;
  const remaining = Math.max(0, UNLOCK_AFTER_MESSAGES - totalMessages);

  // Redirigir si ya está desmatched
  useEffect(() => {
    if (isUnmatched) router.push("/match");
  }, [isUnmatched, router]);

  // Suscripción Realtime para mensajes nuevos
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages-${match.id}`)
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
            // Detectar desbloqueo
            if (
              prev.length < UNLOCK_AFTER_MESSAGES &&
              updated.length >= UNLOCK_AFTER_MESSAGES
            ) {
              setJustUnlocked(true);
              setTimeout(() => setJustUnlocked(false), 4000);
            }
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id]);

  // Autoscroll al último mensaje
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    // Optimistic: añadir mensaje local antes de recibir el evento Realtime
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
      // Revertir optimistic si falla
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    } else if (messageId) {
      // Reemplazar tempId con el ID real (el Realtime también puede llegar)
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
    // Chat usa height fija al viewport visual para que el teclado móvil no
    // empuje el layout — el input se ancla abajo y los mensajes hacen scroll.
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

      {/* Unlock badge animada */}
      {justUnlocked && (
        <div className="px-4 mt-2 shrink-0">
          <div className="animate-fade-up bg-rose-light text-rose-dark border-[0.5px] border-rose-mid rounded-xl px-3.5 py-2.5 text-center font-serif italic text-[14px] leading-[1.4]">
            ¡{UNLOCK_AFTER_MESSAGES} mensajes! Ya podéis veros — toca su nombre.
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col gap-2 px-4 py-3 overflow-y-auto"
      >
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={`max-w-[78%] px-3.5 py-2.5 rounded-[18px] text-[13px] leading-[1.55] font-light ${
                isMe
                  ? "bg-ink text-bg self-end rounded-br-[4px]"
                  : "bg-bg-2 text-ink self-start rounded-bl-[4px]"
              }`}
            >
              {m.content}
            </div>
          );
        })}
      </div>

      {/* Input — shrink-0 para que nunca se comprima cuando sube el teclado */}
      <div className="flex gap-2 px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] border-t-[0.5px] border-border bg-bg shrink-0 overflow-hidden">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe un mensaje…"
          disabled={sending}
          className="flex-1 min-w-0 border-[0.5px] border-border-strong rounded-xl px-3.5 py-2.5 text-[13px] font-light bg-bg text-ink outline-none focus:border-rose disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="px-4 py-2.5 rounded-xl bg-ink text-bg text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        >
          {sending ? "…" : "Enviar"}
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
