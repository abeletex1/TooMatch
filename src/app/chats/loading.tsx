import MobileShell from "@/components/ui/MobileShell";
import ScrollLayout from "@/components/ui/ScrollLayout";

function ChatRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b-[0.5px] border-border">
      {/* Avatar */}
      <div className="w-[38px] h-[38px] rounded-full bg-bg-3 animate-pulse shrink-0" />
      {/* Texto */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="h-[14px] w-28 rounded-md bg-bg-3 animate-pulse" />
        <div className="h-[12px] w-44 rounded-md bg-bg-3 animate-pulse" />
      </div>
      {/* Hora */}
      <div className="h-[10px] w-8 rounded-md bg-bg-3 animate-pulse shrink-0" />
    </div>
  );
}

export default function ChatsLoading() {
  return (
    <MobileShell>
      <ScrollLayout>
        {Array.from({ length: 6 }).map((_, i) => (
          <ChatRowSkeleton key={i} />
        ))}
      </ScrollLayout>
    </MobileShell>
  );
}
