"use client";

import { useState, useTransition } from "react";
import { regenerateApiKeyAction } from "@/app/(app)/settings/actions";

export function ApiKeySection({
  hasKey,
  maskedPrefix,
}: {
  hasKey: boolean;
  maskedPrefix: string | null;
}) {
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [pending, startTransition] = useTransition();

  function handleRegenerate() {
    startTransition(async () => {
      const { apiKey } = await regenerateApiKeyAction();
      setRevealedKey(apiKey);
      setCopyLabel("Copy");
    });
  }

  function handleCopy() {
    if (!revealedKey) return;
    void navigator.clipboard.writeText(revealedKey);
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy"), 1500);
  }

  const displayValue =
    revealedKey ??
    (maskedPrefix ? `${maskedPrefix}${"•".repeat(24)}` : "No API key yet");

  return (
    <div className="rounded-xl border border-border bg-surface p-5.5">
      <div className="mb-1 text-[14.5px] font-semibold">Local collector</div>
      <p className="mb-4 text-[13px] leading-relaxed text-muted">
        Connect the DevMeter CLI on your machine to start tracking sessions
        automatically as you code with Claude Code.
      </p>

      {revealedKey && (
        <div className="mb-3 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-[12.5px] text-accent">
          Copy this key now — it won&apos;t be shown again.
        </div>
      )}

      <div className="mb-1.5 text-xs text-muted">API key</div>
      <div className="mb-4 flex gap-2">
        <div className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-[13px] text-foreground-secondary">
          {displayValue}
        </div>
        {revealedKey && (
          <button
            onClick={handleCopy}
            className="rounded-lg border border-border px-3.5 text-[12.5px] text-foreground"
          >
            {copyLabel}
          </button>
        )}
        <button
          onClick={handleRegenerate}
          disabled={pending}
          className="rounded-lg border border-border px-3.5 text-[12.5px] text-foreground disabled:opacity-50"
        >
          {pending ? "…" : hasKey ? "Regenerate" : "Generate"}
        </button>
      </div>

      {revealedKey && (
        <>
          <div className="mb-1.5 text-xs text-muted">
            Install the collector
          </div>
          <div className="rounded-lg border border-border bg-background px-3.5 py-3 font-mono text-[12.5px] text-accent">
            devmeter login {revealedKey}
          </div>
        </>
      )}
    </div>
  );
}
