import { NavLink } from "@/components/layout/nav-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function HeaderActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <NavLink
        href="/masuk"
        onFollow={onNavigate}
        className={cn(buttonVariants({ variant: "ghost" }), "min-w-32 px-8")}
      >
        Masuk
      </NavLink>
      <NavLink
        href="/lapor"
        onFollow={onNavigate}
        className={cn(buttonVariants({ variant: "primary" }), "min-w-32 px-8")}
      >
        Lapor
      </NavLink>
    </>
  );
}

export { HeaderActions };
