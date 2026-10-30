package assistant

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"govra/internal/platform/ai"
	"govra/internal/platform/httpx"
	"govra/internal/program"
	"govra/internal/report"
)

func setupTestService() (Service, Repository) {
	progRepo := program.NewRepository(nil)
	repRepo := report.NewRepository(nil)
	_ = repRepo.SaveReport(context.Background(), &report.Report{
		Code:        "GVR-2610-TEST",
		Title:       "Lampu Jalan Padam",
		Description: "Lampu padam di jalan utama",
		Visibility:  report.VisibilityConfidential,
		Status:      report.StatusDiajukan,
		ReporterID:  "user-123",
	})
	_ = repRepo.SaveReport(context.Background(), &report.Report{
		Code:        "GVR-2610-PUB1",
		Title:       "Jalan Berlubang",
		Description: "Jalan berlubang cukup parah",
		Visibility:  report.VisibilityPublic,
		Status:      report.StatusDiproses,
		ReporterID:  "user-999",
		IssueID:     "issue-111",
	})
	repo := NewRepository(nil, progRepo, repRepo)
	svc := NewService(repo, ai.NewAssistantClient("", ""))
	return svc, repo
}

func TestAssistant_ProgramsSearch(t *testing.T) {
	svc, _ := setupTestService()
	req := &ChatRequest{
		Messages: []ChatMessage{
			{Role: "USER", Content: "Tolong tampilkan program kerja tentang jalan"},
		},
	}
	res, err := svc.AnswerQuestion(context.Background(), req, "user-123", "127.0.0.1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.Reply == "" {
		t.Fatal("expected reply to be non-empty")
	}
}

func TestAssistant_ReportStatus_IDOR(t *testing.T) {
	svc, _ := setupTestService()
	reqOwn := &ChatRequest{
		Messages: []ChatMessage{
			{Role: "USER", Content: "Bagaimana status laporan GVR-2610-TEST?"},
		},
	}
	resOwn, err := svc.AnswerQuestion(context.Background(), reqOwn, "user-123", "127.0.0.1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resOwn.Reply == "" || bytes.Contains([]byte(resOwn.Reply), []byte("tidak ditemukan")) {
		t.Fatalf("expected own report to be found, got %s", resOwn.Reply)
	}

	reqOther := &ChatRequest{
		Messages: []ChatMessage{
			{Role: "USER", Content: "Bagaimana status laporan GVR-2610-TEST?"},
		},
	}
	resOther, err := svc.AnswerQuestion(context.Background(), reqOther, "user-attacker", "127.0.0.1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !bytes.Contains([]byte(resOther.Reply), []byte("tidak ditemukan")) {
		t.Fatalf("expected private report of other user to be rejected, got: %s", resOther.Reply)
	}
}

func TestAssistant_MyReports(t *testing.T) {
	svc, _ := setupTestService()
	reqAnon := &ChatRequest{
		Messages: []ChatMessage{
			{Role: "USER", Content: "Tampilkan laporan saya"},
		},
	}
	resAnon, err := svc.AnswerQuestion(context.Background(), reqAnon, "", "127.0.0.1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !bytes.Contains([]byte(resAnon.Reply), []byte("masuk")) {
		t.Fatalf("expected login prompt for anonymous user, got: %s", resAnon.Reply)
	}

	reqUser := &ChatRequest{
		Messages: []ChatMessage{
			{Role: "USER", Content: "Tampilkan laporan saya"},
		},
	}
	resUser, err := svc.AnswerQuestion(context.Background(), reqUser, "user-123", "127.0.0.1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !bytes.Contains([]byte(resUser.Reply), []byte("GVR-2610-TEST")) {
		t.Fatalf("expected user-123 reports in response, got: %s", resUser.Reply)
	}
}

func TestAssistant_ReportingGuide(t *testing.T) {
	svc, _ := setupTestService()
	req := &ChatRequest{
		Messages: []ChatMessage{
			{Role: "USER", Content: "Bagaimana cara melapor di aplikasi Govra?"},
		},
	}
	res, err := svc.AnswerQuestion(context.Background(), req, "", "127.0.0.1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !bytes.Contains([]byte(res.Reply), []byte("Lapor")) {
		t.Fatalf("expected reporting guide in response, got: %s", res.Reply)
	}
}

func TestAssistant_RateLimiting(t *testing.T) {
	_, repo := setupTestService()
	key := "test-limit-key"
	limit := 3
	window := 10 * time.Second

	for i := 0; i < limit; i++ {
		if !repo.AllowRateLimit(key, limit, window) {
			t.Fatalf("expected iteration %d to be allowed", i)
		}
	}
	if repo.AllowRateLimit(key, limit, window) {
		t.Fatal("expected request exceeding limit to be denied")
	}
}

func TestAssistant_Handler_Validation(t *testing.T) {
	svc, _ := setupTestService()
	h := NewHandler(svc)
	app := fiber.New(fiber.Config{ErrorHandler: httpx.ErrorHandler})
	h.RegisterRoutes(app)

	body := []byte(`{"messages":[]}`)
	req := httptest.NewRequest(http.MethodPost, "/assistant/messages", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty messages, got %d", resp.StatusCode)
	}

	bodyInvalidRole := []byte(`{"messages":[{"role":"INVALID","content":"halo"}]}`)
	req2 := httptest.NewRequest(http.MethodPost, "/assistant/messages", bytes.NewReader(bodyInvalidRole))
	req2.Header.Set("Content-Type", "application/json")
	resp2, _ := app.Test(req2)
	if resp2.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400 for invalid role, got %d", resp2.StatusCode)
	}

	bodyValid := []byte(`{"messages":[{"role":"USER","content":"panduan cara lapor"}]}`)
	req3 := httptest.NewRequest(http.MethodPost, "/assistant/messages", bytes.NewReader(bodyValid))
	req3.Header.Set("Content-Type", "application/json")
	resp3, _ := app.Test(req3)
	if resp3.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200 for valid question, got %d", resp3.StatusCode)
	}
	var reply ChatReply
	_ = json.NewDecoder(resp3.Body).Decode(&reply)
	if reply.Reply == "" {
		t.Fatal("expected reply content from handler")
	}
}
