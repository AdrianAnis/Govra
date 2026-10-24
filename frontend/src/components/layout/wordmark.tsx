import Link from "next/link";

function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center text-xl font-bold tracking-tight"
    >
      Govra
    </Link>
  );
}

export { Wordmark };
