package assistant

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"govra/internal/platform/ai"
)

const systemPrompt = `Anda adalah Govra Assistant, asisten kecerdasan buatan resmi untuk platform transparansi program kerja pemerintah daerah dan pengaduan warga Govra.
Pedoman perilaku Anda:
1. Anda WAJIB menjawab hanya berdasarkan data faktual sistem yang diperoleh dari pemanggilan alat (tools). Jangan mengarang data atau berhalusinasi.
2. Jika data tidak ditemukan, katakan secara jujur dan santun bahwa data tidak ditemukan di sistem.
3. Anda tidak boleh beropini politik, memihak partai, pejabat, atau kandidat kepala daerah mana pun.
4. Jangan pernah membocorkan data pribadi pelapor atau koordinat persis GPS.
5. Jika pengguna menanyakan laporan rahasia milik orang lain, tolak dengan sopan tanpa membocorkan apakah laporan tersebut ada di sistem.
6. Jawaban Anda harus ramah, padat, jelas, dan menggunakan Bahasa Indonesia baku yang santun.`

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
	var mu sync.Mutex
	var sources []ChatSource
	executor := s.createToolExecutor(&mu, &sources, reporterID)
	if s.aiClient != nil && s.aiClient.HasKey() {
		turns := makeTurns(messages)
		replyText, err := s.aiClient.GenerateChatCompletion(ctx, systemPrompt, turns, getToolDeclarations(), executor)
		if err == nil && strings.TrimSpace(replyText) != "" {
			return &ChatReply{Reply: replyText, Sources: deduplicateSources(sources)}, nil
		}
	}
	return generateFallbackAnswer(ctx, s.repo, lastMsg.Content, reporterID)
}

