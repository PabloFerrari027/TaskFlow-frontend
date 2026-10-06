"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PARAM = "itemId";

// Backed by the URL so the side panel survives refreshes and is shareable,
// like Asana's item pane. Works from any page nested under a folder layout.
export function useItemPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openItemId = searchParams.get(PARAM);

  const openItem = useCallback(
    (itemId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(PARAM, itemId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const closeItem = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(PARAM);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return { openItemId, openItem, closeItem };
}
