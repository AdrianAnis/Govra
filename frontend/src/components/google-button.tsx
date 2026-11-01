import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoogleButtonProps {
  mode?: "masuk" | "daftar";
  lanjut?: string;
  className?: string;
}

function GoogleButton({ mode = "masuk", lanjut, className }: GoogleButtonProps) {
  const query = new URLSearchParams();
  query.set("mode", mode);
  if (lanjut) {
    query.set("lanjut", lanjut);
  }

  return (
    <Link
      href={`/api/auth/google?${query.toString()}`}
      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full", className)}
    >
      <span aria-hidden className="size-5 bg-google" />
      Lanjutkan dengan Google
    </Link>
  );
}

export { GoogleButton };
