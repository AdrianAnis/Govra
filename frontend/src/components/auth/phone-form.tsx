"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FieldError } from "@/components/auth/field-error";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { submitGooglePhone } from "@/lib/auth-client";
import { teleponSchema } from "@/lib/auth-flow";

function PhoneForm() {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = teleponSchema.safeParse({ telepon: form.get("telepon") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      const result = await submitGooglePhone(parsed.data.telepon);
      router.push(result.next);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <FormField
          id="telepon"
          name="telepon"
          type="tel"
          inputMode="tel"
          label="Nomor Telepon"
          autoComplete="tel"
          autoFocus
          hint="Nomor WhatsApp aktif, contoh 081234567890."
          aria-invalid={error ? true : undefined}
        />
        <FieldError message={error} />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Menyimpan..." : "Selesaikan Pendaftaran"}
      </Button>
    </form>
  );
}

export { PhoneForm };
