"use client";

import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const OPD_ITEMS = [
  { value: "all", label: "Semua OPD" },
  { value: "bmsda", label: "Bina Marga dan SDA" },
  { value: "lhk", label: "Lingkungan Hidup" },
];

export default function ComponentTestPage() {
  return (
    <TooltipProvider>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Uji komponen</h1>

        <section className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm">Kecil</Button>
          <Button disabled>Nonaktif</Button>
          <div className="rounded-md bg-secondary p-3">
            <Button variant="accent">Accent di section gelap</Button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Judul laporan" />
          <Input placeholder="Tidak valid" aria-invalid defaultValue="isi salah" />
          <Select defaultValue="all" items={OPD_ITEMS}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua OPD</SelectItem>
              <SelectItem value="bmsda">Bina Marga dan SDA</SelectItem>
              <SelectItem value="lhk">Lingkungan Hidup</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder="Ceritakan masalahnya" />
        </section>

        <section className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="secondary" />}>
              Buka dialog
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ubah status isu?</DialogTitle>
                <DialogDescription>
                  Status berubah dari Diteruskan menjadi Diproses.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost">Batal</Button>
                <Button>Ya, ubah</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger render={<Button variant="secondary" />}>
              Buka sheet
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Asisten</SheetTitle>
                <SheetDescription>Tanyakan status laporan Anda.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" />}>
              Arahkan kursor
            </TooltipTrigger>
            <TooltipContent>Progres dihitung dari jadwal</TooltipContent>
          </Tooltip>

          <Button onClick={() => toast.success("Laporan terkirim")}>Toast</Button>
        </section>

        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Ringkasan</TabsTrigger>
            <TabsTrigger value="b">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Isi tab ringkasan.</TabsContent>
          <TabsContent value="b">Isi tab timeline.</TabsContent>
        </Tabs>

        <section className="flex flex-col gap-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </section>
      </main>
      <Toaster />
    </TooltipProvider>
  );
}
