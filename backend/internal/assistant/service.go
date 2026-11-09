package assistant

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
	"sync"
	"time"

	"govra/internal/platform/ai"
)

const (
	maxCards         = 5
	accountRateLimit = 40
	publicRateLimit  = 20
	rateWindow       = 10 * time.Minute
)

const systemPrompt = `Anda adalah Govra AI, asisten kecerdasan buatan untuk platform transparansi program kerja pemerintah daerah dan pengaduan warga Govra.
Anda bersikap seperti asisten manusia yang ramah, hangat, empatik, cerdas, dan suportif kepada warga.

PANDUAN KOMUNIKASI:
1. Sapa pengguna dengan sebutan "SobatGovra" (contoh: "Halo SobatGovra!"). Jika nama pengguna diketahui, boleh menyapa "Halo SobatGovra [Nama]!".
2. Gaya bicara luwes, alami, dan empatik. Hindari bahasa kaku atau birokratis. Jawaban ringkas dan jelas.
3. JANGAN menulis karakter format markdown mentah seperti tanda bintang ganda atau garis bawah ganda. Gunakan teks bersih. Daftar boleh memakai angka atau tanda hubung.
4. Jangan beropini politik atau memihak partai, pejabat, maupun kandidat mana pun.
5. Jangan pernah membocorkan data pribadi pelapor atau koordinat GPS persis.
6. Jika pengguna menanyakan laporan milik orang lain, tolak dengan sopan tanpa membocorkan apakah laporan itu ada.
7. Gunakan istilah status persis seperti pada data (misalnya "Dalam Percepatan", "Tahap Penyelesaian", "Sesuai Jadwal", "Diproses"). Bersikap netral dan faktual: jangan menyebut program atau dinas "terlambat", "gagal", atau "buruk".

ATURAN DATA:
Anda WAJIB menjawab berdasarkan data faktual dari alat (tools). Jangan mengarang data. Jika data tidak ditemukan, katakan jujur dan santun bahwa data belum tersedia.

CARA MEMILIH ALAT:
- Status atau jumlah laporan milik pengguna: get_my_reports. Untuk satu kode tiket: get_report_status.
- Program kerja (proker): search_programs. Jika pengguna bertanya umum (proker yang berjalan, aktif, terbaru), WAJIB panggil search_programs dengan query kosong. Jangan kirim kalimat tanya pengguna sebagai query. Untuk detail anggaran dan jadwal: get_program_detail.
- Isu paling mendesak atau paling banyak didukung warga: get_urgent_issues.
- Mengecek apakah suatu masalah fasilitas di wilayah tertentu sudah dilaporkan: search_issues dengan kata kunci masalah dan wilayah.
- Rapor kinerja dinas: get_opd_scorecard.
- Cara membuat laporan: get_reporting_guide.

LINGKUP TOPIK:
Anda hanya melayani topik: (A) sapaan dan obrolan ringan, (B) identitas Anda dan pengguna, (C) status laporan atau tiket pengguna, (D) program kerja dan anggaran, (E) isu prioritas kota, (F) pengecekan apakah masalah di wilayah tertentu sudah dilaporkan, (G) rapor kinerja dinas dan cara melapor.
- Sapaan seperti "halo", "hai", "selamat pagi": sapa balik dengan hangat dan tanyakan apa yang ingin diketahui. Jangan anggap sapaan sebagai keluhan. Jangan sertakan kartu.
- Jika pengguna bertanya "kamu siapa": jelaskan Anda asisten AI keterbukaan informasi dan pelaporan Govra. Jika bertanya "saya siapa": jika sudah masuk sebutkan namanya, jika belum jelaskan bahwa mereka belum masuk sehingga nama belum diketahui.
- Pertanyaan di luar lingkup (resep, koding, game, musik, politik nasional, dan sejenisnya): tolak dengan ramah, jelaskan Anda khusus untuk transparansi daerah dan pengaduan warga, lalu ajak kembali ke topik Govra. Jangan sertakan kartu.
- Jika pengguna belum masuk dan menanyakan laporan pribadinya: jelaskan perlu masuk dulu, lalu sertakan tag [CARD:ACTION:login].
- Jika masalah yang ditanyakan di suatu wilayah benar-benar belum ada di hasil search_issues dan pengguna memang menanyakan kerusakan fasilitas tertentu: sampaikan dengan santun bahwa belum ada laporan tercatat, ajak menjadi pelapor pertama, dan sertakan [CARD:ACTION:create].

KARTU INTERAKTIF:
Di baris paling akhir jawaban, Anda boleh menyertakan tag kartu untuk item yang benar-benar muncul dari hasil alat pada percakapan ini:
- [CARD:REPORT:kode_laporan] untuk laporan milik pengguna.
- [CARD:PROGRAM:kode_proker] untuk program kerja.
- [CARD:ISSUE:id_isu] untuk isu warga (gunakan nilai ID persis dari hasil alat).
- [CARD:ACTION:login] atau [CARD:ACTION:create] untuk ajakan masuk atau membuat laporan.
Jangan membuat tag untuk item yang tidak ada di hasil alat. Maksimal 5 tag.`

