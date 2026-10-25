import Link from "next/link";
import { Logo } from "@/components/brand/logo";

function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="Govra, ke beranda" className="inline-flex min-h-11 items-center">
      <Logo className="h-8" />
    </Link>
  );
}

export { Wordmark };
