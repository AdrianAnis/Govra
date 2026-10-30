package program_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	pauth "govra/internal/platform/auth"
	"govra/internal/platform/db"
	"govra/internal/platform/httpx"
	"govra/internal/program"

	"github.com/gofiber/fiber/v2"
)

func setupProgramApp() (*fiber.App, program.Service, *pauth.TokenManager) {
	database, _ := db.New("", "", "")
	repo := program.NewRepository(database)
	svc := program.NewService(repo)
	handler := program.NewHandler(svc)
	tm := pauth.NewTokenManager("test-jwt-secret-key-at-least-32-chars-long")

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.ErrorHandler,
	})
	app.Use(httpx.RequestIDMiddleware())
	app.Use(pauth.AuthMiddleware(tm))
	handler.RegisterRoutes(app)
	return app, svc, tm
}

func TestListRegionAndDistricts(t *testing.T) {
	app, _, _ := setupProgramApp()

	req := httptest.NewRequest(http.MethodGet, "/region", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed get region: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	distReq := httptest.NewRequest(http.MethodGet, "/districts", nil)
	distResp, err := app.Test(distReq)
	if err != nil {
		t.Fatalf("failed get districts: %v", err)
	}
	if distResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", distResp.StatusCode)
	}
}

func TestProgramFlow(t *testing.T) {
	app, _, tm := setupProgramApp()
	adminToken, _ := tm.Generate("admin-1", "admin@pusat.govra.id", "Admin", "admin", "")
	dinasToken, _ := tm.Generate("dinas-1", "dinas@kotacontoh.go.id", "Petugas DBM", "dinas", "e0000000-0000-0000-0000-000000000001")

	newProg := program.CreateProgramRequest{
		Code:         "PRG-TEST-002",
		Name:         "Pembangunan Jembatan Layang Baru",
		Description:  "Mengurai kemacetan simpul protokol",
		OpdID:        "e0000000-0000-0000-0000-000000000001",
		GoalID:       "d0000000-0000-0000-0000-000000000001",
		DistrictID:   "b0000000-0000-0000-0000-000000000001",
		StartDate:    "2026-01-01",
		EndDate:      "2026-12-31",
		BudgetPagu:   5000000000,
		MilestoneStr: []string{"Desain Teknis", "Pondasi"},
	}
	progBody, _ := json.Marshal(newProg)
	createReq := httptest.NewRequest(http.MethodPost, "/programs", bytes.NewReader(progBody))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.Header.Set("Authorization", "Bearer "+adminToken)

	createResp, err := app.Test(createReq)
	if err != nil {
		t.Fatalf("failed create program: %v", err)
	}
	if createResp.StatusCode != fiber.StatusCreated {
		t.Fatalf("expected 201, got %d", createResp.StatusCode)
	}

	updateBody, _ := json.Marshal(program.CreateUpdateRequest{
		Title:               "Pemasangan Tiang Pancang Utama",
		Content:             "Pemasangan 20 tiang pancang telah tuntas sesuai spesifikasi.",
		ProgressPercentage:  30,
		DocumentationPhotos: []string{"https://example.com/foto1.jpg"},
	})
	updReq := httptest.NewRequest(http.MethodPost, "/programs/PRG-TEST-002/updates", bytes.NewReader(updateBody))
	updReq.Header.Set("Content-Type", "application/json")
	updReq.Header.Set("Authorization", "Bearer "+dinasToken)

	updResp, err := app.Test(updReq)
	if err != nil {
		t.Fatalf("failed add update: %v", err)
	}
	if updResp.StatusCode != fiber.StatusCreated {
		t.Fatalf("expected 201, got %d", updResp.StatusCode)
	}
}
