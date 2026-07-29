"use client";

import { useState } from "react";
import { deleteSessionAction } from "@/app/(app)/dashboard/actions";

export function DeleteSessionButton({
  sessionId,
  projectId,
}: {
  sessionId: string;
  projectId: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Delete session"
        className="cursor-pointer rounded-md p-1 text-dim hover:text-red-400"
      >
        ✕
      </button>
    );
  }

  return (
    <form action={deleteSessionAction} className="flex items-center gap-1">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        className="cursor-pointer rounded-md bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="cursor-pointer text-[11px] text-muted"
      >
        Cancel
      </button>
    </form>
  );
}
