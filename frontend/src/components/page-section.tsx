import type { ReactNode } from "react";

interface PageSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

function PageSection({ title, action, children }: PageSectionProps) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export { PageSection };
