"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/layout/nav-link";
import { isActivePath, MAIN_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface MainNavProps {
  orientation: "row" | "column";
  onNavigate?: () => void;
}

function MainNav({ orientation, onNavigate }: MainNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi utama">
      <ul className={cn("flex gap-1", orientation === "column" && "flex-col")}>
        {MAIN_NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <NavLink
                href={item.href}
                onFollow={onNavigate}
                aria-current={active ? "page" : undefined}
                className="inline-flex min-h-11 items-center px-5 text-base font-semibold text-secondary transition-colors duration-150 ease-ui hover:text-primary"
              >
                <span
                  className={cn(
                    "border-b-2 border-transparent py-2",
                    active && "border-primary text-primary",
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { MainNav };
