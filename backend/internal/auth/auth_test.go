package auth_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"govra/internal/auth"
	pauth "govra/internal/platform/auth"
	"govra/internal/platform/db"
	"govra/internal/platform/email"
	"govra/internal/platform/httpx"
)

func setupTestApp() (*fiber.App, auth.Service, *pauth.TokenManager) {
	database, _ := db.New("")
	repo := auth.NewRepository(database)
	tm := pauth.NewTokenManager("test-jwt-secret-key-at-least-32-chars-long")
	ec := email.NewClient("test-resend-key")
	svc := auth.NewService(repo, tm, ec)
	handler := auth.NewHandler(svc)

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.ErrorHandler,
	})
	app.Use(httpx.RequestIDMiddleware())
	app.Use(pauth.AuthMiddleware(tm))
	handler.RegisterRoutes(app)
	return app, svc, tm
}

func TestAuthRegisterAndLogin(t *testing.T) {
	app, _, _ := setupTestApp()

	regBody, _ := json.Marshal(auth.RegisterRequest{
		Email:       "warga.baru@example.com",
		Password:    "password123",
		DisplayName: "Ahmad Dahlan",
		Phone:       "081234567890",
	})
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(regBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed register request: %v", err)
	}
	if resp.StatusCode != fiber.StatusCreated {
		t.Fatalf("expected 201, got %d", resp.StatusCode)
	}

	loginBody, _ := json.Marshal(auth.LoginRequest{
		Email:    "warga.baru@example.com",
		Password: "password123",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginResp, err := app.Test(loginReq)
	if err != nil {
		t.Fatalf("failed login request: %v", err)
	}
	if loginResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", loginResp.StatusCode)
	}

	var authRes auth.AuthResponse
	_ = json.NewDecoder(loginResp.Body).Decode(&authRes)
	if authRes.Token == "" {
		t.Fatal("expected non-empty token")
	}

	meReq := httptest.NewRequest(http.MethodGet, "/me", nil)
	meReq.Header.Set("Authorization", "Bearer "+authRes.Token)
	meResp, err := app.Test(meReq)
	if err != nil {
		t.Fatalf("failed me request: %v", err)
	}
	if meResp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", meResp.StatusCode)
	}
}

func TestOTPSendAndVerify(t *testing.T) {
	_, svc, _ := setupTestApp()
	ctx := context.Background()

	err := svc.SendOTP(ctx, "warga2@example.com", "REGISTRATION")
	if err != nil {
		t.Fatalf("send otp failed: %v", err)
	}

	err = svc.VerifyOTP(ctx, auth.VerifyOTPRequest{
		Email:   "warga2@example.com",
		Code:    "000000",
		Purpose: "REGISTRATION",
	})
	if err == nil {
		t.Fatal("expected wrong code to fail")
	}
}
