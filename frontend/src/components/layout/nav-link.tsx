import Link from "next/link";
import type { ComponentProps } from "react";

type NavLinkProps = ComponentProps<typeof Link> & {
  onFollow?: (() => void) | undefined;
};

function NavLink({ onFollow, ...props }: NavLinkProps) {
  return <Link {...props} {...(onFollow ? { onClick: onFollow } : {})} />;
}

export { NavLink };
