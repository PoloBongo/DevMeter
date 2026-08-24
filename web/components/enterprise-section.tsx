"use client";

import Link from "next/link";
import { enableEnterpriseModeAction } from "@/app/(app)/settings/actions";
import { useToast } from "@/components/toast-provider";
import { SubmitButton } from "@/components/submit-button";

export function EnterpriseSection({
  domain,
  eligible,
  organizationName,
  isOwner,
}: {
  domain: string;
  eligible: boolean;
  organizationName: string | null;
  isOwner: boolean;
}) {
  const toast = useToast();

  if (organizationName) {
    return (
      <div className="text-[13px]">
        <p className="text-muted">
          Part of <span className="text-foreground">{organizationName}</span>.
        </p>
        {isOwner && (
          <Link
            href="/team"
            className="mt-2 inline-block text-accent hover:underline"
          >
            View team rollup →
          </Link>
        )}
      </div>
    );
  }

  if (!eligible) {
    return (
      <p className="text-[13px] text-dim">
        Not available for @{domain} addresses — enterprise mode groups
        teammates by a company email domain.
      </p>
    );
  }

  return (
    <form
      action={async () => {
        await enableEnterpriseModeAction();
        toast("Enterprise mode enabled");
      }}
    >
      <SubmitButton
        pendingLabel="Enabling…"
        className="cursor-pointer rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-semibold text-background"
      >
        Enable enterprise mode for @{domain}
      </SubmitButton>
    </form>
  );
}
