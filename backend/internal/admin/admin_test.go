package admin_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"govra/internal/admin"
	pauth "govra/internal/platform/auth"
	"govra/internal/platform/httpx"

	"github.com/gofiber/fiber/v2"
)

func setupAdminApp() (*fiber.App, admin.Service, *pauth.TokenManager) {
	svc := admin.NewService(nil)
	handler := admin.NewHandler(svc)
	tm := pauth.NewTokenManager("test-jwt-secret-key-at-least-32-chars-long")

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.ErrorHandler,
	})
	app.Use(httpx.RequestIDMiddleware())
	app.Use(pauth.AuthMiddleware(tm))
	handler.RegisterRoutes(app)
	return app, svc, tm
}

func TestAdminProductivityRanking(t *testing.T) {
	app, _, tm := setupAdminApp()
	adminToken, _ := tm.Generate("admin-1", "admin@pusat.govra.id", "Admin", "admin", "")

	req := httptest.NewRequest(http.MethodGet, "/admin/productivity", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed get productivity: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestAdminExecutiveSummary(t *testing.T) {
	app, _, tm := setupAdminApp()
	adminToken, _ := tm.Generate("admin-1", "admin@pusat.govra.id", "Admin", "admin", "")

	req := httptest.NewRequest(http.MethodGet, "/admin/executive-summary", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed get executive summary: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}
