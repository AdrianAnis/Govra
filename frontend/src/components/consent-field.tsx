import { AuthLink } from "@/components/auth-link";

function ConsentField() {
  return (
    <label className="flex items-start gap-3 text-sm text-fg-muted">
      <input
        type="checkbox"
        name="setuju"
        required
        className="mt-0.5 size-5 shrink-0 accent-primary"
      />
      <span>
        Saya menyetujui <AuthLink href="/privasi">Kebijakan Privasi</AuthLink> Govra.
      </span>
    </label>
  );
}

export { ConsentField };