type ctxKey string

const userNameKey ctxKey = "assistant.user_name"

func WithUserName(ctx context.Context, name string) context.Context {
	return context.WithValue(ctx, userNameKey, strings.TrimSpace(name))
}

func userNameFrom(ctx context.Context) string {
	name, _ := ctx.Value(userNameKey).(string)
	return name
}

type Service interface {
	AnswerQuestion(ctx context.Context, req *ChatRequest, reporterID, ip string) (*ChatReply, error)
}

type service struct {
	repo     Repository
	aiClient *ai.AssistantClient
}

func NewService(repo Repository, aiClient *ai.AssistantClient) Service {
	return &service{
		repo:     repo,
		aiClient: aiClient,
	}
}

type chatState struct {
	mu       sync.Mutex
	sources  []ChatSource
	programs map[string]ProgramItem
	reports  map[string]MyReportItem
	issues   map[string]IssueItem
}

func newChatState() *chatState {
	return &chatState{
		programs: make(map[string]ProgramItem),
		reports:  make(map[string]MyReportItem),
		issues:   make(map[string]IssueItem),
	}
}

func (s *service) AnswerQuestion(ctx context.Context, req *ChatRequest, reporterID, ip string) (*ChatReply, error) {
	if req == nil || len(req.Messages) == 0 {
		return nil, ErrEmptyMessages
	}
	messages := req.Messages
	if len(messages) > 20 {
		messages = messages[len(messages)-20:]
	}
	lastMsg := messages[len(messages)-1]
	if strings.ToUpper(lastMsg.Role) != "USER" {
		return nil, ErrLastNotUser
	}
	if !s.checkRateLimit(reporterID, ip) {
		return nil, ErrRateLimited
	}
	state := newChatState()
	executor := s.createToolExecutor(state, reporterID)
	if s.aiClient != nil && s.aiClient.HasKey() {
		turns := makeTurns(messages)
		prompt := systemPrompt + "\n\n" + userContext(ctx, reporterID)
		replyText, err := s.aiClient.GenerateChatCompletion(ctx, prompt, turns, getToolDeclarations(), executor)
		if err == nil && strings.TrimSpace(replyText) != "" {
			return buildReply(replyText, state), nil
		}
		log.Printf("assistant: panggilan Gemini gagal, memakai jawaban cadangan: %s", redactKey(errorText(err)))
	}
	return generateFallbackAnswer(ctx, s.repo, lastMsg.Content, reporterID)
}

var apiKeyPattern = regexp.MustCompile(`key=[^&"\s]+`)

func redactKey(text string) string {
	text = apiKeyPattern.ReplaceAllString(text, "key=***")
	if len(text) > 300 {
		return text[:300]
	}
	return text
}

