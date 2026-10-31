import type { ReactNode } from "react";

interface StateMessageProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

function StateMessage({
  title,
  description,
  action,
  role,
}: StateMessageProps & { role?: "alert" }) {
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border-strong px-6 py-12 text-center"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="max-w-prose text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function EmptyState(props: StateMessageProps) {
  return <StateMessage {...props} />;
}

export { EmptyState };
