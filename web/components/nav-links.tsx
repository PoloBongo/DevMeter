"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex gap-5.5">
      {LINKS.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname.startsWith("/dashboard")
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm ${active ? "text-foreground" : "text-muted hover:text-foreground"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
