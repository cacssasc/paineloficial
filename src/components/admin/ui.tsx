import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, children, className = "" }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border bg-card ${className}`}>
      {title && (
        <header className="border-b px-5 py-3.5">
          <h2 className="text-sm font-medium">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </header>
      )}
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

const tagTones = {
  neutral: "border-border bg-muted text-muted-foreground",
  blue: "border-ml-blue/20 bg-ml-blue/10 text-ml-blue",
  green: "border-ml-green/25 bg-ml-green/10 text-ml-green",
  red: "border-destructive/20 bg-destructive/10 text-destructive",
} as const;

export function Tag({ tone = "neutral", children }: { tone?: keyof typeof tagTones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs font-medium ${tagTones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-admin-mono text-xl font-medium tabular-nums">{value}</p>
    </div>
  );
}
