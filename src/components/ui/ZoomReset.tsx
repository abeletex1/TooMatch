"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function resetZoom() {
  // iOS Safari ignores user-scalable=no since iOS 10.
  // The only reliable way to reset manual pinch-zoom is to temporarily
  // swap the viewport meta tag content, forcing a layout recalculation.
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) return;

  const original = meta.getAttribute("content") ?? "width=device-width, initial-scale=1";

  // Step 1: set initial-scale=1 explicitly to snap zoom back to 1x
  meta.setAttribute(
    "content",
    "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"
  );

  // Step 2: restore original after two animation frames so the reset sticks
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      meta.setAttribute("content", original);
    });
  });
}

export default function ZoomReset() {
  const pathname = usePathname();

  // Reset on every route change
  useEffect(() => {
    resetZoom();
  }, [pathname]);

  return null;
}
