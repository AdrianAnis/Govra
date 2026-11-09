import Link from "next/link";
import { Reveal } from "@/components/bits/reveal";
import { Container } from "@/components/layout/container";
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion";

interface Faq {
  question: string;
  answer: string;
}

const FAQS: readonly Faq[] = [
  {
    question: "Apa itu Govra?",
    answer:
      "Govra adalah platform untuk memantau program kerja pemerintah daerah sekaligus melaporkan masalah di sekitar Anda. Progres, tahapan, dan anggaran program terbuka untuk umum, dan setiap laporan warga bisa dilacak sampai selesai.",
  },
  {
    question: "Apakah saya perlu akun?",
    answer:
      "Tidak untuk melihat program kerja, rapor dinas, dan isu terkini. Akun hanya diperlukan untuk membuat laporan dan memantau laporan Anda. Anda bisa mendaftar dengan email atau masuk dengan Google.",
  },
  {
    question: "Masalah apa saja yang bisa dilaporkan?",
    answer:
      "Masalah fasilitas dan layanan publik di wilayah Anda, misalnya jalan rusak, drainase tersumbat, banjir, sampah menumpuk, lampu jalan padam, atau layanan kesehatan yang terganggu.",
  },
  {
    question: "Bagaimana cara membuat laporan?",
    answer:
      "Masuk, buka halaman Lapor, lalu ceritakan masalahnya. Tandai lokasi di peta, lampirkan foto, atau rekam suara jika sulit mengetik. Setelah terkirim, simpan kode tiket Anda untuk memantau tindak lanjutnya.",
  },
  {
    question: "Apakah identitas dan lokasi saya aman?",
    answer:
      "Anda bisa memilih laporan Publik, dengan identitas disamarkan, atau Rahasia. Di halaman publik, lokasi hanya ditampilkan sampai tingkat kelurahan, sedangkan titik koordinat tepat hanya dilihat dinas yang menangani.",
  },
  {
    question: "Bagaimana saya memantau laporan?",
    answer:
      "Setiap laporan melewati status Diajukan, Diteruskan, Diproses, lalu Selesai. Anda bisa melihat linimasa dan bukti penanganannya di halaman Laporan saya, dan siapa pun bisa mengikuti isu yang sama di Isu Terkini.",
  },
  {
    question: "Apa gunanya mendukung isu?",
    answer:
      "Jika masalah yang Anda alami sudah dilaporkan warga lain, Anda bisa mendukung isu itu. Semakin banyak dukungan, semakin kuat sinyal bahwa masalah tersebut perlu segera ditangani dinas.",
  },
  {
    question: "Bagaimana rapor dinas dihitung?",
    answer:
      "Rapor menilai setiap dinas dengan lima indikator: ketuntasan program kerja, ketepatan jadwal, responsivitas, penyelesaian isu, dan penyerapan anggaran. Setiap angka bisa dibuka untuk melihat data penyusunnya.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-16 bg-surface-muted py-20 lg:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal variant="clip" className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
            Pertanyaan yang <span className="text-primary-hover">sering ditanyakan</span>
          </h2>
          <p className="text-fg-muted">
            Belum menemukan jawabannya?{" "}
            <Link href="/metodologi" className="font-semibold text-primary-hover underline-offset-4 hover:underline">
              Pelajari metodologi penilaian kami
            </Link>
            .
          </p>
        </Reveal>
        <Reveal variant="blur" className="mx-auto w-full max-w-3xl">
          <Accordion>
            {FAQS.map((faq) => (
              <AccordionItem key={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionPanel>
                  <p>{faq.answer}</p>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </section>
  );
}

export { FaqSection };
