import type { Schema } from "@/lib/schema";

export interface Publication {
  public_ok: boolean;
  is_cover: boolean;
}

export interface StoredEvidence {
  attachment: Schema<"Attachment">;
  mime: string;
  bytes: ArrayBuffer;
}

interface AgencyStore {
  events: Map<string, Schema<"IssueEvent">[]>;
  publication: Map<string, Publication>;
  evidence: Map<string, StoredEvidence>;
}

const STORE_KEY = Symbol.for("govra.agency-store");

function isStore(value: unknown): value is AgencyStore {
  return (
    typeof value === "object" &&
    value !== null &&
    "events" in value &&
    "publication" in value &&
    "evidence" in value
  );
}

export function agencyStore(): AgencyStore {
  const existing: unknown = Reflect.get(globalThis, STORE_KEY);
  if (isStore(existing)) {
    return existing;
  }
  const fresh: AgencyStore = { events: new Map(), publication: new Map(), evidence: new Map() };
  Reflect.set(globalThis, STORE_KEY, fresh);
  return fresh;
}
