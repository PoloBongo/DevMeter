"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProjectOption } from "@/lib/queries";

export function DashboardFilters({
  projects,
  clients,
}: {
  projects: ProjectOption[];
  clients: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedProject = searchParams.get("project") ?? "";
  const selectedClient = searchParams.get("client") ?? "";

  if (projects.length === 0) return null;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-2.5">
      <select
        value={selectedProject}
        onChange={(e) => updateParam("project", e.target.value)}
        className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
      >
        <option value="">All projects</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      {clients.length > 0 && (
        <select
          value={selectedClient}
          onChange={(e) => updateParam("client", e.target.value)}
          className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
        >
          <option value="">All clients</option>
          {clients.map((client) => (
            <option key={client} value={client}>
              {client}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
