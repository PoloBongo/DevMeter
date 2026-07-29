export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-accent">
          <span className="font-mono text-sm font-bold text-background">
            D
          </span>
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          DevMeter
        </span>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-7">
        {children}
      </div>
    </div>
  );
}
