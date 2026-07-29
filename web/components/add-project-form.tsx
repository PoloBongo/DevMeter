"use client";

import { useRef, useState } from "react";
import { createProjectAction } from "@/app/(app)/dashboard/actions";

export function AddProjectForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-background"
      >
        + Add project
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createProjectAction(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="flex items-center gap-2"
    >
      <input
        name="name"
        placeholder="Project name"
        required
        autoFocus
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent/50"
      />
      <input
        name="clientName"
        placeholder="Client (optional)"
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent/50"
      />
      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-background"
      >
        Create
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="cursor-pointer rounded-lg border border-border px-3.5 py-2 text-[13px] text-muted"
      >
        Cancel
      </button>
    </form>
  );
}
