"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { OtpField } from "@/components/auth/otp-field";
import { Button } from "@/components/ui/button";
import { resendCode, verifyCode } from "@/lib/auth-client";
import { CODE_LENGTH, RESEND_SECONDS } from "@/lib/auth-flow";

interface VerifyFormProps {
  demoCode?: string | null;
}

const EMPTY = Array.from({ length: CODE_LENGTH }, () => "");
const TICK_MS = 1000;

function messageOf(failure: unknown): string {
  return failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.";
}

function VerifyForm({}: VerifyFormProps) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }
    const timer = setTimeout(() => setSeconds((value) => value - 1), TICK_MS);
    return () => clearTimeout(timer);
  }, [seconds]);

  const submit = async (code: string) => {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await verifyCode(code);
      router.push(result.next);
      router.refresh();
    } catch (failure) {
      setError(messageOf(failure));
      setDigits(EMPTY);
      setPending(false);
    }
  };

  const change = (next: string[]) => {
    setDigits(next);
    setError(null);
    const code = next.join("");
    if (code.length === CODE_LENGTH) {
      void submit(code);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError(`Masukkan ${CODE_LENGTH} digit kode.`);
      return;
    }
    void submit(code);
  };

  const resend = async () => {
    setError(null);
    try {
      await resendCode();
      setSeconds(RESEND_SECONDS);
      setDigits(EMPTY);
      setNotice("Kode baru sudah dikirim ke email Anda. Silakan periksa inbox atau spam.");
    } catch (failure) {
      setError(messageOf(failure));
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <OtpField digits={digits} invalid={error !== null} disabled={pending} onChange={change} />
      <div className="min-h-5 text-center text-sm" aria-live="polite">
        {error && (
          <p role="alert" className="font-medium text-red-600">
            {error}
          </p>
        )}
        {!error && notice && <p className="text-fg-muted">{notice}</p>}
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Memeriksa..." : "Verifikasi"}
      </Button>
      <Button type="button" variant="ghost" disabled={seconds > 0 || pending} onClick={resend}>
        {seconds > 0 ? `Kirim ulang kode dalam ${seconds} detik` : "Kirim ulang kode"}
      </Button>
    </form>
  );
}

export { VerifyForm };
