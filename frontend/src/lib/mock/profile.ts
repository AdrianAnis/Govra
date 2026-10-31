import { opdRef } from "@/lib/mock/reference";
import type { Schema } from "@/lib/schema";
import type { Role } from "@/lib/session";

export const DEMO_PROFILES: Record<Role, Schema<"Profile">> = {
  pelapor: {
    id: "0197c000-0000-7000-8000-000000000001",
    email: "rina.pelapor@gmail.com",
    display_name: "Rina Pelapor",
    role: "PELAPOR",
    opd: null,
    status: "ACTIVE",
  },
  dinas: {
    id: "0197c000-0000-7000-8000-000000000002",
    email: "bmsda@example.org",
    display_name: "Admin Bina Marga",
    role: "DINAS",
    opd: opdRef("BMSDA"),
    status: "ACTIVE",
  },
  admin: {
    id: "0197c000-0000-7000-8000-000000000003",
    email: "admin@example.org",
    display_name: "Admin Govra",
    role: "ADMIN",
    opd: null,
    status: "ACTIVE",
  },
};

export const DEMO_PROFILE = DEMO_PROFILES.pelapor;
