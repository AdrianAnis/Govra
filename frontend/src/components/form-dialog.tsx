"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormDialogProps {
  triggerLabel: string;
  triggerVariant?: "primary" | "outline" | "ghost";
  triggerSize?: "default" | "sm";
  title: string;
  description?: string;
  submitLabel: string;
  onSubmit: () => Promise<void>;
  onReset?: () => void;
  children: ReactNode;
}

function FormDialog({
  triggerLabel,
  triggerVariant = "outline",
  triggerSize = "sm",
  title,
  description,
  submitLabel,
  onSubmit,
  onReset,
  children,
}: FormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = () => {
    onReset?.();
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit();
      setOpen(false);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button type="button" variant={triggerVariant} size={triggerSize} onClick={show}>
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            {children}
            {error && (
              <p role="alert" className="text-sm font-medium">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                Tutup
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Menyimpan" : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { FormDialog };
