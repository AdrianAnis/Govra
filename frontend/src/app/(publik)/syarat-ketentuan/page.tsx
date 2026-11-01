import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Syarat & Ketentuan" };

interface Question {
  question: string;
  answers: readonly string[];
}

const QUESTIONS: readonly Question[] = [
  {
    question: "Tentang Platform Govra",
    answers: [
      "Govra adalah platform independen yang memfasilitasi transparansi program kerja daerah dan saluran aspirasi pengaduan publik berbasis AI.",
      "Govra adalah inisiatif teknologi independen dan bukan merupakan lembaga atau entitas resmi pemerintahan.",
      "Layanan ini disediakan untuk memudahkan warga berpartisipasi dalam perbaikan fasilitas dan lingkungan publik.",
    ],
  },
  {
    question: "Ketentuan Pembuatan Laporan",
    answers: [
      "Pelapor wajib menyampaikan informasi yang objektif, benar, dan dapat dipertanggungjawabkan.",
      "Laporan tidak boleh memuat ujaran kebencian, konten bernuansa SARA, pornografi, fitnah, atau materi yang melanggar hukum Republik Indonesia.",
      "Laporan yang mengandung unsur sensitif atau data pribadi akan otomatis dialihkan ke status Rahasia demi melindungi privasi warga.",
    ],
  },
  {
    question: "Keamanan Akun & Kredensial",
    answers: [
      "Pengguna dapat masuk menggunakan akun Google resmi atau mendaftar mandiri.",
      "Govra tidak pernah meminta kata sandi email Anda atau informasi keuangan/perbankan apa pun.",
      "Pengguna bertanggung jawab penuh atas seluruh aktivitas yang terjadi melalui akun masing-masing.",
    ],
  },
  {
    question: "Perlindungan Identitas Pelapor",
    answers: [
      "Nama lengkap dan alamat email pelapor tidak dipublikasikan ke publik umum.",
      "Hanya statistik dan jumlah warga yang mendukung suatu isu yang ditampilkan secara agregat.",
      "Foto atau dokumentasi pendukung hanya akan dipublikasikan setelah melalui proses kurasi dan moderasi.",
    ],
  },
  {
    question: "Tanggung Jawab Penanganan Laporan",
    answers: [
      "Govra berfungsi sebagai jembatan informasi dan agregator isu berbasis kecerdasan buatan.",
      "Tindak lanjut fisik di lapangan merupakan wewenang dan kebijakan dari dinas atau otoritas terkait di masing-masing daerah.",
    ],
  },
  {
    question: "Hubungi Kami",
    answers: [
      "Jika Anda memiliki pertanyaan seputar ketentuan layanan atau permohonan penghapusan data, silakan hubungi tim kami di support@govra.web.id.",
    ],
  },
];

export default function TermsPage() {
  return (
    <Container className="flex flex-col gap-10 py-10">
      <PageHeader
        title="Syarat & Ketentuan Layanan"
        description="Panduan dan ketentuan penggunaan platform Govra demi menjaga ekosistem pelaporan publik yang aman, bertanggung jawab, dan transparan."
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
