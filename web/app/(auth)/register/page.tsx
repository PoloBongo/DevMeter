import Link from "next/link";
import { registerAction } from "@/app/(auth)/actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Enter a valid email and a password of at least 8 characters.",
  exists: "An account with this email already exists.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold tracking-tight">
        Create your account
      </h1>
      <p className="mb-6 text-[13px] text-muted">
        Start tracking time and AI cost per ticket.
      </p>

      {message && (
        <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
          {message}
        </div>
      )}

      <form action={registerAction} className="flex flex-col gap-4">
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
            autoComplete="new-password"
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/50"
          />
          <span className="text-[11px] text-dim">At least 8 characters.</span>
        </label>
        <button
          type="submit"
          className="mt-1 cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-background"
        >
          Create account
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground">
          Sign in
        </Link>
      </p>
    </>
  );
}
