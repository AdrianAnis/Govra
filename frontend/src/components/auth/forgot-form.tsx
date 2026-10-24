"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FieldError } from "@/components/auth/field-error";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { requestReset } from "@/lib/auth-client";
import { emailSchema } from "@/lib/auth-flow";

function ForgotForm() {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse({ email: new FormData(event.currentTarget).get("email") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      await requestReset(parsed.data.email);
      router.push("/verifikasi");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <FormField
          id="email"
          name="email"
          type="email"
          label="Alamat Email"
          autoComplete="email"
          aria-invalid={error ? true : undefined}
        />
        <FieldError message={error} />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Mengirim kode..." : "Kirim Kode"}
      </Button>
    </form>
  );
}

export { ForgotForm };
