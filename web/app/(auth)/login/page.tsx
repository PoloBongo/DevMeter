import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Sign in</h1>
      <p className="mb-6 text-[13px] text-muted">
        Welcome back to DevMeter.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
          Invalid email or password.
        </div>
      )}

      <form action={loginAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>
        <button
          type="submit"
          className="mt-1 cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-background"
        >
          Sign in
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted">
        No account?{" "}
        <Link href="/register" className="text-foreground">
          Create one
        </Link>
      </p>
    </>
  );
}
