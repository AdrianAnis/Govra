import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

interface Question {
  question: string;
  answers: readonly string[];
}

const QUESTIONS: readonly Question[] = [
  {
    question: "Data apa saja yang kami kumpulkan?",
    answers: [
      "Email dan nama lengkap Anda saat mendaftar, atau dari profil akun Google jika Anda masuk dengan Google.",
      "Isi laporan, lokasi kejadian, dan foto yang Anda unggah.",
      "Kami tidak meminta NIK, nomor telepon, atau alamat rumah Anda.",
    ],
  },
  {
    question: "Apa yang ditampilkan ke publik?",
    answers: [
      "Identitas pelapor tidak pernah ditampilkan ke publik. Yang tampil hanya jumlah pelapor pada sebuah isu.",
      "Lokasi dibulatkan sampai tingkat kelurahan.",
      "Foto pada laporan Publik baru tampil setelah Dinas menandainya layak publik. Laporan Rahasia hanya terlihat oleh Dinas dan Admin.",
      "Laporan yang ditandai sensitif oleh sistem otomatis dijadikan Rahasia.",
    ],
  },
  {
    question: "Layanan pihak ketiga apa yang dipakai?",
    answers: [
      "Isi laporan dikirim ke layanan AI Google Gemini untuk membantu mengelompokkan dan mengarahkan laporan ke dinas yang tepat.",
      "Google dipakai sebagai pilihan masuk. Kami hanya meminta email dan nama dari profil Anda.",
      "Data akun dan laporan disimpan pada layanan Supabase.",
    ],
  },
  {
    question: "Apa hak saya atas data saya?",
    answers: [
      "Anda dapat mengunduh data laporan Anda.",
      "Anda dapat menghapus akun. Laporan Anda tetap tersimpan tanpa identitas agar riwayat penanganan isu tetap utuh.",
    ],
  },
  {
    question: "Apakah data di situs ini asli?",
    answers: [
      "Seluruh data proker, rapor, dan isu pada versi demonstrasi ini adalah data simulasi dan tidak memuat nama atau foto orang sungguhan.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <Container className="flex flex-col gap-10 py-6 lg:py-8">
      <PageIntro
        eyebrow="Transparansi"
        title="Kebijakan Privasi"
        description="Jawaban singkat tentang data apa yang kami proses, untuk apa, dan hak Anda atas data tersebut."
      />
      <div className="flex flex-col divide-y border-y pb-0">
        {QUESTIONS.map((item, index) => (
          <details key={item.question} open={index === 0} className="group py-2">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 rounded-md py-4 text-xl font-semibold tracking-tight transition-colors duration-200 ease-ui hover:text-primary lg:text-2xl">
              {item.question}
              <ChevronDown
                aria-hidden
                className="size-6 shrink-0 text-fg-subtle transition-transform duration-300 ease-ui group-open:rotate-180 group-open:text-primary"
              />
            </summary>
            <ul className="flex max-w-prose list-disc flex-col gap-3 pb-6 pl-5 text-fg-muted marker:text-primary">
              {item.answers.map((answer) => (
                <li key={answer}>{answer}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </Container>
  );
}
