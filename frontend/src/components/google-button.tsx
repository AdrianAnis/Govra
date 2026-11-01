import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoogleButtonProps {
  lanjut?: string;
  className?: string;
}

function GoogleButton({ lanjut, className }: GoogleButtonProps) {
  const href = lanjut ? `/api/auth/google?lanjut=${encodeURIComponent(lanjut)}` : "/api/auth/google";

  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full", className)}
    >
      <span aria-hidden className="size-5 bg-google" />
      Lanjutkan dengan Google
    </Link>
  );
}

export { GoogleButton };