func errorText(err error) string {
	if err == nil {
		return "balasan kosong dari model"
	}
	return err.Error()
}

func userContext(ctx context.Context, reporterID string) string {
	if reporterID == "" || reporterID == "system-bff" {
		return "INFO PENGGUNA:\nStatus login: belum masuk (pengguna umum atau anonim)."
	}
	name := userNameFrom(ctx)
	if name == "" {
		return "INFO PENGGUNA:\nStatus login: sudah masuk sebagai warga (pelapor)."
	}
	return "INFO PENGGUNA:\nNama: " + name + "\nStatus login: sudah masuk sebagai warga (pelapor)."
}

func (s *service) checkRateLimit(reporterID, ip string) bool {
	if reporterID != "" && reporterID != "system-bff" {
		return s.repo.AllowRateLimit("user:"+reporterID, accountRateLimit, rateWindow)
	}
	return s.repo.AllowRateLimit("ip:"+ip, publicRateLimit, rateWindow)
}

func makeTurns(messages []ChatMessage) []ai.ChatTurn {
	var turns []ai.ChatTurn
	for _, m := range messages {
		role := ai.RoleUser
		if strings.ToUpper(m.Role) == "ASSISTANT" {
			role = ai.RoleAssistant
		}
		turns = append(turns, ai.ChatTurn{Role: role, Content: m.Content})
	}
	return turns
}

func (s *service) createToolExecutor(st *chatState, reporterID string) ai.ChatToolExecutor {
	return func(ctx context.Context, call ai.ChatToolCall) (ai.ChatToolResponse, error) {
		switch call.Name {
		case "get_my_reports":
			return s.execGetMyReports(ctx, reporterID, st)
		case "get_report_status":
			return s.execGetReportStatus(ctx, call.Args["code"], reporterID, st)
		case "search_programs":
			return s.execSearchPrograms(ctx, call.Args["query"], call.Args["opd"], call.Args["status"], st)
		case "get_program_detail":
			return s.execGetProgramDetail(ctx, call.Args["code"], st)
		case "get_urgent_issues":
			return s.execSearchIssues(ctx, "", call.Name, st)
		case "search_issues":
			return s.execSearchIssues(ctx, call.Args["query"], call.Name, st)
		case "get_opd_scorecard":
			return s.execGetOpdScorecard(ctx, call.Args["opd_code"])
		case "get_reporting_guide":
			return ai.ChatToolResponse{Name: call.Name, Content: reportingGuideText}, nil
		default:
			return ai.ChatToolResponse{Name: call.Name, Content: `{"error":"alat tidak dikenal"}`}, nil
		}
	}
}

func (s *service) execGetMyReports(ctx context.Context, reporterID string, st *chatState) (ai.ChatToolResponse, error) {
	if reporterID == "" || reporterID == "system-bff" {
		return ai.ChatToolResponse{Name: "get_my_reports", Content: `{"status":"unauthorized","message":"Pengguna belum masuk. Silakan minta pengguna untuk masuk terlebih dahulu."}`}, nil
	}
	reports, err := s.repo.ListMyReports(ctx, reporterID)
	if err != nil {
		return ai.ChatToolResponse{Name: "get_my_reports", Content: fmt.Sprintf(`{"error":"%s"}`, err.Error())}, nil
	}
	st.mu.Lock()
	for _, r := range reports {
		st.reports[strings.ToUpper(r.Code)] = r
		if r.IssueID != "" && (r.Visibility == "PUBLIC" || r.Visibility == "PUBLIK") {
			st.sources = append(st.sources, ChatSource{Kind: "ISSUE", Title: r.Title, Path: "/isu/" + r.IssueID})
		}
	}
	st.mu.Unlock()
	view := make([]MyReportItem, len(reports))
	copy(view, reports)
	for i := range view {
		view[i].Status = issueStatusLabel(view[i].Status)
	}
	b, _ := json.Marshal(view)
	return ai.ChatToolResponse{Name: "get_my_reports", Content: string(b)}, nil
}

