package whatsapp

import (
	"strings"
	"unicode/utf8"
)

const maxNoteRunes = 280

var statusLabels = map[string]string{
	"DIAJUKAN":            "Diajukan",
	"MENUNGGU_VERIFIKASI": "Menunggu Verifikasi",
	"DITERUSKAN":          "Diteruskan",
	"DIPROSES":            "Diproses",
	"DIALIHKAN":           "Dialihkan",
	"DIBUKA_ULANG":        "Dibuka Ulang",
	"DITOLAK":             "Ditolak",
	"SELESAI":             "Selesai",
}

func StatusLabel(status string) string {
	if label, ok := statusLabels[strings.ToUpper(status)]; ok {
		return label
	}
	return status
}

func truncate(text string, limit int) string {
	text = strings.TrimSpace(text)
	if utf8.RuneCountInString(text) <= limit {
		return text
	}
	runes := []rune(text)
	return strings.TrimSpace(string(runes[:limit])) + "..."
}

func reportURL(webURL, code string) string {
	return strings.TrimRight(webURL, "/") + "/pelapor/laporan/" + code
}

func ProgressMessage(webURL, code, title, status, note string) string {
	var b strings.Builder
	b.WriteString("*Govra: pembaruan laporan Anda*\n\n")
	b.WriteString("Kode: " + code + "\n")
	if strings.TrimSpace(title) != "" {
		b.WriteString("Laporan: " + truncate(title, 100) + "\n")
	}
	b.WriteString("Status: *" + StatusLabel(status) + "*\n")
	if cleaned := truncate(note, maxNoteRunes); cleaned != "" {
		b.WriteString("Catatan: " + cleaned + "\n")
	}
	b.WriteString("\nLihat linimasa lengkap:\n" + reportURL(webURL, code))
	b.WriteString("\n\nPesan otomatis dari Govra.")
	return b.String()
}

func ReceivedMessage(webURL, code, title string) string {
	var b strings.Builder
	b.WriteString("*Govra: laporan Anda sudah kami terima*\n\n")
	b.WriteString("Kode: " + code + "\n")
	if strings.TrimSpace(title) != "" {
		b.WriteString("Laporan: " + truncate(title, 100) + "\n")
	}
	b.WriteString("\nKami akan mengabari Anda di sini setiap ada perkembangan. Pantau juga di:\n" + reportURL(webURL, code))
	b.WriteString("\n\nPesan otomatis dari Govra.")
	return b.String()
}

func AutoReply(webURL string) string {
	return "*Govra*\n\nDi sini kami hanya mengirim notifikasi perkembangan laporan Anda. " +
		"Kami tidak menerima pesan, pertanyaan, maupun laporan melalui WhatsApp, sehingga pesan Anda tidak akan dibaca.\n\n" +
		"Untuk membuat laporan atau memantau progresnya, buka:\n" + strings.TrimRight(webURL, "/")
}
