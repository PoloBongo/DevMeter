import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-5xl px-8">
        <nav className="flex items-center justify-between py-7">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-accent">
              <span className="font-mono text-sm font-bold text-background">
                D
              </span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              DevMeter
            </span>
          </div>
          <div className="flex items-center gap-7">
            <Link
              href="/login"
              className="text-sm text-foreground hover:text-foreground-secondary"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-background"
            >
              Start free
            </Link>
          </div>
        </nav>

        <section className="flex flex-col items-center py-24 text-center sm:py-28">
          <div className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Built for Claude Code freelancers
          </div>
          <h1 className="mb-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Know what every ticket really costs you
            <span className="text-accent">.</span>
          </h1>
          <p className="mb-9 max-w-lg text-lg leading-relaxed text-muted">
            Time and AI included. DevMeter tracks the hours you spend and
            every Claude Code token you burn, per ticket, per project —
            automatically.
          </p>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-accent px-[22px] py-3.5 text-[14.5px] font-semibold text-background"
            >
              Start tracking
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border px-[22px] py-3.5 text-[14.5px] font-medium text-foreground"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3.5 pb-24 sm:grid-cols-3">
          {[
            {
              title: "Automatic time tracking",
              body: "Sessions start and stop with your Claude Code work — no timers to remember.",
            },
            {
              title: "Real AI cost, per ticket",
              body: "Token usage mapped to dollars, tied to the git branch and ticket you were on.",
            },
            {
              title: "Client-ready reports",
              body: "Export a project's sessions to CSV whenever you need to justify an invoice.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="mb-2 text-[14.5px] font-semibold">
                {f.title}
              </div>
              <p className="text-[13.5px] leading-relaxed text-muted">
                {f.body}
              </p>
            </div>
          ))}
        </section>

        <footer className="flex justify-between border-t border-border py-6 text-[12.5px] text-dim">
          <span>© 2026 DevMeter</span>
          <span className="font-mono">v0.1</span>
        </footer>
      </div>
    </div>
  );
}
