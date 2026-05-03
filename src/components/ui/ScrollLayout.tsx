"use client";

import { useRef, ReactNode } from "react";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";

export default function ScrollLayout({
  topbarRight,
  topbarBack,
  bottomNav = true,
  children,
}: {
  topbarRight?: ReactNode;
  topbarBack?: string;
  bottomNav?: boolean;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLElement>(null);

  return (
    <>
      <Topbar right={topbarRight} back={topbarBack} scrollRef={scrollRef} />
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        {children}
      </main>
      {bottomNav && <BottomNav />}
    </>
  );
}
