package assistant

import "govra/internal/platform/ai"

func getToolDeclarations() []ai.ChatToolDeclaration {
	return []ai.ChatToolDeclaration{
		{
			Name:        "get_my_reports",
			Description: "Mendapatkan daftar laporan pengaduan terbaru milik pengguna yang sedang login.",
			Parameters: ai.ChatToolParameters{
				Type:       "OBJECT",
				Properties: map[string]ai.ChatToolProperty{},
			},
		},
		{
			Name:        "get_report_status",
			Description: "Mendapatkan status dan informasi detail laporan pengaduan berdasarkan kode laporan resmi.",
			Parameters: ai.ChatToolParameters{
				Type: "OBJECT",
				Properties: map[string]ai.ChatToolProperty{
					"code": {
						Type:        "STRING",
						Description: "Kode laporan warga (contoh: GVR-2610-8F3K atau TLK-2610-8F3K)",
					},
				},
				Required: []string{"code"},
			},
		},
		{
			Name:        "search_programs",
			Description: "Mencari daftar program kerja pemerintah daerah. Gunakan query=\"\" (string kosong) jika pengguna bertanya secara umum tentang proker yang berjalan, aktif, terbaru, atau sedang dikerjakan tanpa menyebut nama spesifik. Gunakan query berisi nama hanya jika pengguna menyebut nama kegiatan atau OPD tertentu.",
			Parameters: ai.ChatToolParameters{
				Type: "OBJECT",
				Properties: map[string]ai.ChatToolProperty{
					"query": {
						Type:        "STRING",
						Description: "Nama spesifik proker atau bidang kegiatan. Kirim string kosong (\"\") untuk daftar proker terbaru tanpa filter nama.",
					},
					"opd": {
						Type:        "STRING",
						Description: "Kode atau slug OPD penanggung jawab (opsional)",
					},
					"status": {
						Type:        "STRING",
						Description: "Status jadwal program kerja (opsional, contoh: SESUAI_JADWAL, TERLAMBAT, SELESAI)",
					},
				},
			},
		},
		{
			Name:        "get_program_detail",
			Description: "Mendapatkan informasi lengkap capaian progres fisik, jadwal, dan pagu anggaran program kerja berdasarkan kode proker.",
			Parameters: ai.ChatToolParameters{
				Type: "OBJECT",
				Properties: map[string]ai.ChatToolProperty{
					"code": {
						Type:        "STRING",
						Description: "Kode program kerja resmi (contoh: PRG-001)",
					},
				},
				Required: []string{"code"},
			},
		},
		{
			Name:        "get_opd_scorecard",
			Description: "Mendapatkan rapor kinerja instansi dinas (OPD), tingkat ketuntasan program kerja, dan kepatuhan penyelesaian aduan warga.",
			Parameters: ai.ChatToolParameters{
				Type: "OBJECT",
				Properties: map[string]ai.ChatToolProperty{
					"opd_code": {
						Type:        "STRING",
						Description: "Kode atau slug OPD (contoh: DBM-SDA, DLHK, DISHUB)",
					},
				},
				Required: []string{"opd_code"},
			},
		},
		{
			Name:        "get_reporting_guide",
			Description: "Mendapatkan panduan langkah resmi cara membuat laporan pengaduan warga di platform Govra.",
			Parameters: ai.ChatToolParameters{
				Type:       "OBJECT",
				Properties: map[string]ai.ChatToolProperty{},
			},
		},
	}
}

const reportingGuideText = `Cara membuat laporan pengaduan di Govra:
1. Masuk atau daftar akun terlebih dahulu di halaman Masuk/Daftar.
2. Buka formulir di halaman Lapor.
3. Ceritakan permasalahan secara rinci (minimal 20 karakter).
4. Tentukan lokasi kejadian di peta dengan memilih kecamatan dan kelurahan.
5. Lampirkan foto bukti pendukung (maksimal 3 foto).
6. Periksa isu serupa di sekitar lokasi. Anda dapat memilih 'Dukung isu ini' atau tetap mengirim laporan baru.
7. Pilih visibilitas Publik (identitas disamarkan) atau Rahasia.
8. Kirim dan simpan kode tiket laporan Anda untuk memantau tindak lanjut dinas.`
