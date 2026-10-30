"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLink } from "@/components/auth-link";
import { FieldError } from "@/components/auth/field-error";
import { FormField } from "@/components/form-field";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/auth-client";
import { PASSWORD_MIN, signupSchema } from "@/lib/auth-flow";

type Errors = Partial<Record<string, string>>;

function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = signupSchema.safeParse({
      nama: form.get("nama"),
      email: form.get("email"),
      password: form.get("password"),
      setuju: form.get("setuju") === "on",
    });
    if (!parsed.success) {
      const found: Errors = {};
      for (const issue of parsed.error.issues) {
        found[String(issue.path[0])] ??= issue.message;
      }
      setErrors(found);
      return;
    }
    if (form.get("konfirmasi") !== parsed.data.password) {
      setErrors({ konfirmasi: "Konfirmasi kata sandi tidak cocok." });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await signUp(parsed.data);
      router.push("/verifikasi");
    } catch (failure) {
      setErrors({ form: failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi." });
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <FormField
          id="nama"
          name="nama"
          label="Nama Lengkap"
          autoComplete="name"
          aria-invalid={errors.nama ? true : undefined}
        />
        <FieldError message={errors.nama} />
      </div>
      <div className="flex flex-col gap-2">
        <FormField
          id="email"
          name="email"
          type="email"
          label="Alamat Email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
        />
        <FieldError message={errors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <PasswordField
          id="password"
          name="password"
          label="Kata Sandi"
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
          label="Ulangi Kata Sandi"
          autoComplete="new-password"
          aria-invalid={errors.konfirmasi ? true : undefined}
        />
        <FieldError message={errors.konfirmasi} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 text-sm text-fg-muted">
          <input type="checkbox" name="setuju" className="mt-0.5 size-5 shrink-0 accent-primary" />
          <span>
            Saya menyetujui <AuthLink href="/privasi">Kebijakan Privasi</AuthLink> Govra.
          </span>
        </label>
        <FieldError message={errors.setuju} />
      </div>
      <FieldError message={errors.form} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Mengirim kode OTP..." : "Daftar"}
      </Button>
    </form>
  );
}

export { RegisterForm };
