"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function ProjectFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const range = searchParams.get("range") ?? "30";
  const q = searchParams.get("q") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <select
        value={range}
        onChange={(e) => updateParam("range", e.target.value)}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
      >
        <option value="30">Last 30 days</option>
        <option value="7">Last 7 days</option>
        <option value="all">All time</option>
      </select>
      <input
        defaultValue={q}
        onChange={(e) => updateParam("q", e.target.value)}
        placeholder="Search by ticket or branch…"
        className="w-65 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent/50"
      />
    </div>
  );
}