func (s *service) execGetReportStatus(ctx context.Context, code, reporterID string, st *chatState) (ai.ChatToolResponse, error) {
	rep, err := s.repo.GetReportByCode(ctx, code)
	if err != nil || rep == nil {
		return ai.ChatToolResponse{Name: "get_report_status", Content: `{"status":"not_found","message":"Laporan tidak ditemukan."}`}, nil
	}
	isOwner := reporterID != "" && reporterID != "system-bff" && rep.ReporterID == reporterID
	if (rep.Visibility == "CONFIDENTIAL" || rep.Visibility == "RAHASIA") && !isOwner {
		return ai.ChatToolResponse{Name: "get_report_status", Content: `{"status":"not_found","message":"Laporan tidak ditemukan di akun Anda."}`}, nil
	}
	st.mu.Lock()
	if isOwner {
		st.reports[strings.ToUpper(rep.Code)] = MyReportItem{Code: rep.Code, Title: rep.Title, Status: rep.Status, IssueID: rep.IssueID, Visibility: rep.Visibility}
	}
	if rep.IssueID != "" && (rep.Visibility == "PUBLIC" || rep.Visibility == "PUBLIK") {
		st.sources = append(st.sources, ChatSource{Kind: "ISSUE", Title: rep.Title, Path: "/isu/" + rep.IssueID})
	}
	st.mu.Unlock()
	view := *rep
	view.Status = issueStatusLabel(view.Status)
	view.ReporterID = ""
	b, _ := json.Marshal(view)
	return ai.ChatToolResponse{Name: "get_report_status", Content: string(b)}, nil
}

func (s *service) execSearchPrograms(ctx context.Context, q, opd, status string, st *chatState) (ai.ChatToolResponse, error) {
	cleaned := strings.Join(extractQueryTerms(q), " ")
	progs, err := s.repo.SearchPrograms(ctx, cleaned, opd, status)
	if err != nil {
		return ai.ChatToolResponse{Name: "search_programs", Content: fmt.Sprintf(`{"error":"%s"}`, err.Error())}, nil
	}
	st.mu.Lock()
	for _, p := range progs {
		st.programs[strings.ToUpper(p.Code)] = p
		st.sources = append(st.sources, ChatSource{Kind: "PROGRAM", Title: p.Name, Path: "/proker/" + p.Code})
	}
	st.mu.Unlock()
	view := make([]ProgramItem, len(progs))
	copy(view, progs)
	for i := range view {
		view[i].Status = programStatusLabel(view[i].Status)
	}
	b, _ := json.Marshal(view)
	return ai.ChatToolResponse{Name: "search_programs", Content: string(b)}, nil
}

func (s *service) execGetProgramDetail(ctx context.Context, code string, st *chatState) (ai.ChatToolResponse, error) {
	p, err := s.repo.GetProgramByCode(ctx, code)
	if err != nil || p == nil {
		return ai.ChatToolResponse{Name: "get_program_detail", Content: `{"status":"not_found","message":"Program kerja tidak ditemukan."}`}, nil
	}
	st.mu.Lock()
	st.programs[strings.ToUpper(p.Code)] = ProgramItem{
		Code:            p.Code,
		Name:            p.Name,
		OpdName:         p.OpdName,
		Status:          p.Status,
		ProgressPercent: p.ProgressPercent,
		ExpectedPercent: p.ExpectedPercent,
		TargetOutput:    p.TargetOutput,
	}
	st.sources = append(st.sources, ChatSource{Kind: "PROGRAM", Title: p.Name, Path: "/proker/" + p.Code})
	st.mu.Unlock()
	view := *p
	view.Status = programStatusLabel(view.Status)
	b, _ := json.Marshal(view)
	return ai.ChatToolResponse{Name: "get_program_detail", Content: string(b)}, nil
}

