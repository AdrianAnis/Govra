import { Container } from "@/components/layout/container";
import { FocusHeader } from "@/components/layout/focus-header";

export default function FocusLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <FocusHeader />
      <main id="konten" className="flex-1">
        <Container className="py-6 lg:py-8">{children}</Container>
      </main>
    </>
  );
}
