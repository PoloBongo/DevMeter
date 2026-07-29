import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOutAction } from "@/lib/auth";
import { NavLinks } from "@/components/nav-links";
import { ToastProvider } from "@/components/toast-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const initials = session.user.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <ToastProvider>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border bg-nav px-7">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-5.5 w-5.5 items-center justify-center rounded-[5px] bg-accent">
                <span className="font-mono text-xs font-bold text-background">
                  D
                </span>
              </div>
              <span className="text-sm font-semibold">DevMeter</span>
            </Link>
            <NavLinks />
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-2 text-xs font-semibold text-foreground-secondary"
              title={session.user.email ?? undefined}
            >
              {initials}
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="cursor-pointer text-[13px] text-muted hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        {children}
      </div>
    </ToastProvider>
  );
}
