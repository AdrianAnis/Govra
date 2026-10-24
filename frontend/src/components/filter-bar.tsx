"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELD_CLASS, FIELD_HEIGHT } from "@/lib/field-style";
import { cn } from "@/lib/utils";

const ALL = "semua";
const VIEW_PARAM = "tampil";

const ACTIVE_CLASS = "border-fg font-semibold";

export interface FilterOption {
  value: string;
  label: string;
}

export interface SelectFilter {
  name: string;
  label: string;
  allLabel: string;
  options: readonly FilterOption[];
}

interface FilterBarProps {
  search?: { name: string; label: string };
  selects: readonly SelectFilter[];
}

function FilterBar({ search, selects }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const apply = (name: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!search) {
      return;
    }
    const value = new FormData(event.currentTarget).get(search.name);
    apply(search.name, typeof value === "string" ? value.trim() : "");
  };

  const hasFilters = [...params.keys()].some((key) => key !== "page" && key !== VIEW_PARAM);
  const resetHref = params.has(VIEW_PARAM) ? `${pathname}?${VIEW_PARAM}=${params.get(VIEW_PARAM)}` : pathname;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {search && (
          <form onSubmit={submitSearch} role="search" className="relative sm:col-span-2">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-muted"
            />
            <Input
              key={params.get(search.name) ?? ""}
              name={search.name}
              defaultValue={params.get(search.name) ?? ""}
              aria-label={search.label}
              placeholder={search.label}
              className={cn(FIELD_HEIGHT, FIELD_CLASS, "pl-12", params.get(search.name) && ACTIVE_CLASS)}
            />
          </form>
        )}
        {selects.map((select) => (
          <Select
            key={select.name}
            value={params.get(select.name) ?? ALL}
            items={[{ value: ALL, label: select.allLabel }, ...select.options]}
            onValueChange={(value) => apply(select.name, value && value !== ALL ? value : "")}
          >
            <SelectTrigger
              aria-label={select.label}
              className={cn(FIELD_HEIGHT, FIELD_CLASS, params.get(select.name) && ACTIVE_CLASS)}
            >
              <SelectValue className="block min-w-0 flex-1 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{select.allLabel}</SelectItem>
              {select.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => router.replace(resetHref)}
        >
          Hapus semua filter
        </Button>
      )}
    </div>
  );
}

export { FilterBar };
