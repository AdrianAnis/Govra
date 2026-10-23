import { FocusHeader } from "@/components/layout/focus-header";

export default function FocusLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <FocusHeader />
      <main id="konten" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {children}
      </main>
    </>
  );
}
