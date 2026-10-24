import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {description && <p className="max-w-prose text-lg text-fg-muted">{description}</p>}
      {children}
    </header>
  );
}

export { PageHeader };