func (s *service) execSearchIssues(ctx context.Context, query, toolName string, st *chatState) (ai.ChatToolResponse, error) {
	items, err := s.repo.SearchIssues(ctx, query, maxCards)
	if err != nil {
		return ai.ChatToolResponse{Name: toolName, Content: fmt.Sprintf(`{"error":"%s"}`, err.Error())}, nil
	}
	if len(items) == 0 {
		return ai.ChatToolResponse{Name: toolName, Content: `{"status":"not_found","message":"Belum ada laporan warga yang cocok di sistem."}`}, nil
	}
	st.mu.Lock()
	for _, it := range items {
		st.issues[strings.ToLower(it.ID)] = it
		st.sources = append(st.sources, ChatSource{Kind: "ISSUE", Title: it.Title, Path: "/isu/" + it.ID})
	}
	st.mu.Unlock()
	view := make([]IssueItem, len(items))
	copy(view, items)
	for i := range view {
		view[i].Status = issueStatusLabel(view[i].Status)
	}
	b, _ := json.Marshal(view)
	return ai.ChatToolResponse{Name: toolName, Content: string(b)}, nil
}

func (s *service) execGetOpdScorecard(ctx context.Context, opdCode string) (ai.ChatToolResponse, error) {
	sc, err := s.repo.GetOpdScorecard(ctx, opdCode)
	if err != nil || sc == nil {
		return ai.ChatToolResponse{Name: "get_opd_scorecard", Content: `{"status":"not_found","message":"Rapor OPD tidak ditemukan."}`}, nil
	}
	b, _ := json.Marshal(sc)
	return ai.ChatToolResponse{Name: "get_opd_scorecard", Content: string(b)}, nil
}

var cardTagPattern = regexp.MustCompile(`\[CARD:(REPORT|PROGRAM|ISSUE|ACTION):([A-Za-z0-9_-]+)\]`)

var blankLinesPattern = regexp.MustCompile(`\n{3,}`)

func cleanFormatting(text string) string {
	text = strings.ReplaceAll(text, "**", "")
	text = strings.ReplaceAll(text, "__", "")
	text = blankLinesPattern.ReplaceAllString(text, "\n\n")
	return strings.TrimSpace(text)
}

func buildReply(raw string, st *chatState) *ChatReply {
	st.mu.Lock()
	defer st.mu.Unlock()

	var cards []ChatCard
	seen := make(map[string]bool)
	for _, m := range cardTagPattern.FindAllStringSubmatch(raw, -1) {
		if len(cards) >= maxCards {
			break
		}
		card, ok := cardFor(m[1], m[2], st)
		if !ok || seen[card.ID] {
			continue
		}
		seen[card.ID] = true
		cards = append(cards, card)
	}

	reply := cleanFormatting(cardTagPattern.ReplaceAllString(raw, ""))
	return &ChatReply{Reply: reply, Sources: deduplicateSources(st.sources), Cards: cards}
}

