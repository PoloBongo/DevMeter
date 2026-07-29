"use client";

import { useState } from "react";
import { deleteProjectAction } from "@/app/(app)/dashboard/actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer rounded-lg border border-border px-3.5 py-2 text-[13px] text-muted hover:border-red-500/40 hover:text-red-400"
      >
        Delete project
      </button>
    );
  }

  return (
    <form
      action={deleteProjectAction}
      className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <span className="text-[12.5px] text-red-400">
        Delete this project and all its sessions?
      </span>
      <button
        type="submit"
        className="cursor-pointer rounded-md bg-red-500 px-2.5 py-1 text-[12px] font-semibold text-white"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="cursor-pointer text-[12px] text-muted"
      >
        Cancel
      </button>
    </form>
  );
}
