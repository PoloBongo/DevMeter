import { redirect } from "next/navigation";
import { auth, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrgMemberStats } from "@/lib/queries";
import { formatDuration } from "@/lib/format";
import { formatMoney } from "@/lib/currency";

export default async function TeamPage() {
  const session = await auth();
  const user = await requireUser(session!.user.id);

  const org = await prisma.organization.findUnique({
    where: { ownerId: user.id },
  });
  if (!org) redirect("/dashboard");

  const members = await getOrgMemberStats(org.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-7 py-8">
      <h1 className="text-xl font-semibold tracking-tight">{org.name}</h1>
      <p className="mb-6.5 mt-1 text-[13px] text-muted">
        Admin-only rollup — each member keeps their own rate, currency, and
        private projects. Figures below are this month, in each member&apos;s
        own display currency.
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr] px-5.5 py-3 text-[11.5px] uppercase tracking-wide text-muted border-b border-border">
          <span>Member</span>
          <span>Joined</span>
          <span>Time (mo.)</span>
          <span>AI cost (mo.)</span>
          <span>Total cost (mo.)</span>
        </div>

        {members.map((member) => (
          <div
            key={member.userId}
            className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr] items-center px-5.5 py-3.5 border-b border-border/60 last:border-b-0"
          >
            <span className="text-[13.5px]">{member.email}</span>
            <span className="font-mono text-[12.5px] text-muted">
              {member.joinedAt.toLocaleDateString()}
            </span>
            <span className="font-mono text-[13px]">
              {formatDuration(member.monthMinutes)}
            </span>
            <span className="font-mono text-[13px] text-accent">
              {formatMoney(member.monthAiCost, member.currency)}
            </span>
            <span className="font-mono text-[13px] font-semibold">
              {formatMoney(member.monthTotalCost, member.currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
