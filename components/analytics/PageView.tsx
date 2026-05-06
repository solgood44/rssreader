"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { gaPageView } from "@/lib/analytics";

export function PageView() {
  const pathname = usePathname();
  const sp = useSearchParams();

  useEffect(() => {
    const qs = sp.toString();
    gaPageView(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, sp]);

  return null;
}

