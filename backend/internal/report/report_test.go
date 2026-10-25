package report_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"govra/internal/platform/ai"
	pauth "govra/internal/platform/auth"
	"govra/internal/platform/db"
	"govra/internal/platform/httpx"
	"govra/internal/report"
)

func setupReportApp() (*fiber.App, report.Service, *pauth.TokenManager) {
	database, _ := db.New("")
	repo := report.NewRepository(database)
	aiClient := ai.NewClient("test-gemini-key", "gemini-2.5-flash")
	svc := report.NewService(repo, aiClient)
	handler := report.NewHandler(svc)
	tm := pauth.NewTokenManager("test-jwt-secret-key-at-least-32-chars-long")

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.ErrorHandler,
	})
	app.Use(httpx.RequestIDMiddleware())
	app.Use(pauth.AuthMiddleware(tm))
	handler.RegisterRoutes(app)
	return app, svc, tm
}

func TestCreateAndTrackReport(t *testing.T) {
	app, _, tm := setupReportApp()
	pelaporToken, _ := tm.Generate("warga-1", "warga1@example.com", "Rian", "pelapor", "")

	createReqBody, _ := json.Marshal(report.CreateReportRequest{
		Title:         "Lampu Jalan Mati di Depan SD",
		Description:   "Penerangan jalan mati sudah seminggu membuat jalanan sangat gelap dan rawan kejahatan.",
		DistrictID:    "b0000000-0000-0000-0000-000000000001",
		VillageID:     "c0000000-0000-0000-0000-000000000001",
		Lat:           -6.1950,
		Lng:           106.8350,
		Visibility:    report.VisibilityPublic,
		AddressDetail: "Jalan Melati No 4",
	})
	req := httptest.NewRequest(http.MethodPost, "/reports", bytes.NewReader(createReqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+pelaporToken)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed create report: %v", err)
	}
	if resp.StatusCode != fiber.StatusCreated {
		t.Fatalf("expected 201, got %d", resp.StatusCode)
	}

	var created struct {
		Code string `json:"code"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&created)
	if created.Code == "" {
		t.Fatal("expected report code")
	}

	trackReq := httptest.NewRequest(http.MethodGet, "/me/reports/"+created.Code, nil)
	trackReq.Header.Set("Authorization", "Bearer "+pelaporToken)
	trackResp, err := app.Test(trackReq)
	if err != nil {
		t.Fatalf("failed track report: %v", err)
	}
	if trackResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", trackResp.StatusCode)
	}

	feedbackBody, _ := json.Marshal(report.FeedbackRequest{
		Confirmed: true,
		Note:      "Terima kasih sudah diperbaiki dengan cepat",
	})
	fbReq := httptest.NewRequest(http.MethodPost, "/me/reports/"+created.Code+"/resolution-feedback", bytes.NewReader(feedbackBody))
	fbReq.Header.Set("Content-Type", "application/json")
	fbReq.Header.Set("Authorization", "Bearer "+pelaporToken)
	fbResp, err := app.Test(fbReq)
	if err != nil {
		t.Fatalf("failed submit feedback: %v", err)
	}
	if fbResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", fbResp.StatusCode)
	}
}

func TestDuplicateSuggestions(t *testing.T) {
	app, _, _ := setupReportApp()

	queryBody, _ := json.Marshal(report.DuplicateQuery{
		DistrictID: "b0000000-0000-0000-0000-000000000001",
		Lat:        -6.1950,
		Lng:        106.8350,
		Title:      "Jalan berlubang",
	})
	req := httptest.NewRequest(http.MethodPost, "/reports/duplicate-suggestions", bytes.NewReader(queryBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed duplicate suggestions request: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}
