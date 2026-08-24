"use client";

import { useRef, useState, useTransition } from "react";
import {
  confirmImportAction,
  parseImportFileAction,
  undoImportAction,
  type ImportedEntryWire,
  type ImportResult,
} from "@/app/(app)/import/actions";
import { useToast } from "@/components/toast-provider";
import { useTopLoaderPending } from "@/lib/use-top-loader-pending";

type ExistingProject = { id: string; name: string };

type ParsedState = {
  templateId: string;
  entries: ImportedEntryWire[];
  projectNames: string[];
};

const NEW_PROJECT = "new";

export function ImportForm({
  templates,
  existingProjects,
}: {
  templates: { id: string; label: string }[];
  existingProjects: ExistingProject[];
}) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [parsed, setParsed] = useState<ParsedState | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingUndo, setConfirmingUndo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  useTopLoaderPending(pending);

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("templateId", templateId);
    formData.set("file", file);

    setError(null);
    startTransition(async () => {
      try {
        const res = await parseImportFileAction(formData);
        setParsed(res);
        setMapping(Object.fromEntries(res.projectNames.map((n) => [n, NEW_PROJECT])));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't read that file.");
      }
    });
  }

  function handleConfirm() {
    if (!parsed) return;
    const formData = new FormData();
    formData.set("templateId", parsed.templateId);
    formData.set("entriesJson", JSON.stringify(parsed.entries));
    formData.set("mappingJson", JSON.stringify(mapping));

    setError(null);
    startTransition(async () => {
      try {
        const res = await confirmImportAction(formData);
        setResult(res);
        setParsed(null);
        toast(`Imported ${res.sessionCount} entries`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed.");
      }
    });
  }

  function handleUndo() {
    if (!result) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("batchId", result.batchId);
      await undoImportAction(formData);
      setResult(null);
      setConfirmingUndo(false);
      toast("Import undone");
    });
  }

  if (templates.length === 0) {
    return (
      <p className="text-[13px] text-muted">No import templates available yet.</p>
    );
  }

  // Step 2: map each Clockify project name to an existing project or "create new".
  if (parsed) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-muted">
          {parsed.entries.length} entries across {parsed.projectNames.length}{" "}
          project{parsed.projectNames.length === 1 ? "" : "s"}. Attach each to
          an existing project, or create a new one.
        </p>

        <div className="flex flex-col gap-2.5">
          {parsed.projectNames.map((name) => (
            <div key={name} className="flex items-center justify-between gap-3">
              <span className="text-[13px]">{name}</span>
              <select
                value={mapping[name] ?? NEW_PROJECT}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, [name]: e.target.value }))
                }
                className="cursor-pointer rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[12.5px] text-foreground outline-none"
              >
                <option value={NEW_PROJECT}>Create new project &quot;{name}&quot;</option>
                {existingProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    Attach to {p.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {error && <p className="text-[12.5px] text-error-text">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="cursor-pointer rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Importing…" : "Confirm import"}
          </button>
          <button
            type="button"
            onClick={() => setParsed(null)}
            className="cursor-pointer rounded-lg border border-border px-3.5 py-2.5 text-[13px] text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleUpload} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Source format</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-fit cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">File</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            required
            className="text-[13px] text-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-surface-2 file:px-3 file:py-2 file:text-[13px] file:text-foreground"
          />
          <span className="text-[11.5px] text-dim">
            Export as .xlsx from Clockify&apos;s &quot;Detailed report&quot; (CSV isn&apos;t supported).
          </span>
        </div>

        {error && <p className="text-[12.5px] text-error-text">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer self-start rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Reading…" : "Continue"}
        </button>
      </form>

      {result && (
        <div className="rounded-lg border border-accent/25 bg-accent/10 px-4 py-3 text-[13px] text-accent">
          <p className="mb-2">
            Imported {result.sessionCount} entries across {result.projectCount}{" "}
            project{result.projectCount === 1 ? "" : "s"}.
          </p>
          {!confirmingUndo ? (
            <button
              type="button"
              onClick={() => setConfirmingUndo(true)}
              className="cursor-pointer text-[12px] text-dim hover:text-foreground"
            >
              Undo this import
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[12px]">Delete these {result.sessionCount} entries?</span>
              <button
                type="button"
                onClick={handleUndo}
                disabled={pending}
                className="cursor-pointer rounded-md bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmingUndo(false)}
                className="cursor-pointer text-[11px] text-muted"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
