"use client";

import Link from "next/link";
import MatchAvatar from "@/components/ui/MatchAvatar";

export type ChatRow = {
  id: string;
  initial: string;
  photoUrl?: string;
  name: string;
  preview: string;
  time: string;
  hasUnread: boolean;
};

export default function ChatsListClient({ chats }: { chats: ChatRow[] }) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-7 text-center py-16">
        <p className="font-serif italic text-[16px] text-ink-3">
          Aún no hay conversaciones.
        </p>
        <p className="text-[12px] text-ink-3 font-light mt-2 max-w-[260px]">
          Cuando empieces a hablar con tu match aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <>
      {chats.map((c) => (
        <Link
          key={c.id}
          href={`/chats/${c.id}`}
          className="flex items-center gap-3 px-5 py-3.5 border-b-[0.5px] border-border hover:bg-bg-2 transition-colors"
        >
          <MatchAvatar
            matchId={c.id}
            initial={c.initial}
            photoUrl={c.photoUrl}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className={`text-[14px] truncate ${c.hasUnread ? "text-ink font-semibold" : "text-ink font-medium"}`}>
              {c.name}
            </p>
            <p className={`text-[12px] font-light truncate ${c.hasUnread ? "text-ink-2" : "text-ink-3"}`}>
              {c.preview}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[10px] text-ink-3">{c.time}</span>
            {c.hasUnread && <span className="w-[7px] h-[7px] rounded-full bg-rose" />}
          </div>
        </Link>
      ))}
    </>
  );
}
