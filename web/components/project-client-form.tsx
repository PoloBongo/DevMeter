"use client";

import { useState } from "react";
import { updateProjectClientAction } from "@/app/(app)/dashboard/actions";
import { useToast } from "@/components/toast-provider";

export function ProjectClientForm({
  projectId,
  clientName,
}: {
  projectId: string;
  clientName: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const toast = useToast();

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="cursor-pointer text-[13px] text-muted hover:text-foreground"
      >
        {clientName ?? "No client — add one"}
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateProjectClientAction(formData);
        setEditing(false);
        toast("Client updated");
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="clientName"
        placeholder="Client name"
        defaultValue={clientName ?? ""}
        autoFocus
        className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-accent/50"
      />
      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-accent px-2.5 py-1.5 text-[12.5px] font-semibold text-background"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="cursor-pointer text-[12.5px] text-muted"
      >
        Cancel
      </button>
    </form>
  );
}
