"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-start gap-3 px-7 py-16">
      <h1 className="text-lg font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-[13px] text-muted">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="cursor-pointer rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-semibold text-background"
      >
        Try again
      </button>
    </div>
  );
}
