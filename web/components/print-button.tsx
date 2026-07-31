"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-background"
    >
      Print / Save as PDF
    </button>
  );
}