func (s *service) checkRateLimit(reporterID, ip string) bool {
	if reporterID != "" && reporterID != "system-bff" {
		return s.repo.AllowRateLimit("user:"+reporterID, 20, 10*time.Minute)
	}
	return s.repo.AllowRateLimit("ip:"+ip, 10, 10*time.Minute)
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

func (s *service) createToolExecutor(mu *sync.Mutex, sources *[]ChatSource, reporterID string) ai.ChatToolExecutor {
	return func(ctx context.Context, call ai.ChatToolCall) (ai.ChatToolResponse, error) {
		switch call.Name {
		case "get_my_reports":
			return s.execGetMyReports(ctx, reporterID, mu, sources)
		case "get_report_status":
			return s.execGetReportStatus(ctx, call.Args["code"], reporterID, mu, sources)
		case "search_programs":
			return s.execSearchPrograms(ctx, call.Args["query"], call.Args["opd"], call.Args["status"], mu, sources)
		case "get_program_detail":
			return s.execGetProgramDetail(ctx, call.Args["code"], mu, sources)
		case "get_opd_scorecard":
			return s.execGetOpdScorecard(ctx, call.Args["opd_code"])
		case "get_reporting_guide":
			return ai.ChatToolResponse{Name: call.Name, Content: reportingGuideText}, nil
		default:
			return ai.ChatToolResponse{Name: call.Name, Content: `{"error":"alat tidak dikenal"}`}, nil
		}
	}
}

func (s *service) execGetMyReports(ctx context.Context, reporterID string, mu *sync.Mutex, sources *[]ChatSource) (ai.ChatToolResponse, error) {
	if reporterID == "" || reporterID == "system-bff" {
		return ai.ChatToolResponse{Name: "get_my_reports", Content: `{"status":"unauthorized","message":"Pengguna belum masuk. Silakan minta pengguna untuk masuk terlebih dahulu."}`}, nil
	}
	reports, err := s.repo.ListMyReports(ctx, reporterID)
	if err != nil {
		return ai.ChatToolResponse{Name: "get_my_reports", Content: fmt.Sprintf(`{"error":"%s"}`, err.Error())}, nil
	}
	mu.Lock()
	for _, r := range reports {
		if r.IssueID != "" && (r.Visibility == "PUBLIC" || r.Visibility == "PUBLIK") {
			*sources = append(*sources, ChatSource{Kind: "ISSUE", Title: r.Title, Path: "/isu/" + r.IssueID})
		}
	}
	mu.Unlock()
	b, _ := json.Marshal(reports)
	return ai.ChatToolResponse{Name: "get_my_reports", Content: string(b)}, nil
}

func (s *service) execGetReportStatus(ctx context.Context, code, reporterID string, mu *sync.Mutex, sources *[]ChatSource) (ai.ChatToolResponse, error) {
	rep, err := s.repo.GetReportByCode(ctx, code)
	if err != nil || rep == nil {
		return ai.ChatToolResponse{Name: "get_report_status", Content: `{"status":"not_found","message":"Laporan tidak ditemukan."}`}, nil
	}
	if (rep.Visibility == "CONFIDENTIAL" || rep.Visibility == "RAHASIA") && (reporterID == "" || rep.ReporterID != reporterID) {
		return ai.ChatToolResponse{Name: "get_report_status", Content: `{"status":"not_found","message":"Laporan tidak ditemukan di akun Anda."}`}, nil
	}
	if rep.IssueID != "" && (rep.Visibility == "PUBLIC" || rep.Visibility == "PUBLIK") {
		mu.Lock()
		*sources = append(*sources, ChatSource{Kind: "ISSUE", Title: rep.Title, Path: "/isu/" + rep.IssueID})
		mu.Unlock()
	}
	b, _ := json.Marshal(rep)
	return ai.ChatToolResponse{Name: "get_report_status", Content: string(b)}, nil
}

func (s *service) execSearchPrograms(ctx context.Context, q, opd, status string, mu *sync.Mutex, sources *[]ChatSource) (ai.ChatToolResponse, error) {
	progs, err := s.repo.SearchPrograms(ctx, q, opd, status)
	if err != nil {
		return ai.ChatToolResponse{Name: "search_programs", Content: fmt.Sprintf(`{"error":"%s"}`, err.Error())}, nil
	}
	mu.Lock()
	for _, p := range progs {
		*sources = append(*sources, ChatSource{Kind: "PROGRAM", Title: p.Name, Path: "/proker/" + p.Code})
	}
	mu.Unlock()
	b, _ := json.Marshal(progs)
	return ai.ChatToolResponse{Name: "search_programs", Content: string(b)}, nil
}

func (s *service) execGetProgramDetail(ctx context.Context, code string, mu *sync.Mutex, sources *[]ChatSource) (ai.ChatToolResponse, error) {
	p, err := s.repo.GetProgramByCode(ctx, code)
	if err != nil || p == nil {
		return ai.ChatToolResponse{Name: "get_program_detail", Content: `{"status":"not_found","message":"Program kerja tidak ditemukan."}`}, nil
	}
	mu.Lock()
	*sources = append(*sources, ChatSource{Kind: "PROGRAM", Title: p.Name, Path: "/proker/" + p.Code})
	mu.Unlock()
	b, _ := json.Marshal(p)
	return ai.ChatToolResponse{Name: "get_program_detail", Content: string(b)}, nil
}

func (s *service) execGetOpdScorecard(ctx context.Context, opdCode string) (ai.ChatToolResponse, error) {
	sc, err := s.repo.GetOpdScorecard(ctx, opdCode)
	if err != nil || sc == nil {
		return ai.ChatToolResponse{Name: "get_opd_scorecard", Content: `{"status":"not_found","message":"Rapor OPD tidak ditemukan."}`}, nil
	}
	b, _ := json.Marshal(sc)
	return ai.ChatToolResponse{Name: "get_opd_scorecard", Content: string(b)}, nil
}

func deduplicateSources(sources []ChatSource) []ChatSource {
	var res []ChatSource
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
