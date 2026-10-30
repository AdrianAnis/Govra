"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FieldError } from "@/components/auth/field-error";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/auth-client";
import { PASSWORD_MIN, resetSchema } from "@/lib/auth-flow";

type Errors = Partial<Record<string, string>>;

interface ResetFormProps {
  token?: string;
  email?: string;
}

function ResetForm({ token, email }: ResetFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = resetSchema.safeParse({ password: form.get("password") });
    if (!parsed.success) {
      setErrors({ password: parsed.error.issues[0]?.message });
      return;
    }
    if (form.get("konfirmasi") !== parsed.data.password) {
      setErrors({ konfirmasi: "Konfirmasi kata sandi tidak cocok." });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await resetPassword(parsed.data.password, email, token);
      router.push(result.next);
    } catch (failure) {
      setErrors({ form: failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi." });
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <PasswordField
          id="password"
          name="password"
          label="Kata Sandi Baru"
          autoComplete="new-password"
          hint={`Minimal ${PASSWORD_MIN} karakter.`}
          aria-invalid={errors.password ? true : undefined}
        />
        <FieldError message={errors.password} />
      </div>
      <div className="flex flex-col gap-2">
        <PasswordField
          id="konfirmasi"
          name="konfirmasi"
          label="Ulangi Kata Sandi Baru"
          autoComplete="new-password"
          aria-invalid={errors.konfirmasi ? true : undefined}
        />
        <FieldError message={errors.konfirmasi} />
      </div>
      <FieldError message={errors.form} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Menyimpan kata sandi..." : "Simpan Kata Sandi"}
      </Button>
    </form>
  );
}

export { ResetForm };
