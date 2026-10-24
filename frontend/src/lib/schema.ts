import type { components } from "@/types/api";

export type Schema<K extends keyof components["schemas"]> = components["schemas"][K];
