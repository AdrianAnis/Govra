import { Container } from "@/components/layout/container";

export default function HomePage() {
  return (
    <Container className="py-16">
      <h1 className="text-5xl font-bold tracking-tight">Govra</h1>
      <p className="mt-4 text-fg-muted">
        Pantau program kerja daerah dan laporkan masalah di sekitar Anda.
      </p>
    </Container>
  );
}
