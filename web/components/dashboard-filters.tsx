"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProjectOption } from "@/lib/queries";

export function DashboardFilters({
  projects,
  clients,
  sources,
  defaultFrom,
  defaultTo,
}: {
  projects: ProjectOption[];
  clients: string[];
  sources: { value: string; label: string }[];
  /** YYYY-MM-DD fallback shown in the custom-range inputs until the user picks their own. */
  defaultFrom: string;
  defaultTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedProject = searchParams.get("project") ?? "";
  const selectedClient = searchParams.get("client") ?? "";
  const selectedSource = searchParams.get("source") ?? "";
  const selectedPeriod = searchParams.get("period") ?? "month";
  const selectedFrom = searchParams.get("from") ?? defaultFrom;
  const selectedTo = searchParams.get("to") ?? defaultTo;

  if (projects.length === 0) return null;

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function updateParam(key: string, value: string) {
    updateParams({ [key]: value });
  }

  return (
    <div className="flex items-center gap-2.5">
      <select
        value={selectedPeriod === "month" ? "" : selectedPeriod}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "custom") {
            // Seed from/to right away so the date inputs below have a
            // concrete range in the URL as soon as "Custom range" is picked.
            updateParams({ period: value, from: selectedFrom, to: selectedTo });
          } else {
            updateParams({ period: value, from: "", to: "" });
          }
        }}
        className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
      >
        <option value="">This month</option>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="all">All time</option>
        <option value="custom">Custom range</option>
      </select>
      {selectedPeriod === "custom" && (
        <>
          <input
            type="date"
            value={selectedFrom}
            max={selectedTo}
            onChange={(e) => updateParam("from", e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
          />
          <span className="text-[13px] text-muted">→</span>
          <input
            type="date"
            value={selectedTo}
            min={selectedFrom}
            onChange={(e) => updateParam("to", e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
          />
        </>
      )}
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
      {sources.length > 0 && (
        <select
          value={selectedSource}
          onChange={(e) => updateParam("source", e.target.value)}
          className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
        >
          <option value="">All sources</option>
          {sources.map((source) => (
            <option key={source.value} value={source.value}>
              {source.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
