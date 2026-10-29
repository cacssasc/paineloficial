import { useEffect } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { captureVisitUtms } from "@/lib/utm";

export function UtmAttribution() {
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location });
  useEffect(() => {
    if (location.pathname.startsWith("/admin") || location.pathname === "/auth") return;
    const utms = captureVisitUtms(location.searchStr);
    const currentSearch: Record<string, unknown> = location.search;
    if (Object.entries(utms).some(([key, value]) => String(currentSearch[key] ?? "") !== value)) {
      void router.navigate({ to: location.pathname, search: { ...location.search, ...utms }, replace: true, resetScroll: false });
    }
  }, [router, location.pathname, location.searchStr, location.search]);
  return null;
}