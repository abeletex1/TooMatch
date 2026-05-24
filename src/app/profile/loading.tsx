import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import BottomNav from "@/components/ui/BottomNav";

export default function ProfileLoading() {
  return (
    <MobileShell>
      <Topbar />
      <main className="flex flex-col flex-1 overflow-y-auto pb-6">
        {/* Foto de perfil */}
        <div className="flex flex-col items-center pt-8 pb-6 px-7 gap-3">
          <div className="w-20 h-20 rounded-full bg-bg-3 animate-pulse" />
          <div className="h-[18px] w-32 rounded-md bg-bg-3 animate-pulse" />
          <div className="h-[12px] w-20 rounded-md bg-bg-3 animate-pulse" />
        </div>

        {/* Secciones */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mx-5 mb-3 rounded-2xl bg-bg-2 border border-border p-4 flex flex-col gap-2">
            <div className="h-[12px] w-24 rounded-md bg-bg-3 animate-pulse" />
            <div className="h-[14px] w-full rounded-md bg-bg-3 animate-pulse" />
            <div className="h-[14px] w-3/4 rounded-md bg-bg-3 animate-pulse" />
          </div>
        ))}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
