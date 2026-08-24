"use client";

import { useEffect, useRef } from "react";
import { useTopLoader } from "nextjs-toploader";

/**
 * Starts/completes the global top-loading bar for any async action tracked
 * by a boolean pending flag — `useFormStatus().pending`, `useTransition()`'s
 * `isPending`, etc. Covers actions that don't change the URL (server action
 * form submits, manual `startTransition` calls), which the router-driven
 * top-loader on its own never sees.
 */
export function useTopLoaderPending(pending: boolean) {
  const loader = useTopLoader();
  const started = useRef(false);

  useEffect(() => {
    if (pending) {
      started.current = true;
      loader.start();
    } else if (started.current) {
      started.current = false;
      loader.done();
    }
    // loader is a fresh object from the hook each render; keying off pending
    // alone is intentional so this only fires on actual pending transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);
}
