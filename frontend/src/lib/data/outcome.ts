export type Outcome<T> = { ok: true; value: T } | { ok: false; status: number; message: string };

export function fail(status: number, message: string): { ok: false; status: number; message: string } {
  return { ok: false, status, message };
}