func cardFor(kind, key string, st *chatState) (ChatCard, bool) {
	switch kind {
	case "REPORT":
		r, ok := st.reports[strings.ToUpper(key)]
		if !ok {
			return ChatCard{}, false
		}
		title := r.Title
		if title == "" {
			title = "Laporan " + r.Code
		}
		label := issueStatusLabel(r.Status)
		return ChatCard{
			ID:          "card-rep-" + r.Code,
			Type:        "REPORT",
			Title:       title,
			Subtitle:    "Kode Tiket: " + r.Code,
			Status:      label,
			StatusTone:  reportTone(r.Status),
			Badge:       label,
			Href:        "/pelapor/laporan/" + r.Code,
			ActionLabel: "Lihat Linimasa & Bukti Laporan",
		}, true
	case "PROGRAM":
		p, ok := st.programs[strings.ToUpper(key)]
		if !ok {
			return ChatCard{}, false
		}
		label := programStatusLabel(p.Status)
		progress := p.ProgressPercent
		tone := "warn"
		if p.Status == "SELESAI" {
			tone = "good"
		}
		return ChatCard{
			ID:          "card-prog-" + p.Code,
			Type:        "PROGRAM",
			Title:       p.Name,
			Subtitle:    p.OpdName,
			Status:      label,
			StatusTone:  tone,
			Badge:       label,
			Progress:    &progress,
			Meta:        fmt.Sprintf("Realisasi: %s • Target: %s", formatPercent(p.ProgressPercent), formatPercent(p.ExpectedPercent)),
			Href:        "/proker/" + p.Code,
			ActionLabel: "Lihat Detail Program & Realisasi",
		}, true
	case "ISSUE":
		it, ok := st.issues[strings.ToLower(key)]
		if !ok {
			return ChatCard{}, false
		}
		urgent := it.Urgency == "URGENT" || it.SupporterCount >= 15
		badge := "Didukung Warga"
		if urgent {
			badge = "Mendesak / Prioritas"
		}
		return ChatCard{
			ID:          "card-iss-" + it.ID,
			Type:        "ISSUE",
			Title:       it.Title,
			Subtitle:    it.Area,
			Status:      issueStatusLabel(it.Status),
			StatusTone:  "warn",
			Badge:       badge,
			Meta:        fmt.Sprintf("Didukung oleh %d warga sekitar", it.SupporterCount),
			Href:        "/isu/" + it.ID,
			ActionLabel: "Lihat Isu & Berikan Dukungan",
		}, true
	case "ACTION":
		switch strings.ToLower(key) {
		case "create":
			return ChatCard{
				ID:          "act-create-report",
				Type:        "ACTION",
				Title:       "Ajukan Laporan Terkait",
				Subtitle:    "Jadilah yang pertama melaporkan kendala ini agar segera ditangani dinas",
				Href:        "/pelapor/lapor",
				ActionLabel: "Buat Laporan Baru Sekarang",
			}, true
		case "login":
			return ChatCard{
				ID:          "act-login-govra",
				Type:        "ACTION",
				Title:       "Masuk ke Akun Govra",
				Subtitle:    "Masuk dengan akun pelapor untuk melihat status tiket laporan Anda",
				Href:        "/masuk",
				ActionLabel: "Masuk Sekarang",
			}, true
		}
	}
	return ChatCard{}, false
}

func issueStatusLabel(status string) string {
	labels := map[string]string{
		"DIAJUKAN":            "Diajukan",
		"MENUNGGU_VERIFIKASI": "Menunggu Verifikasi",
		"DITERUSKAN":          "Diteruskan",
		"DIPROSES":            "Diproses",
		"DIALIHKAN":           "Dialihkan",
		"DIBUKA_ULANG":        "Dibuka Ulang",
		"DITOLAK":             "Ditolak",
		"SELESAI":             "Selesai",
	}
	if label, ok := labels[status]; ok {
		return label
	}
	return status
}

func programStatusLabel(status string) string {
	labels := map[string]string{
		"BELUM_DIMULAI":    "Belum Dimulai",
		"SESUAI_JADWAL":    "Sesuai Jadwal",
		"TERLAMBAT":        "Dalam Percepatan",
		"MELEWATI_TENGGAT": "Tahap Penyelesaian",
		"SELESAI":          "Selesai",
	}
	if label, ok := labels[status]; ok {
		return label
	}
	return status
}

func reportTone(status string) string {
	switch status {
	case "SELESAI":
		return "good"
	case "DIPROSES":
		return "warn"
	default:
		return "neutral"
	}
}

func formatPercent(value float64) string {
	if value == float64(int64(value)) {
		return fmt.Sprintf("%d%%", int64(value))
	}
	return strings.Replace(fmt.Sprintf("%.1f%%", value), ".", ",", 1)
}

func deduplicateSources(sources []ChatSource) []ChatSource {
	res := []ChatSource{}
	seen := make(map[string]bool)
	for _, s := range sources {
		if !seen[s.Path] && s.Path != "" {
			seen[s.Path] = true
			res = append(res, s)
			if len(res) >= 5 {
				break
			}
		}
	}
	return res
}
