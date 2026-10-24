import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

const SECTIONS: ReadonlyArray<{ title: string; items: readonly string[] }> = [
  {
    title: "Data yang kami kumpulkan",
    items: [
      "Email dan nama lengkap Anda saat mendaftar, atau dari profil akun Google jika Anda masuk dengan Google.",
      "Isi laporan, lokasi kejadian, dan foto yang Anda unggah.",
      "Kami tidak meminta NIK, nomor telepon, atau alamat rumah Anda.",
    ],
  },
  {
    title: "Bagaimana data Anda ditampilkan",
    items: [
      "Identitas pelapor tidak pernah ditampilkan ke publik. Yang tampil hanya jumlah pelapor pada sebuah isu.",
      "Lokasi dibulatkan sampai tingkat kelurahan.",
      "Foto pada laporan Publik baru tampil setelah Dinas menandainya layak publik. Laporan Rahasia hanya terlihat oleh Dinas dan Admin.",
      "Laporan yang ditandai sensitif oleh sistem otomatis dijadikan Rahasia.",
    ],
  },
  {
    title: "Layanan pihak ketiga",
    items: [
      "Isi laporan dikirim ke layanan AI Google Gemini untuk membantu mengelompokkan dan mengarahkan laporan ke dinas yang tepat.",
      "Google dipakai sebagai pilihan masuk. Kami hanya meminta email dan nama dari profil Anda.",
      "Data akun dan laporan disimpan pada layanan Supabase.",
    ],
  },
  {
    title: "Hak Anda",
    items: [
      "Anda dapat mengunduh data laporan Anda.",
      "Anda dapat menghapus akun. Laporan Anda tetap tersimpan tanpa identitas agar riwayat penanganan isu tetap utuh.",
    ],
  },
  {
    title: "Data simulasi",
    items: [
      "Seluruh data proker, rapor, dan isu pada versi demonstrasi ini adalah data simulasi dan tidak memuat nama atau foto orang sungguhan.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <Container className="flex flex-col gap-10 py-10">
      <PageHeader
        title="Kebijakan Privasi"
        description="Penjelasan singkat tentang data apa yang kami proses, untuk apa, dan hak Anda atas data tersebut."
      />
      <div className="flex max-w-prose flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-primary">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}
