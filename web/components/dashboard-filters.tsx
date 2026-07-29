"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProjectOption } from "@/lib/queries";

export function DashboardFilters({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get("project") ?? "";

  if (projects.length === 0) return null;

  function updateProject(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("project", value);
    } else {
      params.delete("project");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <select
      value={selected}
      onChange={(e) => updateProject(e.target.value)}
      className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
    >
      <option value="">All projects</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}
