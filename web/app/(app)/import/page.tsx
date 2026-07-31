import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IMPORT_TEMPLATES } from "@/lib/imports";
import { ImportForm } from "@/components/import-form";

export default async function ImportPage() {
  const session = await auth();
  const existingProjects = await prisma.project.findMany({
    where: { userId: session!.user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-7 py-8">
      <h1 className="mb-1.5 text-xl font-semibold tracking-tight">
        Import time entries
      </h1>
      <p className="mb-6.5 text-[13px] text-muted">
        Bring in time tracked elsewhere. You&apos;ll get to attach each
        imported project to an existing one (or create a new one) before
        anything is saved, and it&apos;s tagged by source so you can filter it
        out of the AI-tracking stats on the dashboard.
      </p>

      <div className="rounded-xl border border-border bg-surface p-5.5">
        <ImportForm templates={IMPORT_TEMPLATES} existingProjects={existingProjects} />
      </div>
    </div>
  );
}
