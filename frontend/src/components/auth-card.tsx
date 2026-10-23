import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  alternate: ReactNode;
  note: ReactNode;
  children: ReactNode;
}

function AuthCard({ title, description, alternate, note, children }: AuthCardProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
      {children}
      <div className="flex items-center gap-4 text-xs font-medium tracking-wide text-fg-subtle">
        <span aria-hidden className="h-px flex-1 bg-border" />
        ATAU
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
      {alternate}
      <div className="flex flex-col gap-2 text-center text-sm text-fg-muted">{note}</div>
    </div>
  );
}

export { AuthCard };
