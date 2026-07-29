"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";

/**
 * Fires a toast for a message passed via `?toast=...` on the URL, then
 * strips the param — for server actions that `redirect()` and so can't
 * just call the toast function directly client-side after an await.
 */
export function ToastFromQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const message = searchParams.get("toast");
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!message || firedFor.current === message) return;
    firedFor.current = message;
    toast(message);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    router.replace(params.toString() ? `${pathname}?${params}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return null;
}
