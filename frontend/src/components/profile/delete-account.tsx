"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/lib/auth-client";

function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await deleteAccount();
      router.push("/");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : setOpen(next))}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>Hapus akun</DialogTrigger>
      <DialogContent className="max-w-md gap-6 p-8">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-2xl">Hapus akun Anda?</DialogTitle>
          <DialogDescription className="text-base">
            Akun Anda akan dihapus dan Anda keluar dari Govra. Laporan Anda tetap tersimpan tanpa identitas agar riwayat
            penanganan isu tetap utuh.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm font-medium text-fg">
            {error}
          </p>
        )}
        <DialogFooter className="gap-3">
          <Button type="button" variant="ghost" size="lg" disabled={pending} onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button type="button" size="lg" disabled={pending} onClick={confirm}>
            {pending ? "Menghapus..." : "Ya, hapus akun"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DeleteAccount };
