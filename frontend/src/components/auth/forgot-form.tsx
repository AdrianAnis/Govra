"use client";

import { useState, type FormEvent } from "react";
import { FieldError } from "@/components/auth/field-error";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { requestReset } from "@/lib/auth-client";
import { emailSchema } from "@/lib/auth-flow";

function ForgotForm() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse({ email: new FormData(event.currentTarget).get("email") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSuccess(undefined);
    setPending(true);
    try {
      await requestReset(parsed.data.email);
      setSuccess("Tautan pembaruan kata sandi telah dikirim ke email Anda! Silakan periksa kotak masuk (inbox) atau folder spam Gmail Anda.");
      setPending(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          <p className="font-semibold mb-1">Berhasil Terkirim</p>
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-300">
          <p className="font-semibold mb-1">Gagal</p>
          <p>{error}</p>
        </div>
      )}

      {!success && (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <FormField
              id="email"
              name="email"
              type="email"
              label="Alamat Email Akun"
              autoComplete="email"
              aria-invalid={error ? true : undefined}
            />
            <FieldError message={error} />
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Memeriksa email..." : "Kirim Tautan Atur Ulang"}
          </Button>
        </form>
      )}
    </div>
  );
}

export { ForgotForm };
