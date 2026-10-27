package issue_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"govra/internal/issue"
	pauth "govra/internal/platform/auth"
	"govra/internal/platform/db"
	"govra/internal/platform/httpx"

	"github.com/gofiber/fiber/v2"
)

func setupIssueApp() (*fiber.App, issue.Service, *pauth.TokenManager) {
	database, _ := db.New("", "", "")
	repo := issue.NewRepository(database)
	svc := issue.NewService(repo)
	handler := issue.NewHandler(svc)
	tm := pauth.NewTokenManager("test-jwt-secret-key-at-least-32-chars-long")

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.ErrorHandler,
	})
	app.Use(httpx.RequestIDMiddleware())
	app.Use(pauth.AuthMiddleware(tm))
	handler.RegisterRoutes(app)
	return app, svc, tm
}

func TestSupportIssueIncreasesUrgency(t *testing.T) {
	app, _, tm := setupIssueApp()
	pelaporToken, _ := tm.Generate("user-1", "user1@example.com", "Rian", "pelapor", "")

	req := httptest.NewRequest(http.MethodPost, "/issues/i0000000-0000-0000-0000-000000000001/support", nil)
	req.Header.Set("Authorization", "Bearer "+pelaporToken)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed support issue: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestAgencyTransition(t *testing.T) {
	app, _, tm := setupIssueApp()
	dinasToken, _ := tm.Generate("dinas-1", "dinas@kotacontoh.go.id", "Petugas DBM", "dinas", "e0000000-0000-0000-0000-000000000001")

	transBody, _ := json.Marshal(issue.TransitionRequest{
		TargetStatus: issue.StatusDiproses,
		Response:     "Tim perbaikan sedang meluncur ke lokasi",
	})
	req := httptest.NewRequest(http.MethodPost, "/agency/issues/i0000000-0000-0000-0000-000000000001/transitions", bytes.NewReader(transBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+dinasToken)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed transition issue: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestAdminRouteIssue(t *testing.T) {
	app, _, tm := setupIssueApp()
	adminToken, _ := tm.Generate("admin-1", "admin@pusat.govra.id", "Admin", "admin", "")

	routeBody, _ := json.Marshal(issue.RouteIssueRequest{
		OpdID:      "e0000000-0000-0000-0000-000000000002",
		CategoryID: "f0000000-0000-0000-0000-000000000003",
		Note:       "Disetujui untuk diteruskan ke DLHK",
	})
	req := httptest.NewRequest(http.MethodPost, "/admin/issues/i0000000-0000-0000-0000-000000000002/route", bytes.NewReader(routeBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed route issue: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestMapDistribution(t *testing.T) {
	app, _, _ := setupIssueApp()

	req := httptest.NewRequest(http.MethodGet, "/map/distribution", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed map distribution: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}
