"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { adminCall, type AdminMethod } from "@/lib/admin-client";

interface ActionButtonProps {
  label: string;
  method: AdminMethod;
  path: string;
  body: unknown;
  variant?: "primary" | "outline" | "ghost";
}

function ActionButton({ label, method, path, body, variant = "outline" }: ActionButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await adminCall(method, path, body);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="flex flex-col gap-1">
      <Button type="button" variant={variant} size="sm" disabled={busy} onClick={() => void run()}>
        {label}
      </Button>
      {error && (
        <span role="alert" className="max-w-48 text-xs font-medium">
          {error}
        </span>
      )}
    </span>
  );
}

export { ActionButton };
