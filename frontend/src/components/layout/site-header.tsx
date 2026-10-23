"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { HeaderActions } from "@/components/layout/header-actions";
import { MainNav } from "@/components/layout/main-nav";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-surface">
      <Container className="flex h-16 items-center gap-4">
        <div className="flex flex-1">
          <Wordmark />
        </div>
        <div className="hidden md:block">
          <MainNav orientation="row" />
        </div>
        <div className="hidden flex-1 items-center justify-end gap-3 md:flex">
          <HeaderActions />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
          >
            <Menu aria-hidden />
            <span className="sr-only">Buka menu</span>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4">
              <MainNav orientation="column" onNavigate={close} />
              <HeaderActions onNavigate={close} />
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}

export { SiteHeader };
