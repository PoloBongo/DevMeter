"use client";

import { useFormStatus } from "react-dom";
import { useTopLoaderPending } from "@/lib/use-top-loader-pending";

/**
 * Drop-in replacement for a form's `<button type="submit">` — shows the
 * global top-loading bar and disables/dims itself while the form's action
 * is in flight. Must be rendered *inside* the `<form>` it submits (that's
 * how `useFormStatus` finds it), which is already how every form in this
 * app is structured.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  useTopLoaderPending(pending);

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-60`}
      {...props}
    >
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
