import { cn } from "@/lib/utils";

const RING_SIZE = {
  md: { wrapper: "-right-16 -bottom-36 size-64", ring: "border-20", inner: "inset-12" },
  lg: { wrapper: "-right-28 -bottom-60 size-120", ring: "border-40", inner: "inset-24" },
};

function RingDecor({ size = "md" }: { size?: keyof typeof RING_SIZE }) {
  const style = RING_SIZE[size];
  return (
    <div aria-hidden className={cn("pointer-events-none absolute", style.wrapper)}>
      <span className={cn("absolute inset-0 rounded-full border-primary/20", style.ring)} />
      <span className={cn("absolute rounded-full border-primary/20", style.ring, style.inner)} />
    </div>
  );
}

export { RingDecor };
