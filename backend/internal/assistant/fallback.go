package assistant

import (
	"context"
	"fmt"
	"regexp"
	"strings"
)

var (
	reportCodeRegex = regexp.MustCompile(`(?i)(GVR|TLK)-\d{4}-[A-Z0-9]{4}`)
	myReportsRegex  = regexp.MustCompile(`(?i)laporan\s*(saya|ku)|status\s+laporan`)
	guideRegex      = regexp.MustCompile(`(?i)cara\s+(lapor|melapor|membuat)|panduan|bagaimana\s+(cara\s+)?(lapor|melapor)`)
)

func generateFallbackAnswer(ctx context.Context, repo Repository, question, reporterID string) (*ChatReply, error) {
	if codeMatch := reportCodeRegex.FindString(question); codeMatch != "" {
		return handleFallbackReportCode(ctx, repo, codeMatch, reporterID)
	}
	if myReportsRegex.MatchString(question) {
		return handleFallbackMyReports(ctx, repo, reporterID)
	}
	if guideRegex.MatchString(question) {
		return &ChatReply{
			Reply:   reportingGuideText,
			Sources: nil,
		}, nil
	}
	return handleFallbackPrograms(ctx, repo, question)
}

func handleFallbackReportCode(ctx context.Context, repo Repository, code, reporterID string) (*ChatReply, error) {
	rep, err := repo.GetReportByCode(ctx, code)
	if err != nil || rep == nil {
		return &ChatReply{
			Reply:   fmt.Sprintf("Laporan dengan kode %s tidak ditemukan di akun Anda.", code),
			Sources: nil,
		}, nil
	}
	if (rep.Visibility == "CONFIDENTIAL" || rep.Visibility == "RAHASIA") && (reporterID == "" || rep.ReporterID != reporterID) {
		return &ChatReply{
			Reply:   fmt.Sprintf("Laporan dengan kode %s tidak ditemukan di akun Anda.", code),
			Sources: nil,
		}, nil
	}
	msg := fmt.Sprintf("Laporan **%s** (%s) berstatus **%s**.", rep.Code, rep.Title, rep.Status)
	if len(rep.Notes) > 0 {
		msg += fmt.Sprintf(" Catatan terakhir: %s.", rep.Notes[len(rep.Notes)-1])
	}
	var sources []ChatSource
	if rep.IssueID != "" && (rep.Visibility == "PUBLIC" || rep.Visibility == "PUBLIK") {
		sources = append(sources, ChatSource{
			Kind:  "ISSUE",
			Title: rep.Title,
			Path:  "/isu/" + rep.IssueID,
		})
	}
	return &ChatReply{Reply: msg, Sources: sources}, nil
}

func handleFallbackMyReports(ctx context.Context, repo Repository, reporterID string) (*ChatReply, error) {
	if reporterID == "" {
		return &ChatReply{
			Reply:   "Untuk melihat riwayat laporan Anda, silakan masuk ke akun terlebih dahulu.",
			Sources: nil,
		}, nil
	}
	reports, err := repo.ListMyReports(ctx, reporterID)
	if err != nil || len(reports) == 0 {
		return &ChatReply{
			Reply:   "Anda belum memiliki laporan pengaduan yang diajukan.",
			Sources: nil,
		}, nil
	}
	var lines []string
	var sources []ChatSource
	lines = append(lines, fmt.Sprintf("Anda memiliki %d laporan terbaru:", len(reports)))
	for _, r := range reports {
		title := r.Title
		if title == "" {
			title = "Pengaduan Warga"
		}
		lines = append(lines, fmt.Sprintf("- **%s**: %s, status %s", r.Code, title, r.Status))
		if r.IssueID != "" && (r.Visibility == "PUBLIC" || r.Visibility == "PUBLIK") {
			sources = append(sources, ChatSource{
				Kind:  "ISSUE",
				Title: title,
				Path:  "/isu/" + r.IssueID,
			})
		}
	}
	return &ChatReply{Reply: strings.Join(lines, "\n"), Sources: sources}, nil
}

func handleFallbackPrograms(ctx context.Context, repo Repository, question string) (*ChatReply, error) {
	terms := extractQueryTerms(question)
	q := strings.Join(terms, " ")
	progs, err := repo.SearchPrograms(ctx, q, "", "")
	if err != nil || len(progs) == 0 {
		return &ChatReply{
			Reply:   "Saya hanya dapat membantu menjawab pertanyaan seputar program kerja, isu warga, rapor kinerja, dan status laporan di Govra.",
			Sources: nil,
		}, nil
	}
	var lines []string
	var sources []ChatSource
	lines = append(lines, fmt.Sprintf("Saya menemukan %d program kerja yang berkaitan:", len(progs)))
	for _, p := range progs {
		lines = append(lines, fmt.Sprintf("- **%s** (%s): progres %.1f%%, status %s", p.Name, p.OpdName, p.ProgressPercent, p.Status))
		sources = append(sources, ChatSource{
			Kind:  "PROGRAM",
			Title: p.Name,
			Path:  "/proker/" + p.Code,
		})
	}
	return &ChatReply{Reply: strings.Join(lines, "\n"), Sources: sources}, nil
}

func extractQueryTerms(text string) []string {
	stopWords := map[string]bool{
		"apa": true, "proker": true, "program": true, "kerja": true,
		"yang": true, "tolong": true, "tampilkan": true, "info": true,
		"ada": true, "bagaimana": true, "dinas": true, "tentang": true,
		"status": true, "kota": true, "adalah": true, "di": true,
		"sedang": true, "berjalan": true, "proses": true, "diproses": true,
		"dikerjakan": true, "diprises": true, "sekarang": true, "saat": true,
		"ini": true, "terbaru": true, "aktif": true, "semua": true,
	}
	words := strings.Fields(strings.ToLower(text))
	var res []string
	for _, w := range words {
		cleaned := strings.Trim(w, `.,!?:;'"()[]{}*-/`)
		if len(cleaned) >= 3 && !stopWords[cleaned] {
			res = append(res, cleaned)
		}
	}
	return res
}
