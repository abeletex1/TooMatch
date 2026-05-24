import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import BottomNav from "@/components/ui/BottomNav";

export default function MatchLoading() {
  return (
    <MobileShell>
      <Topbar />
      <main className="flex flex-col flex-1 px-7 pt-6 pb-4 gap-6 overflow-y-auto">
        {/* Título */}
        <div className="flex flex-col gap-2">
          <div className="h-[12px] w-20 rounded-md bg-bg-3 animate-pulse" />
          <div className="h-[28px] w-48 rounded-md bg-bg-3 animate-pulse" />
        </div>

        {/* Card match */}
        <div className="rounded-2xl bg-bg-2 border border-border overflow-hidden">
          {/* Avatar grande */}
          <div className="w-full aspect-square bg-bg-3 animate-pulse" />
          <div className="p-4 flex flex-col gap-2">
            <div className="h-[16px] w-32 rounded-md bg-bg-3 animate-pulse" />
            <div className="h-[12px] w-24 rounded-md bg-bg-3 animate-pulse" />
            <div className="h-[36px] w-full rounded-xl bg-bg-3 animate-pulse mt-2" />
          </div>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
